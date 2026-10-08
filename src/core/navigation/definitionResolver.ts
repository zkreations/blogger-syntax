import type { Span } from '../utils/textUtils.js';
import { scanDirectiveTokens } from '../parser/directiveScanner.js';

export type { Span };

export interface IncludableDefinitionMatch {
  targetId: string;
  originSpan: Span;
  targetSpan: Span;
  targetSelectionSpan: Span;
}

interface IncludableCandidate {
  id: string;
  parentWidgetId?: string | undefined;
  parentMarkupType?: string | undefined;
  tagSpan: Span;
  idSpan: Span;
  fullSpan: Span;
}

interface ContainerFrame {
  tag: 'widget' | 'defaultmarkup';
  widgetId?: string | undefined;
  widgetType?: string | undefined;
  markupType?: string | undefined;
}

export function findIncludableDefinition(
  text: string,
  offset: number,
): IncludableDefinitionMatch | undefined {
  const tokens = scanDirectiveTokens(text);

  let targetInclude: {
    targetId: string;
    originSpan: Span;
    widgetId?: string | undefined;
    widgetType?: string | undefined;
    markupType?: string | undefined;
  } | undefined;

  const candidates: IncludableCandidate[] = [];
  const containerStack: ContainerFrame[] = [];
  const openIncludables: IncludableCandidate[] = [];

  for (const token of tokens) {
    const lowerTag = token.tagName.toLowerCase();

    if (token.isClosing) {
      if (lowerTag === 'b:widget' || lowerTag === 'b:defaultmarkup') {
        const frameTag = lowerTag === 'b:widget' ? 'widget' : 'defaultmarkup';
        for (let i = containerStack.length - 1; i >= 0; i--) {
          if (containerStack[i]!.tag === frameTag) {
            containerStack.splice(i, 1);
            break;
          }
        }
      }
      else if (lowerTag === 'b:includable') {
        const lastOpen = openIncludables.pop();
        if (lastOpen) {
          lastOpen.fullSpan.end = token.tagEnd;
        }
      }
      continue;
    }

    // Opening / self-closing container tags
    if (lowerTag === 'b:widget') {
      const frame: ContainerFrame = {
        tag: 'widget',
        widgetId: token.attributes.id?.value,
        widgetType: token.attributes.type?.value,
      };
      if (!token.isSelfClosing) {
        containerStack.push(frame);
      }
    }
    else if (lowerTag === 'b:defaultmarkup') {
      const frame: ContainerFrame = {
        tag: 'defaultmarkup',
        markupType: token.attributes.type?.value,
      };
      if (!token.isSelfClosing) {
        containerStack.push(frame);
      }
    }
    else if (lowerTag === 'b:include') {
      if (offset >= token.tagStart && offset <= token.tagEnd) {
        const nameAttr = token.attributes.name;
        const hasExprName = Boolean(token.attributes['expr:name']);

        if (!hasExprName && nameAttr && nameAttr.value) {
          // Check if cursor is on name attribute or anywhere on tag
          const currentWidget = [...containerStack].reverse().find(f => f.tag === 'widget');
          const currentMarkup = [...containerStack].reverse().find(f => f.tag === 'defaultmarkup');

          targetInclude = {
            targetId: nameAttr.value,
            originSpan: { start: nameAttr.valueStart, end: nameAttr.valueEnd },
            widgetId: currentWidget?.widgetId,
            widgetType: currentWidget?.widgetType,
            markupType: currentMarkup?.markupType,
          };
        }
      }
    }
    else if (lowerTag === 'b:includable') {
      const idAttr = token.attributes.id;
      if (idAttr && idAttr.value) {
        const currentWidget = [...containerStack].reverse().find(f => f.tag === 'widget');
        const currentMarkup = [...containerStack].reverse().find(f => f.tag === 'defaultmarkup');

        const candidate: IncludableCandidate = {
          id: idAttr.value,
          parentWidgetId: currentWidget?.widgetId,
          parentMarkupType: currentMarkup?.markupType,
          tagSpan: { start: token.tagStart, end: token.tagEnd },
          idSpan: { start: idAttr.valueStart, end: idAttr.valueEnd },
          fullSpan: { start: token.tagStart, end: token.tagEnd },
        };

        candidates.push(candidate);
        if (!token.isSelfClosing) {
          openIncludables.push(candidate);
        }
      }
    }
  }

  if (!targetInclude || !targetInclude.targetId) {
    return undefined;
  }

  // super.* subroutines are native Blogger core framework calls; no user definition exists
  if (targetInclude.targetId.startsWith('super.')) {
    return undefined;
  }

  const enclosingWidgetId = targetInclude.widgetId;
  const enclosingWidgetType = targetInclude.widgetType;
  const enclosingMarkupType = targetInclude.markupType;

  // Filter and rank candidates matching targetId
  const matchingCandidates = candidates.filter(c => c.id === targetInclude!.targetId);
  if (matchingCandidates.length === 0) {
    return undefined;
  }

  let bestCandidate: IncludableCandidate | undefined;

  // Priority 1: In the same widget (last definition wins)
  if (enclosingWidgetId) {
    for (let i = matchingCandidates.length - 1; i >= 0; i--) {
      const c = matchingCandidates[i];
      if (c && c.parentWidgetId === enclosingWidgetId) {
        bestCandidate = c;
        break;
      }
    }
  }

  // Priority 2: In defaultmarkup matching widget's type or enclosing markup type (last definition wins)
  if (!bestCandidate && (enclosingWidgetType || enclosingMarkupType)) {
    const targetTypes = [
      ...(enclosingWidgetType ? [enclosingWidgetType.toLowerCase()] : []),
      ...(enclosingMarkupType ? enclosingMarkupType.split(',').map(s => s.trim().toLowerCase()) : []),
    ];
    for (let i = matchingCandidates.length - 1; i >= 0; i--) {
      const c = matchingCandidates[i];
      if (c && c.parentMarkupType) {
        const candidateTypes = c.parentMarkupType.split(',').map(s => s.trim().toLowerCase());
        if (candidateTypes.some(ct => targetTypes.includes(ct))) {
          bestCandidate = c;
          break;
        }
      }
    }
  }

  // Priority 3: In defaultmarkup of type 'Common' or 'All' (universal subroutines; last definition wins)
  if (!bestCandidate) {
    for (let i = matchingCandidates.length - 1; i >= 0; i--) {
      const c = matchingCandidates[i];
      if (c && c.parentMarkupType) {
        const candidateTypes = c.parentMarkupType.split(',').map(s => s.trim().toLowerCase());
        if (candidateTypes.includes('common') || candidateTypes.includes('all')) {
          bestCandidate = c;
          break;
        }
      }
    }
  }

  // Priority 4: Fallback to the last matching candidate in the document (excluding private includables of other widgets)
  if (!bestCandidate) {
    for (let i = matchingCandidates.length - 1; i >= 0; i--) {
      const c = matchingCandidates[i];
      if (c && (!enclosingWidgetId || !c.parentWidgetId || c.parentWidgetId === enclosingWidgetId)) {
        bestCandidate = c;
        break;
      }
    }
  }

  if (!bestCandidate) {
    return undefined;
  }

  return {
    targetId: targetInclude.targetId,
    originSpan: targetInclude.originSpan,
    targetSpan: bestCandidate.fullSpan,
    targetSelectionSpan: bestCandidate.idSpan,
  };
}
