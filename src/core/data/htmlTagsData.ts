import type { BloggerDataType, BloggerSuggestion } from '../models/types.js';

export const RECOMMENDED_HTML_TAGS = [
  'div',
  'span',
  'article',
  'section',
  'header',
  'footer',
  'aside',
  'nav',
  'main',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'p',
  'button',
  'a',
  'ul',
  'ol',
  'li',
  'figure',
  'figcaption',
  'time',
  'img',
  'blockquote',
  'pre',
  'code',
] as const;

export const htmlTagSuggestions: readonly BloggerSuggestion[] = Object.freeze(
  RECOMMENDED_HTML_TAGS.map((tag): BloggerSuggestion => ({
    name: tag,
    type: 'string' as BloggerDataType,
    kind: 'property',
    detail: '(HTML Element — Recommended)',
    description: `Standard HTML element <${tag}>. Note: <b:tag> dynamically generates any valid W3C HTML element.`,
    example: `<b:tag name="${tag}">\n  $0\n</b:tag>`,
  })),
);

export function getHtmlTagSuggestions(): readonly BloggerSuggestion[] {
  return htmlTagSuggestions;
}
