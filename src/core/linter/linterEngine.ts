import type { BloggerDiagnosticCode } from 'blogger-spec';
import type { BloggerDiagnostic, BloggerQuickFix, LinterOptions } from './linterTypes.js';
import { getSpecCatalog } from 'blogger-spec/catalogs';
import { parseExpression, scanDirectiveTokens, validateTemplateStructure } from 'blogger-spec/parser';
import { tokenizeExpression } from 'blogger-spec/quota';
import { findIncludableDefinition } from '../navigation/definitionResolver.js';
import { computeLineOffsets, createRange, maskComments } from './linterUtils.js';

export { tokenizeExpression };
export type { BloggerExpressionToken as Token } from 'blogger-spec';

interface DeprecatedDataProperty {
  readonly pattern: RegExp;
  readonly message: string;
  readonly replacement?: string;
}

const DEPRECATED_DATA_PROPERTIES: readonly DeprecatedDataProperty[] = [
  {
    pattern: /\bdata:(?:blog|view)\.isMobile\b/g,
    message: 'data:blog.isMobile and data:view.isMobile are deprecated in Blogger Layouts v3. Use data:blog.isMobileRequest.',
    replacement: 'data:blog.isMobileRequest',
  },
  {
    pattern: /\bdata:blog\.canonicalUrl\b/g,
    message: 'data:blog.canonicalUrl is deprecated. Use data:blog.url.canonical.',
    replacement: 'data:blog.url.canonical',
  },
  {
    pattern: /\bdata:blog\.mobileClass\b/g,
    message: 'data:blog.mobileClass is obsolete in Blogger Layouts v3.',
  },
];

const HALLUCINATED_DATA_PROPERTIES = [
  {
    pattern: /\.(?:hasTitle|isFeatured)\b/g,
    code: 'BX1025' as BloggerDiagnosticCode,
    message: 'Property is not part of the Blogger data model (e.g. hasTitle, isFeatured do not exist).',
  },
  {
    pattern: /\bdata:(?:headerTitle|logoUrl)\b/g,
    code: 'BX1025' as BloggerDiagnosticCode,
    message: 'Property is hallucinated; Header widget uses data:title and data:image.',
  },
  {
    pattern: /\bdata:categories\b/g,
    code: 'BX1025' as BloggerDiagnosticCode,
    message: 'Property "data:categories" is hallucinated; Label widget uses "data:labels".',
  },
  {
    pattern: /\b(?:data:)?comment\.replies\b/g,
    code: 'BX1025' as BloggerDiagnosticCode,
    message: 'Nested "comment.replies" collection is hallucinated; Blogger comments are flat and filtered via (c => c.inReplyTo == comment.id).',
  },
  {
    pattern: /\b(?:data:)?(?:comment|author)\.author\.photo\.url\b|\bauthor\.photo\.url\b/g,
    code: 'BX1025' as BloggerDiagnosticCode,
    message: 'Property "author.photo.url" is hallucinated; use "author.authorPhoto.image" or "authorAvatarSrc".',
  },
];

