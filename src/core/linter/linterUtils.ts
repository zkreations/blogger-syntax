import type { TextPosition, TextRange } from './linterTypes.js';

import { maskXmlCommentsAndCdata, scanDirectiveTokens } from '../parser/directiveScanner.js';

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

/**
 * Masks XML comments, CDATA blocks, and <b:comment> bodies with whitespace,
 * preserving character offsets and line breaks.
 */
export function maskComments(text: string): string {
  return maskXmlCommentsAndCdata(text);
}

export interface ScannedTag {
  readonly tagName: string;
  readonly tagContent: string;
  readonly tagContentOffset: number;
  readonly tagStart: number;
  readonly tagEnd: number;
  readonly hasSelfClosingSlash: boolean;
}

/**
 * Scans opening and self-closing XML tags while properly ignoring '>' inside attribute quotes.
 */
export function scanXmlTags(text: string): ScannedTag[] {
  const tokens = scanDirectiveTokens(text);
  return tokens
    .filter(t => !t.isClosing)
    .map(t => ({
      tagName: t.tagName,
      tagContent: t.rawAttributesText,
      tagContentOffset: t.attributesOffset,
      tagStart: t.tagStart,
      tagEnd: t.tagEnd,
      hasSelfClosingSlash: t.hasSelfClosingSlash,
    }));
}
