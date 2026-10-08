import type { Span } from '../utils/textUtils.js';
import { scanDirectiveTokens } from '../parser/directiveScanner.js';

export type { Span };

export type BloggerSymbolCategory
  = | 'section'
    | 'widget'
    | 'includable'
    | 'defaultmarkups'
    | 'defaultmarkup'
    | 'skin'
    | 'settings';

export interface BloggerSymbolNode {
  name: string;
  detail?: string | undefined;
  kind: BloggerSymbolCategory;
  span: Span;
  selectionSpan: Span;
  children: BloggerSymbolNode[];
}

const SUPPORTED_TAG_TYPES = new Set([
  'section',
  'widget-settings',
  'widget',
  'includable',
  'defaultmarkups',
  'defaultmarkup',
  'template-skin',
  'skin',
]);

export function indexDocumentSymbols(text: string): BloggerSymbolNode[] {
  const rootSymbols: BloggerSymbolNode[] = [];
  const stack: { node: BloggerSymbolNode; tagType: string }[] = [];
  const tokens = scanDirectiveTokens(text);

  for (const token of tokens) {
    const rawTag = token.tagName.toLowerCase();
    const tagType = rawTag.startsWith('b:') ? rawTag.slice(2) : rawTag;
    if (!SUPPORTED_TAG_TYPES.has(tagType)) {
      continue;
    }

    if (token.isClosing) {
      for (let i = stack.length - 1; i >= 0; i--) {
        if (stack[i]!.tagType === tagType) {
          const entry = stack[i]!;
          entry.node.span.end = token.tagEnd;
          stack.splice(i, 1);
          break;
        }
      }
      continue;
    }

    const attrs = token.attributes;
    const idAttr = attrs.id;
    const typeAttr = attrs.type;
    const titleAttr = attrs.title;
    const varAttr = attrs.var;
    const tagAttr = attrs.tag;

    let selectionSpan: Span = { start: token.tagStart, end: token.tagEnd };
    if (idAttr) {
      selectionSpan = { start: idAttr.valueStart, end: idAttr.valueEnd };
    }

    let name = tagType;
    let detail: string | undefined;
    let kind: BloggerSymbolCategory = 'section';

    switch (tagType) {
      case 'section': {
        kind = 'section';
        name = idAttr?.value || 'section';
        const htmlTag = tagAttr?.value || '';
        detail = htmlTag ? `<b:section tag="${htmlTag}">` : '<b:section>';
        break;
      }
      case 'widget': {
        kind = 'widget';
        const wId = idAttr?.value || 'widget';
        const wType = typeAttr?.value || '';
        name = wType ? `${wId} (${wType})` : wId;
        detail = titleAttr?.value ? `"${titleAttr.value}"` : (wType ? `Widget [${wType}]` : '<b:widget>');
        break;
      }
      case 'includable': {
        kind = 'includable';
        const incId = idAttr?.value || 'includable';
        const paramVar = varAttr?.value || '';
        name = paramVar ? `${incId}(${paramVar})` : incId;
        detail = 'includable';
        break;
      }
      case 'widget-settings': {
        kind = 'settings';
        name = 'Settings';
        detail = '<b:widget-settings>';
        break;
      }
      case 'defaultmarkups': {
        kind = 'defaultmarkups';
        name = 'Default Markups';
        detail = '<b:defaultmarkups>';
        break;
      }
      case 'defaultmarkup': {
        kind = 'defaultmarkup';
        const dmType = typeAttr?.value || 'all';
        name = `defaultmarkup (${dmType})`;
        detail = dmType;
        break;
      }
      case 'skin':
      case 'template-skin': {
        kind = 'skin';
        name = `b:${tagType}`;
        detail = 'Styles & Variables';
        break;
      }
    }

    const node: BloggerSymbolNode = {
      name,
      detail,
      kind,
      span: { start: token.tagStart, end: token.tagEnd },
      selectionSpan,
      children: [],
    };

    if (stack.length > 0) {
      stack[stack.length - 1]!.node.children.push(node);
    }
    else {
      rootSymbols.push(node);
    }

    if (!token.isSelfClosing) {
      stack.push({ node, tagType });
    }
  }

  return rootSymbols;
}