export function lintBloggerDocument(
  documentText: string,
  options?: LinterOptions,
): readonly BloggerDiagnostic[] {
  if (!documentText) {
    return [];
  }

  const catalog = getSpecCatalog();
  const lineOffsets = computeLineOffsets(documentText);
  const maskedText = maskComments(documentText);
  const tokens = scanDirectiveTokens(documentText, { catalog });

  const specDiagnostics = validateTemplateStructure(tokens, catalog, {
    validateExpressions: true,
  });

  const diagnostics: BloggerDiagnostic[] = [];

  for (const sd of specDiagnostics) {
    const start = sd.tagStart ?? 0;
    const end = sd.tagEnd ?? start;
    const range = createRange(lineOffsets, start, end);

    const attrName = sd.attribute ?? (/Attribute '([^']+)' on/i.exec(sd.message)?.[1]);
    const quickFixes: BloggerQuickFix[] = [];
    if (sd.rule?.replacement && sd.tagStart !== undefined && sd.tagEnd !== undefined) {
      quickFixes.push({
        title: `Replace with '${sd.rule.replacement}'`,
        newText: sd.rule.replacement,
        range,
        isPreferred: true,
      });
    }
    else if (sd.code === 'BX1024' && attrName && sd.tagStart !== undefined && sd.tagEnd !== undefined) {
      quickFixes.push({
        title: `Remove obsolete attribute "${attrName}"`,
        newText: '',
        range,
        isPreferred: true,
      });
    }

    const tags: ('deprecated' | 'unnecessary')[] = [];
    if (sd.rule?.category === 'deprecation') {
      tags.push('deprecated');
    }

    diagnostics.push({
      code: sd.code,
      message: sd.message,
      severity: sd.severity,
      range,
      tags: tags.length > 0 ? tags : undefined,
      quickFixes: quickFixes.length > 0 ? quickFixes : undefined,
    });
  }

  // 1. Unresolved inclusions (BX1037)
  for (const token of tokens) {
    if (token.tagName.toLowerCase() !== 'b:include' || token.isClosing) {
      continue;
    }
    if (token.attributes['expr:name']) {
      continue;
    }
    const nameAttr = token.attributes.name;
    if (!nameAttr || !nameAttr.value) {
      continue;
    }
    const name = nameAttr.value.trim();
    if (!name) {
      continue;
    }

    // Check for obsolete / deprecated server inclusions (BX1024)
    const incMeta = catalog.getInclusion(name);
    const isDeprecated = incMeta?.deprecated != null || incMeta?.category === 'deprecated' || name === 'quickedit';
    if (isDeprecated) {
      const range = createRange(lineOffsets, token.tagStart, token.tagEnd);
      const reason = incMeta?.deprecated?.reason;
      const message = reason
        ? `Inclusion "${name}" is obsolete. ${reason}`
        : `Inclusion "${name}" is obsolete in Blogger Layouts v3.`;

      const quickFixes: BloggerQuickFix[] = [
        {
          title: `Remove obsolete inclusion "${name}"`,
          newText: '',
          range,
          isPreferred: true,
        },
      ];

      if (incMeta?.deprecated?.replacement) {
        quickFixes.unshift({
          title: `Replace with '${incMeta.deprecated.replacement}'`,
          newText: `<b:include name='${incMeta.deprecated.replacement}'/>`,
          range,
          isPreferred: true,
        });
      }

      diagnostics.push({
        code: 'BX1024',
        message,
        severity: 'warning',
        range,
        tags: ['deprecated'],
        quickFixes,
      });
      continue;
    }

    if (catalog.isServerInclusion(name)) {
      continue;
    }

    const resolved = findIncludableDefinition(documentText, nameAttr.valueStart);
    if (!resolved) {
      const rule = catalog.getDiagnostic('BX1037');
      const range = createRange(lineOffsets, nameAttr.valueStart, nameAttr.valueEnd);
      diagnostics.push({
        code: 'BX1037',
        message: rule?.message ? `Unresolved inclusion "${name}". ${rule.message}` : `Unresolved inclusion "${name}". Subroutine is not defined in the template and is not a built-in server inclusion.`,
        severity: 'error',
        range,
      });
    }
  }

  // 2. Grammatical expression validation fallback
  const expressionErrorsReportedRanges = new Set<string>();
  for (const d of diagnostics) {
    expressionErrorsReportedRanges.add(`${d.range.start.line}:${d.range.start.character}`);
  }

  for (const token of tokens) {
    if (token.isClosing) {
      continue;
    }
    for (const [attrName, attrToken] of Object.entries(token.attributes)) {
      const isExpr = catalog.isDirectiveExpressionAttribute(token.tagName, attrName) || attrName.startsWith('expr:');
      if (!isExpr || !attrToken.value || !attrToken.value.trim()) {
        continue;
      }

      try {
        parseExpression(attrToken.value, { catalog, tolerant: false });
      }
      catch (err: unknown) {
        const rangeKey = `${attrToken.valueStart}`;
        if (!expressionErrorsReportedRanges.has(rangeKey)) {
          const range = createRange(lineOffsets, attrToken.valueStart, attrToken.valueEnd);
          const errMsg = err instanceof Error ? err.message : 'Invalid Blogger expression syntax.';
          diagnostics.push({
            code: 'BX1041',
            message: errMsg,
            severity: 'error',
            range,
          });
        }
      }
    }
  }

  // 3. Deprecated data properties in expressions (BX1024)
  for (const dep of DEPRECATED_DATA_PROPERTIES) {
    for (const match of maskedText.matchAll(dep.pattern)) {
      if (match.index === undefined) {
        continue;
      }
      const start = match.index;
      const end = start + match[0].length;
      const range = createRange(lineOffsets, start, end);

      const quickFixes: BloggerQuickFix[] = [];
      if (dep.replacement) {
        quickFixes.push({
          title: `Replace with '${dep.replacement}'`,
          newText: dep.replacement,
          range,
          isPreferred: true,
        });
      }

      diagnostics.push({
        code: 'BX1024',
        message: dep.message,
        severity: 'warning',
        range,
        tags: ['deprecated'],
        quickFixes: quickFixes.length > 0 ? quickFixes : undefined,
      });
    }
  }

  // 4. Hallucinated data properties (BX1025)
  for (const hall of HALLUCINATED_DATA_PROPERTIES) {
    for (const match of maskedText.matchAll(hall.pattern)) {
      if (match.index === undefined) {
        continue;
      }
      const start = match.index;
      const end = start + match[0].length;
      const range = createRange(lineOffsets, start, end);

      diagnostics.push({
        code: hall.code,
        message: hall.message,
        severity: 'warning',
        range,
      });
    }
  }

  // 5. Unknown widget type validation
  for (const token of tokens) {
    if (token.tagName.toLowerCase() === 'b:widget' && !token.isClosing) {
      const typeAttr = token.attributes.type;
      if (typeAttr && typeAttr.value && !token.attributes['expr:type']) {
        const wType = typeAttr.value.trim();
        if (wType && !catalog.getWidget(wType)) {
          const range = createRange(lineOffsets, typeAttr.valueStart, typeAttr.valueEnd);
          diagnostics.push({
            code: 'BX1025',
            message: `Unknown widget type '${wType}'.`,
            severity: 'warning',
            range,
          });
        }
      }
    }
  }

  // 5. Filter by options if specified
  const rules = options?.rules;
  if (!rules) {
    return diagnostics;
  }

  return diagnostics.filter((diag) => {
    const ruleDef = catalog.getDiagnostic(diag.code as BloggerDiagnosticCode);
    const category = ruleDef?.category;

    if (rules.deprecations === false && (category === 'deprecation' || diag.tags?.includes('deprecated'))) {
      return false;
    }
    if (rules.hallucinations === false && category === 'hallucination') {
      return false;
    }
    if (rules.quotas === false && category === 'quota') {
      return false;
    }
    if (rules.context === false && category === 'runtime') {
      return false;
    }
    if (rules.duplicates === false && (diag.code === 'BX1033' || diag.code === 'BX1036')) {
      return false;
    }
    if (rules.inclusions === false && diag.code === 'BX1037') {
      return false;
    }
    if (rules.attributes === false && (diag.code === 'BX1022' || diag.code === 'BX1039' || diag.code === 'BX1040' || diag.code === 'BX1042')) {
      return false;
    }
    if (rules.structure === false && (category === 'structure' || diag.code === 'BX1023' || diag.code === 'BX1034' || diag.code === 'BX1035' || diag.code === 'BX1041')) {
      return false;
    }
    return true;
  });
}
