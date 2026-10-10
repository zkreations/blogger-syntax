export interface DirectiveAttributeToken {
  readonly name: string;
  readonly value: string;
  readonly quote?: '"' | '\'' | undefined;
  readonly start: number;
  readonly end: number;
  readonly valueStart: number;
  readonly valueEnd: number;
}

export interface DirectiveToken {
  readonly tagName: string;
  readonly isClosing: boolean;
  readonly isSelfClosing: boolean;
  readonly hasSelfClosingSlash: boolean;
  readonly tagStart: number;
  readonly tagEnd: number;
  readonly attributesText: string;
  readonly rawAttributesText: string;
  readonly attributesOffset: number;
  readonly attributes: Record<string, DirectiveAttributeToken>;
}

export const STRICTLY_SELF_CLOSING_TAGS: ReadonlySet<string> = new Set([
  'b:attr',
  'b:case',
  'b:class',
  'b:default',
  'b:else',
  'b:elseif',
  'b:eval',
  'b:include',
  'b:param',
  'b:template-script',
  'Variable',
]);

export const HTML_VOID_ELEMENTS: ReadonlySet<string> = new Set([
  'area',
  'base',
  'br',
  'col',
  'embed',
  'hr',
  'img',
  'input',
  'link',
  'meta',
  'param',
  'source',
  'track',
  'wbr',
]);

export function isStrictlySelfClosingTag(tagName: string): boolean {
  const lower = tagName.toLowerCase();
  if (lower === 'data:' || lower.startsWith('data:')) {
    return true;
  }
  return STRICTLY_SELF_CLOSING_TAGS.has(tagName)
    || STRICTLY_SELF_CLOSING_TAGS.has(lower)
    || HTML_VOID_ELEMENTS.has(lower);
}

function maskCdataBlock(match: string): string {
  if (!match.includes('<Variable') && !match.includes('<Group') && !match.includes('</Group')) {
    return match.replace(/[^\r\n]/g, ' ');
  }

  const prefixLen = '<![CDATA['.length;
  const suffixLen = ']]>'.length;
  const inner = match.slice(prefixLen, match.length - suffixLen);

  const prefixSpaces = ' '.repeat(prefixLen);
  const suffixSpaces = ' '.repeat(suffixLen);

  const tagRegex = /<\/?(?:Variable|Group)\b(?:"[^"]*"|'[^']*'|[^"'/>])*\/?>/gi;
  let maskedInner = '';
  let lastIndex = 0;

  for (const tagMatch of inner.matchAll(tagRegex)) {
    const matchIndex = tagMatch.index ?? 0;
    const gap = inner.slice(lastIndex, matchIndex);
    maskedInner += gap.replace(/[^\r\n]/g, ' ');
    maskedInner += tagMatch[0];
    lastIndex = matchIndex + tagMatch[0].length;
  }

  const trailing = inner.slice(lastIndex);
  maskedInner += trailing.replace(/[^\r\n]/g, ' ');

  return prefixSpaces + maskedInner + suffixSpaces;
}

export function maskXmlCommentsAndCdata(text: string): string {
  let masked = text;

  if (masked.includes('<!--')) {
    masked = masked.replace(/<!--[\s\S]*?-->/g, match => match.replace(/[^\r\n]/g, ' '));
  }

  if (masked.includes('<![CDATA[')) {
    masked = masked.replace(/<!\[CDATA\[[\s\S]*?\]\]>/g, match => maskCdataBlock(match));
  }

  if (masked.includes('<b:comment')) {
    masked = masked.replace(/<b:comment\b[^>]*>[\s\S]*?<\/b:comment>/gi, match => match.replace(/[^\r\n]/g, ' '));
  }

  return masked;
}

