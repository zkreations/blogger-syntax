import type { Span } from '../utils/textUtils.js';
import { maskCommentsAndCdata } from '../utils/textUtils.js';

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

const INCLUDE_TAG_REGEX = /<b:include\b((?:"[^"]*"|'[^']*'|[^"'/>])*)\/?>/gi;
const INCLUDABLE_TAG_REGEX = /<b:includable\b((?:"[^"]*"|'[^']*'|[^"'/>])*)(\/?)>/gi;
const WIDGET_TAG_REGEX = /<(\/)?b:widget\b((?:"[^"]*"|'[^']*'|[^"'/>])*)(\/?)>/gi;
const DEFAULTMARKUP_TAG_REGEX = /<(\/)?b:defaultmarkup\b((?:"[^"]*"|'[^']*'|[^"'/>])*)(\/?)>/gi;

const ATTR_NAME_REGEX = /(?<![\w:])name\s*=\s*(["'])([\s\S]*?)\1/i;
const ATTR_ID_REGEX = /\bid\s*=\s*(["'])([\s\S]*?)\1/i;
const ATTR_TYPE_REGEX = /\btype\s*=\s*(["'])([\s\S]*?)\1/i;

export function findIncludableDefinition(
  text: string,
  offset: number,
): IncludableDefinitionMatch | undefined {
  const masked = maskCommentsAndCdata(text);

  // 1. Identify if offset is inside a <b:include ...> and specifically on/near name="..."
  let targetInclude: {
    targetId: string;
    originSpan: Span;
    widgetId?: string | undefined;
    widgetType?: string | undefined;
  } | undefined;

  INCLUDE_TAG_REGEX.lastIndex = 0;
  while (true) {
    const match = INCLUDE_TAG_REGEX.exec(masked);
    if (!match) {
      break;
    }

    const tagStart = match.index;
    const tagEnd = tagStart + match[0].length;

    if (offset < tagStart || offset > tagEnd) {
      continue;
    }

    const attrContent = match[1] ?? '';
    if (/\bexpr:name\s*=/i.test(attrContent)) {
      continue;
    }

    const nameMatch = ATTR_NAME_REGEX.exec(attrContent);
    if (!nameMatch) {
      continue;
    }

    const quoteChar = nameMatch[1] ?? '"';
    const targetId = nameMatch[2] ?? '';
    const nameAttrOffset = tagStart + match[0].indexOf(nameMatch[0]);
    const valStart = nameAttrOffset + nameMatch[0].indexOf(quoteChar) + 1;
    const valEnd = valStart + targetId.length;

    // The cursor can be anywhere on the name attribute or on the whole tag
    if (offset < nameAttrOffset || offset > valEnd + 1) {
      // Allow jumping from anywhere inside <b:include> if on name or close to it
      if (offset < tagStart || offset > tagEnd) {
        continue;
      }
    }

    targetInclude = {
      targetId,
      originSpan: { start: valStart, end: valEnd },
    };
    break;
  }

  if (!targetInclude || !targetInclude.targetId) {
    return undefined;
  }

  // super.* subroutines are native Blogger core framework calls; no user definition exists
  if (targetInclude.targetId.startsWith('super.')) {
    return undefined;
  }

  // 2. Determine enclosing widget / defaultmarkup context of the <b:include> tag
  const includeOffset = targetInclude.originSpan.start;
  let enclosingWidgetId: string | undefined;
  let enclosingWidgetType: string | undefined;
  let enclosingMarkupType: string | undefined;

  WIDGET_TAG_REGEX.lastIndex = 0;
  while (true) {
    const match = WIDGET_TAG_REGEX.exec(masked);
    if (!match) {
      break;
    }
    const isClosing = Boolean(match[1]);
    const isSelfClosing = Boolean(match[3]);
    const start = match.index;

    if (!isClosing && !isSelfClosing && start < includeOffset) {
      const attrs = match[2] ?? '';
      const idMatch = ATTR_ID_REGEX.exec(attrs);
      const typeMatch = ATTR_TYPE_REGEX.exec(attrs);
      const wId = idMatch ? (idMatch[2] ?? '') : undefined;
      const wType = typeMatch ? (typeMatch[2] ?? '') : undefined;

      // Find closing </b:widget>
      const closeTagStr = '</b:widget>';
      const closeIdx = masked.indexOf(closeTagStr, start);
      if (closeIdx === -1 || closeIdx > includeOffset) {
        enclosingWidgetId = wId;
        enclosingWidgetType = wType;
      }
    }
  }

  DEFAULTMARKUP_TAG_REGEX.lastIndex = 0;
  while (true) {
    const match = DEFAULTMARKUP_TAG_REGEX.exec(masked);
    if (!match) {
      break;
    }
    const isClosing = Boolean(match[1]);
    const isSelfClosing = Boolean(match[3]);
    const start = match.index;

    if (!isClosing && !isSelfClosing && start < includeOffset) {
      const attrs = match[2] ?? '';
      const typeMatch = ATTR_TYPE_REGEX.exec(attrs);
      const mType = typeMatch ? (typeMatch[2] ?? '') : undefined;

      const closeTagStr = '</b:defaultmarkup>';
      const closeIdx = masked.indexOf(closeTagStr, start);
      if (closeIdx === -1 || closeIdx > includeOffset) {
        enclosingMarkupType = mType;
      }
    }
  }

  // 3. Scan all <b:includable> definitions in the document
  const candidates: IncludableCandidate[] = [];
  INCLUDABLE_TAG_REGEX.lastIndex = 0;
  while (true) {
    const match = INCLUDABLE_TAG_REGEX.exec(masked);
    if (!match) {
      break;
    }

    const tagStart = match.index;
    const tagEnd = tagStart + match[0].length;
    const attrs = match[1] ?? '';
    const idMatch = ATTR_ID_REGEX.exec(attrs);
    if (!idMatch) {
      continue;
    }

    const id = idMatch[2] ?? '';
    const idAttrOffset = tagStart + match[0].indexOf(idMatch[0]);
    const quoteChar = idMatch[1] ?? '"';
    const idValStart = idAttrOffset + idMatch[0].indexOf(quoteChar) + 1;
    const idValEnd = idValStart + id.length;

    // Find end of <b:includable> block
    let blockEnd = tagEnd;
    const isSelfClosing = Boolean(match[2]);
    if (!isSelfClosing) {
      const closeTag = '</b:includable>';
      const closeIdx = masked.indexOf(closeTag, tagEnd);
      if (closeIdx !== -1) {
        blockEnd = closeIdx + closeTag.length;
      }
    }

    // Determine parent widget or defaultmarkup of this includable
    let parentWidgetId: string | undefined;
    let parentMarkupType: string | undefined;

    WIDGET_TAG_REGEX.lastIndex = 0;
    while (true) {
      const wMatch = WIDGET_TAG_REGEX.exec(masked);
      if (!wMatch) {
        break;
      }
      const isClosing = Boolean(wMatch[1]);
      const isSelfClosingW = Boolean(wMatch[3]);
      const wStart = wMatch.index;

      if (!isClosing && !isSelfClosingW && wStart < tagStart) {
        const wAttrs = wMatch[2] ?? '';
        const wIdMatch = ATTR_ID_REGEX.exec(wAttrs);
        const wId = wIdMatch ? (wIdMatch[2] ?? '') : undefined;
        const closeIdx = masked.indexOf('</b:widget>', wStart);
        if (closeIdx === -1 || closeIdx > tagStart) {
          parentWidgetId = wId;
        }
      }
    }

    DEFAULTMARKUP_TAG_REGEX.lastIndex = 0;
    while (true) {
      const dmMatch = DEFAULTMARKUP_TAG_REGEX.exec(masked);
      if (!dmMatch) {
        break;
      }
      const isClosing = Boolean(dmMatch[1]);
      const isSelfClosingDM = Boolean(dmMatch[3]);
      const dmStart = dmMatch.index;

      if (!isClosing && !isSelfClosingDM && dmStart < tagStart) {
        const dmAttrs = dmMatch[2] ?? '';
        const dmTypeMatch = ATTR_TYPE_REGEX.exec(dmAttrs);
        const dmType = dmTypeMatch ? (dmTypeMatch[2] ?? '') : undefined;
        const closeIdx = masked.indexOf('</b:defaultmarkup>', dmStart);
        if (closeIdx === -1 || closeIdx > tagStart) {
          parentMarkupType = dmType;
        }
      }
    }

    candidates.push({
      id,
      parentWidgetId,
      parentMarkupType,
      tagSpan: { start: tagStart, end: tagEnd },
      idSpan: { start: idValStart, end: idValEnd },
      fullSpan: { start: tagStart, end: blockEnd },
    });
  }

  // 4. Filter and rank candidates matching targetId
  const matchingCandidates = candidates.filter(c => c.id === targetInclude.targetId);
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
    const targetType = enclosingWidgetType || enclosingMarkupType;
    for (let i = matchingCandidates.length - 1; i >= 0; i--) {
      const c = matchingCandidates[i];
      if (c && c.parentMarkupType && c.parentMarkupType.toLowerCase() === targetType?.toLowerCase()) {
        bestCandidate = c;
        break;
      }
    }
  }

  // Priority 3: In defaultmarkup of type 'Common' or 'All' (universal subroutines; last definition wins)
  if (!bestCandidate) {
    for (let i = matchingCandidates.length - 1; i >= 0; i--) {
      const c = matchingCandidates[i];
      if (
        c
        && c.parentMarkupType
        && (c.parentMarkupType.toLowerCase() === 'common' || c.parentMarkupType.toLowerCase() === 'all')
      ) {
        bestCandidate = c;
        break;
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
