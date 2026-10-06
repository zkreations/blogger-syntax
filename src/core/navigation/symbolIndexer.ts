export interface Span {
  start: number;
  end: number;
}

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

function maskCommentsAndCdata(text: string): string {
  if (!text.includes('<!--') && !text.includes('<![CDATA[')) {
    return text;
  }
  return text.replace(/<!--[\s\S]*?-->|<!\[CDATA\[[\s\S]*?\]\]>/g, (m) => {
    return m.replace(/[^\r\n]/g, ' ');
  });
}

const SYMBOL_TAG_REGEX = /<(\/)?b:(section|widget-settings|widget|includable|defaultmarkups|defaultmarkup|template-skin|skin)\b((?:"[^"]*"|'[^']*'|[^"'/>])*)(\/?)>/gi;

const ATTR_ID_REGEX = /\bid\s*=\s*(["'])([\s\S]*?)\1/i;
const ATTR_TYPE_REGEX = /\btype\s*=\s*(["'])([\s\S]*?)\1/i;
const ATTR_TITLE_REGEX = /\btitle\s*=\s*(["'])([\s\S]*?)\1/i;
const ATTR_VAR_REGEX = /\bvar\s*=\s*(["'])([\s\S]*?)\1/i;
const ATTR_TAG_REGEX = /\btag\s*=\s*(["'])([\s\S]*?)\1/i;

export function indexDocumentSymbols(text: string): BloggerSymbolNode[] {
  const rootSymbols: BloggerSymbolNode[] = [];
  const stack: { node: BloggerSymbolNode; tagType: string }[] = [];
  const masked = maskCommentsAndCdata(text);

  SYMBOL_TAG_REGEX.lastIndex = 0;
  while (true) {
    const match = SYMBOL_TAG_REGEX.exec(masked);
    if (!match) {
      break;
    }

    const isClosing = Boolean(match[1]);
    const tagType = (match[2] ?? '').toLowerCase();
    const attrs = match[3] ?? '';
    const isSelfClosing = Boolean(match[4]);
    const tagStart = match.index;
    const tagEnd = tagStart + match[0].length;

    if (isClosing) {
      // Find matching open tag in stack
      for (let i = stack.length - 1; i >= 0; i--) {
        if (stack[i]!.tagType === tagType) {
          const entry = stack[i]!;
          entry.node.span.end = tagEnd;
          stack.splice(i, 1);
          break;
        }
      }
      continue;
    }

    // Opening tag: extract details
    let name = tagType;
    let detail: string | undefined;
    let kind: BloggerSymbolCategory = 'section';
    let selectionSpan: Span = { start: tagStart, end: tagEnd };

    const idMatch = ATTR_ID_REGEX.exec(attrs);
    const typeMatch = ATTR_TYPE_REGEX.exec(attrs);
    const titleMatch = ATTR_TITLE_REGEX.exec(attrs);
    const varMatch = ATTR_VAR_REGEX.exec(attrs);
    const htmlTagMatch = ATTR_TAG_REGEX.exec(attrs);

    if (idMatch) {
      const quoteChar = idMatch[1] ?? '"';
      const idVal = idMatch[2] ?? '';
      const idAttrOffset = tagStart + match[0].indexOf(idMatch[0]);
      const idValStart = idAttrOffset + idMatch[0].indexOf(quoteChar) + 1;
      selectionSpan = { start: idValStart, end: idValStart + idVal.length };
    }

    switch (tagType) {
      case 'section': {
        kind = 'section';
        const secId = idMatch ? (idMatch[2] ?? '') : 'section';
        name = secId;
        const htmlTag = htmlTagMatch ? (htmlTagMatch[2] ?? '') : '';
        detail = htmlTag ? `<b:section tag="${htmlTag}">` : '<b:section>';
        break;
      }
      case 'widget': {
        kind = 'widget';
        const wId = idMatch ? (idMatch[2] ?? '') : 'widget';
        const wType = typeMatch ? (typeMatch[2] ?? '') : '';
        name = wType ? `${wId} (${wType})` : wId;
        detail = titleMatch ? `"${titleMatch[2]}"` : (wType ? `Widget [${wType}]` : '<b:widget>');
        break;
      }
      case 'includable': {
        kind = 'includable';
        const incId = idMatch ? (idMatch[2] ?? '') : 'includable';
        const paramVar = varMatch ? (varMatch[2] ?? '') : '';
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
        const dmType = typeMatch ? (typeMatch[2] ?? '') : 'all';
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
      span: { start: tagStart, end: tagEnd },
      selectionSpan,
      children: [],
    };

    if (stack.length > 0) {
      stack[stack.length - 1]!.node.children.push(node);
    }
    else {
      rootSymbols.push(node);
    }

    if (!isSelfClosing) {
      stack.push({ node, tagType });
    }
  }

  return rootSymbols;
}
