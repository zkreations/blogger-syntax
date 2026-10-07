import { maskCommentsAndCdata } from '../utils/textUtils.js';

export const STRICTLY_SELF_CLOSING_BLOGGER_TAGS: ReadonlySet<string> = new Set([
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
  return STRICTLY_SELF_CLOSING_BLOGGER_TAGS.has(tagName)
    || STRICTLY_SELF_CLOSING_BLOGGER_TAGS.has(lower)
    || HTML_VOID_ELEMENTS.has(lower);
}

const TAG_SCANNER_REGEX = /<(\/)?([a-z_][\w:-]*)(?:\s((?:"[^"]*"|'[^']*'|[^"'/>])*))?(\/?)>/gi;
const INCOMPLETE_CLOSING_TAG_REGEX = /<\/([a-z_][\w:-]*)?$/i;

/**
 * Scans XML text up to an offset and returns the stack of unclosed container tags.
 * Strictly self-closing tags and HTML void elements are ignored from the stack.
 */
export function getUnclosedTagStack(text: string, offset?: number): string[] {
  let targetText = offset !== undefined ? text.slice(0, offset) : text;

  // If the text ends with an incomplete closing tag (e.g. "</" or "</b:lo"), strip it
  targetText = targetText.replace(INCOMPLETE_CLOSING_TAG_REGEX, '');

  const sanitizedText = maskCommentsAndCdata(targetText);
  const stack: string[] = [];

  TAG_SCANNER_REGEX.lastIndex = 0;
  for (const match of sanitizedText.matchAll(TAG_SCANNER_REGEX)) {
    const isClosing = match[1] === '/';
    const tagName = match[2];
    if (!tagName) {
      continue;
    }

    const hasSelfClosingSlash = match[4] === '/';
    const isSelfClosing = hasSelfClosingSlash || isStrictlySelfClosingTag(tagName);

    if (isClosing) {
      const lowerName = tagName.toLowerCase();
      let matchIndex = -1;
      for (let i = stack.length - 1; i >= 0; i--) {
        if (stack[i]!.toLowerCase() === lowerName) {
          matchIndex = i;
          break;
        }
      }

      if (matchIndex !== -1) {
        stack.splice(matchIndex);
      }
    }
    else if (!isSelfClosing) {
      stack.push(tagName);
    }
  }

  return stack;
}

/**
 * Returns the nearest unclosed tag at the given cursor position/offset.
 */
export function getNearestUnclosedTag(text: string, offset?: number): string | undefined {
  const stack = getUnclosedTagStack(text, offset);
  return stack.length > 0 ? stack[stack.length - 1] : undefined;
}
