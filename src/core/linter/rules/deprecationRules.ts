import type { BloggerDiagnostic } from '../linterTypes.js';
import { createRange } from '../linterUtils.js';

const DEPRECATED_SECTION_ATTRS = new Set(['growth', 'mobile', 'maxwidgets']);
const DEPRECATED_WIDGET_ATTRS = new Set(['mobile']);

const SECTION_TAG_REGEX = /<b:section\b([^>]*)/gi;
const WIDGET_TAG_REGEX = /<b:widget\b([^>]*)/gi;
const ATTR_SCANNER_REGEX = /(\s+)([\w:-]+)(?:\s*=\s*(["'])([\s\S]*?)\3|\s*=\s*([^\s>]+))?/g;
const DEPRECATED_DATA_IS_MOBILE_REGEX = /\bdata:blog\.isMobile\b/g;
const DEPRECATED_DATA_VIEW_IS_MOBILE_REGEX = /\bdata:view\.isMobile\b/g;
const DEPRECATED_DATA_MOBILE_CLASS_REGEX = /\bdata:blog\.mobileClass\b/g;
const DEPRECATED_CANONICAL_URL_MAP: readonly { pattern: RegExp; replacement: string; desc: string }[] = [
  { pattern: /\bdata:blog\.canonicalUrl\b/g, replacement: 'data:blog.url.canonical', desc: 'data:blog.canonicalUrl' },
  { pattern: /\bdata:blog\.canonicalHomepageUrl\b/g, replacement: 'data:blog.homepageUrl.canonical', desc: 'data:blog.canonicalHomepageUrl' },
  { pattern: /\bdata:post\.canonicalUrl\b/g, replacement: 'data:post.url.canonical', desc: 'data:post.canonicalUrl' },
];
const OBSOLETE_INCLUSIONS_REGEX = /<b:include\s[^>]*\bname\s*=\s*['"](quickedit|googlePlusBootstrap)['"][^>]*>/gi;

export function checkDeprecations(
  _text: string,
  maskedText: string,
  lineOffsets: readonly number[],
): BloggerDiagnostic[] {
  const diagnostics: BloggerDiagnostic[] = [];

  // 1. Check deprecated attributes on <b:section>
  for (const match of maskedText.matchAll(SECTION_TAG_REGEX)) {
    const tagAttrs = match[1] ?? '';
    const tagAttrsStart = (match.index ?? 0) + '<b:section'.length;

    for (const attrMatch of tagAttrs.matchAll(ATTR_SCANNER_REGEX)) {
      const leadingSpace = attrMatch[1] ?? ' ';
      const attrName = attrMatch[2] ?? '';

      if (DEPRECATED_SECTION_ATTRS.has(attrName)) {
        const fullMatchLength = attrMatch[0].length;
        const attrOffset = tagAttrsStart + (attrMatch.index ?? 0);
        const removalRange = createRange(lineOffsets, attrOffset, attrOffset + fullMatchLength);
        const attrOnlyRange = createRange(
          lineOffsets,
          attrOffset + leadingSpace.length,
          attrOffset + leadingSpace.length + attrName.length,
        );

        diagnostics.push({
          code: 'blogger.deprecated.section-attribute',
          message: `The attribute "${attrName}" on <b:section> is obsolete in Blogger Layouts v3.`,
          severity: 'warning',
          range: attrOnlyRange,
          tags: ['deprecated'],
          quickFixes: [
            {
              title: `Remove obsolete attribute "${attrName}"`,
              newText: '',
              range: removalRange,
              isPreferred: true,
            },
          ],
        });
      }
    }
  }

  // 2. Check deprecated attributes on <b:widget>
  for (const match of maskedText.matchAll(WIDGET_TAG_REGEX)) {
    const tagAttrs = match[1] ?? '';
    const tagAttrsStart = (match.index ?? 0) + '<b:widget'.length;

    for (const attrMatch of tagAttrs.matchAll(ATTR_SCANNER_REGEX)) {
      const leadingSpace = attrMatch[1] ?? ' ';
      const attrName = attrMatch[2] ?? '';

      if (DEPRECATED_WIDGET_ATTRS.has(attrName)) {
        const fullMatchLength = attrMatch[0].length;
        const attrOffset = tagAttrsStart + (attrMatch.index ?? 0);
        const removalRange = createRange(lineOffsets, attrOffset, attrOffset + fullMatchLength);
        const attrOnlyRange = createRange(
          lineOffsets,
          attrOffset + leadingSpace.length,
          attrOffset + leadingSpace.length + attrName.length,
        );

        diagnostics.push({
          code: 'blogger.deprecated.widget-attribute',
          message: `The attribute "${attrName}" on <b:widget> is obsolete in Blogger Layouts v3. Use responsive CSS or modern widget settings.`,
          severity: 'warning',
          range: attrOnlyRange,
          tags: ['deprecated'],
          quickFixes: [
            {
              title: `Remove obsolete attribute "${attrName}"`,
              newText: '',
              range: removalRange,
              isPreferred: true,
            },
          ],
        });
      }
    }
  }

  // 3. Check data:blog.isMobile and data:view.isMobile
  for (const match of maskedText.matchAll(DEPRECATED_DATA_IS_MOBILE_REGEX)) {
    if (match.index === undefined) {
      continue;
    }
    const start = match.index;
    const end = start + match[0].length;
    const range = createRange(lineOffsets, start, end);

    diagnostics.push({
      code: 'blogger.deprecated.isMobile',
      message: '"data:blog.isMobile" is deprecated in Blogger Layouts v3. Use "data:blog.isMobileRequest" or CSS media queries for responsive layouts.',
      severity: 'warning',
      range,
      tags: ['deprecated'],
      quickFixes: [
        {
          title: 'Replace with "data:blog.isMobileRequest"',
          newText: 'data:blog.isMobileRequest',
          range,
          isPreferred: true,
        },
      ],
    });
  }

  for (const match of maskedText.matchAll(DEPRECATED_DATA_VIEW_IS_MOBILE_REGEX)) {
    if (match.index === undefined) {
      continue;
    }
    const start = match.index;
    const end = start + match[0].length;
    const range = createRange(lineOffsets, start, end);

    diagnostics.push({
      code: 'blogger.deprecated.isMobile',
      message: '"data:view.isMobile" is non-functional in Blogger Layouts v3. Use "data:blog.isMobileRequest" for ?m=1 detection or CSS media queries for responsive layouts.',
      severity: 'warning',
      range,
      tags: ['deprecated'],
      quickFixes: [
        {
          title: 'Replace with "data:blog.isMobileRequest"',
          newText: 'data:blog.isMobileRequest',
          range,
          isPreferred: true,
        },
      ],
    });
  }

  // 4. Check data:blog.mobileClass
  for (const match of maskedText.matchAll(DEPRECATED_DATA_MOBILE_CLASS_REGEX)) {
    if (match.index === undefined) {
      continue;
    }
    const start = match.index;
    const end = start + match[0].length;
    const range = createRange(lineOffsets, start, end);

    diagnostics.push({
      code: 'blogger.deprecated.mobileClass',
      message: '"data:blog.mobileClass" is obsolete in Blogger Layouts v3.',
      severity: 'warning',
      range,
      tags: ['deprecated'],
    });
  }

  // 5. Check deprecated canonical url properties
  for (const item of DEPRECATED_CANONICAL_URL_MAP) {
    for (const match of maskedText.matchAll(item.pattern)) {
      if (match.index === undefined) {
        continue;
      }
      const start = match.index;
      const end = start + match[0].length;
      const range = createRange(lineOffsets, start, end);

      diagnostics.push({
        code: 'blogger.deprecated.canonicalUrl',
        message: `"${item.desc}" is deprecated. Use "${item.replacement}".`,
        severity: 'warning',
        range,
        tags: ['deprecated'],
        quickFixes: [
          {
            title: `Replace with "${item.replacement}"`,
            newText: item.replacement,
            range,
            isPreferred: true,
          },
        ],
      });
    }
  }

  // 6. Check obsolete inclusions: quickedit, googlePlusBootstrap
  for (const match of maskedText.matchAll(OBSOLETE_INCLUSIONS_REGEX)) {
    if (match.index === undefined) {
      continue;
    }
    const incName = match[1] ?? '';
    const start = match.index;
    const end = start + match[0].length;
    const range = createRange(lineOffsets, start, end);

    diagnostics.push({
      code: 'blogger.deprecated.inclusion',
      message: `Inclusion "${incName}" is obsolete and defunct in Blogger Layouts v3. Remove tag entirely.`,
      severity: 'warning',
      range,
      tags: ['deprecated'],
      quickFixes: [
        {
          title: `Remove obsolete inclusion "${incName}"`,
          newText: '',
          range,
          isPreferred: true,
        },
      ],
    });
  }

  return diagnostics;
}