const ATTR_PARSER_REGEX = /([\w:-]+)(?:\s*=\s*(?:(")([\s\S]*?)(")|(')([\s\S]*?)(')|([^\s"'=<>`]+)))?/g;

export function parseAttributes(
  attributesText: string,
  baseOffset: number,
): Record<string, DirectiveAttributeToken> {
  const result: Record<string, DirectiveAttributeToken> = {};
  if (!attributesText.trim()) {
    return result;
  }

  ATTR_PARSER_REGEX.lastIndex = 0;
  for (const match of attributesText.matchAll(ATTR_PARSER_REGEX)) {
    const attrName = match[1];
    if (!attrName || match.index === undefined) {
      continue;
    }

    const start = baseOffset + match.index;
    const end = start + match[0].length;

    let value = '';
    let quote: '"' | '\'' | undefined;
    let valueStart = end;
    let valueEnd = end;

    if (match[2] !== undefined && match[4] !== undefined) {
      quote = '"';
      value = match[3] ?? '';
      const quoteOffset = match[0].indexOf('"');
      valueStart = start + quoteOffset + 1;
      valueEnd = valueStart + value.length;
    }
    else if (match[5] !== undefined && match[7] !== undefined) {
      quote = '\'';
      value = match[6] ?? '';
      const quoteOffset = match[0].indexOf('\'');
      valueStart = start + quoteOffset + 1;
      valueEnd = valueStart + value.length;
    }
    else if (match[8] !== undefined) {
      value = match[8];
      const eqOffset = match[0].indexOf('=');
      valueStart = start + eqOffset + 1;
      valueEnd = end;
    }

    result[attrName] = {
      name: attrName,
      value,
      quote,
      start,
      end,
      valueStart,
      valueEnd,
    };
  }

  return result;
}

export function scanDirectiveTokens(
  text: string,
  options?: { readonly stopAtOffset?: number },
): readonly DirectiveToken[] {
  const maxOffset = options?.stopAtOffset ?? text.length;
  const maskedText = maskXmlCommentsAndCdata(text);
  const tokens: DirectiveToken[] = [];
  const len = Math.min(maskedText.length, maxOffset);

  let i = 0;
  while (i < len) {
    const openIndex = maskedText.indexOf('<', i);
    if (openIndex === -1 || openIndex >= maxOffset) {
      break;
    }

    const nextChar = maskedText[openIndex + 1];
    if (!nextChar || nextChar === '!' || nextChar === '?') {
      i = openIndex + 1;
      continue;
    }

    const isClosing = nextChar === '/';
    const nameStart = isClosing ? openIndex + 2 : openIndex + 1;

    let nameEnd = nameStart;
    while (nameEnd < len && /[\w:.-]/.test(maskedText[nameEnd]!)) {
      nameEnd++;
    }

    if (nameEnd === nameStart) {
      i = openIndex + 1;
      continue;
    }

    const tagName = maskedText.slice(nameStart, nameEnd);
    const attributesOffset = nameEnd;

    let inQuote: '"' | '\'' | null = null;
    let tagEnd = -1;
    let j = nameEnd;

    while (j < len) {
      const c = maskedText[j];
      if (inQuote) {
        if (c === inQuote) {
          inQuote = null;
        }
      }
      else {
        if (c === '"' || c === '\'') {
          inQuote = c;
        }
        else if (c === '<') {
          break;
        }
        else if (c === '>') {
          tagEnd = j;
          break;
        }
      }
      j++;
    }

    if (tagEnd === -1) {
      i = openIndex + 1;
      continue;
    }

    const rawContent = maskedText.slice(attributesOffset, tagEnd);
    const hasSelfClosingSlash = rawContent.trimEnd().endsWith('/');
    const isSelfClosing = !isClosing && (hasSelfClosingSlash || isStrictlySelfClosingTag(tagName));

    const cleanAttrsText = hasSelfClosingSlash
      ? rawContent.slice(0, rawContent.lastIndexOf('/'))
      : rawContent;

    const attributes = isClosing ? {} : parseAttributes(cleanAttrsText, attributesOffset);

    tokens.push({
      tagName,
      isClosing,
      isSelfClosing,
      hasSelfClosingSlash,
      tagStart: openIndex,
      tagEnd: tagEnd + 1,
      attributesText: cleanAttrsText,
      rawAttributesText: rawContent,
      attributesOffset,
      attributes,
    });

    i = tagEnd + 1;
  }

  return tokens;
}

export function getUnclosedDirectiveStack(text: string, offset?: number): readonly string[] {
  let targetText = offset !== undefined ? text.slice(0, offset) : text;
  // Strip trailing incomplete closing tag if present (e.g. "</b:" or "</")
  targetText = targetText.replace(/<\/([a-z_][\w:-]*)?$/i, '');

  const tokens = scanDirectiveTokens(targetText);
  const stack: string[] = [];

  for (const token of tokens) {
    if (token.isClosing) {
      const lower = token.tagName.toLowerCase();
      let matchIdx = -1;
      for (let i = stack.length - 1; i >= 0; i--) {
        if (stack[i]!.toLowerCase() === lower) {
          matchIdx = i;
          break;
        }
      }
      if (matchIdx !== -1) {
        stack.splice(matchIdx);
      }
    }
    else if (!token.isSelfClosing) {
      stack.push(token.tagName);
    }
  }

  return stack;
}
