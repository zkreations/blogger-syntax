import {
  getUnclosedDirectiveStack,
  HTML_VOID_ELEMENTS,
  isStrictlySelfClosingTag,
  STRICTLY_SELF_CLOSING_TAGS,
} from './directiveScanner.js';

export const STRICTLY_SELF_CLOSING_BLOGGER_TAGS = STRICTLY_SELF_CLOSING_TAGS;
export { HTML_VOID_ELEMENTS, isStrictlySelfClosingTag };

/**
 * Scans XML text up to an offset and returns the stack of unclosed container tags.
 * Strictly self-closing tags and HTML void elements are ignored from the stack.
 */
export function getUnclosedTagStack(text: string, offset?: number): string[] {
  return [...getUnclosedDirectiveStack(text, offset)];
}

/**
 * Returns the nearest unclosed tag at the given cursor position/offset.
 */
export function getNearestUnclosedTag(text: string, offset?: number): string | undefined {
  const stack = getUnclosedTagStack(text, offset);
  return stack.length > 0 ? stack[stack.length - 1] : undefined;
}
