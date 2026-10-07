import type { TextPosition, TextRange } from './linterTypes.js';

/**
 * Computes an array of start offsets for each line in the text.
 */
export function computeLineOffsets(text: string): number[] {
  const offsets: number[] = [0];
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '\n') {
      offsets.push(i + 1);
    }
  }
  return offsets;
}

/**
 * Converts a character offset into line and character 0-indexed position.
 */
export function offsetToPosition(lineOffsets: readonly number[], offset: number): TextPosition {
  if (offset <= 0) {
    return { line: 0, character: 0 };
  }

  let low = 0;
  let high = lineOffsets.length - 1;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const lineStart = lineOffsets[mid]!;

    if (lineStart <= offset) {
      if (mid === lineOffsets.length - 1 || lineOffsets[mid + 1]! > offset) {
        return {
          line: mid,
          character: offset - lineStart,
        };
      }
      low = mid + 1;
    }
    else {
      high = mid - 1;
    }
  }

  return { line: 0, character: offset };
}

/**
 * Creates a TextRange from absolute character offsets.
 */
export function createRange(
  lineOffsets: readonly number[],
  startOffset: number,
  endOffset: number,
): TextRange {
  return {
    start: offsetToPosition(lineOffsets, startOffset),
    end: offsetToPosition(lineOffsets, endOffset),
  };
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

/**
 * Masks XML comments, CDATA blocks, and <b:comment> bodies with whitespace,
 * preserving character offsets and line breaks.
 */
export function maskComments(text: string): string {
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

export interface ScannedTag {
  readonly tagName: string;
  readonly tagContent: string;
  readonly tagContentOffset: number;
  readonly tagStart: number;
  readonly tagEnd: number;
}

/**
 * Scans opening and self-closing XML tags while properly ignoring '>' inside attribute quotes.
 */
export function scanXmlTags(text: string): ScannedTag[] {
  const tags: ScannedTag[] = [];
  const len = text.length;
  let i = 0;

  while (i < len) {
    const openIndex = text.indexOf('<', i);
    if (openIndex === -1) {
      break;
    }

    const nextChar = text[openIndex + 1];
    // Skip closing tags, comments, CDATA, declarations
    if (!nextChar || nextChar === '/' || nextChar === '!' || nextChar === '?') {
      i = openIndex + 1;
      continue;
    }

    let nameEnd = openIndex + 1;
    while (nameEnd < len && /[\w:-]/.test(text[nameEnd]!)) {
      nameEnd++;
    }

    if (nameEnd === openIndex + 1) {
      i = openIndex + 1;
      continue;
    }

    const tagName = text.slice(openIndex + 1, nameEnd);
    const tagContentOffset = nameEnd;

    let inQuote: '"' | '\'' | null = null;
    let tagEnd = -1;
    let j = nameEnd;

    while (j < len) {
      const c = text[j];
      if (inQuote) {
        if (c === inQuote) {
          inQuote = null;
        }
      }
      else {
        if (c === '"' || c === '\'') {
          inQuote = c;
        }
        else if (c === '>') {
          tagEnd = j;
          break;
        }
      }
      j++;
    }

    if (tagEnd === -1) {
      break;
    }

    const tagContent = text.slice(tagContentOffset, tagEnd);
    tags.push({
      tagName,
      tagContent,
      tagContentOffset,
      tagStart: openIndex,
      tagEnd: tagEnd + 1,
    });

    i = tagEnd + 1;
  }

  return tags;
}
