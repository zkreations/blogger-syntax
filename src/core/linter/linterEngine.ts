import type { BloggerDiagnosticCode } from 'blogger-spec';
import type { BloggerDiagnostic, BloggerQuickFix, BloggerTextEdit, LinterOptions } from './linterTypes.js';
import { STRICTLY_SELF_CLOSING_TAGS } from 'blogger-spec';
import { getSpecCatalog } from 'blogger-spec/catalogs';
import { parseExpression, scanDirectiveTokens, validateTemplateStructure } from 'blogger-spec/parser';
import { tokenizeExpression } from 'blogger-spec/quota';
import { findIncludableDefinition } from '../navigation/definitionResolver.js';
import { computeLineOffsets, createRange, maskComments } from './linterUtils.js';

export { tokenizeExpression };
export type { BloggerExpressionToken as Token } from 'blogger-spec';

type DirectiveToken = ReturnType<typeof scanDirectiveTokens>[number];

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

const INVERTED_ATTR_MAP: Readonly<Record<string, string>> = {
  BX1014: 'var',
  BX1015: 'id',
  BX1016: 'name',
};

interface HallucinatedDirectiveConfig {
  readonly targetTag: string;
  readonly attrMap: Readonly<Record<string, string>>;
  readonly requiredAttrs?: readonly string[];
}

const HALLUCINATED_DIRECTIVE_MAP: Readonly<Record<string, HallucinatedDirectiveConfig>> = {
  BX1001: {
    targetTag: 'b:loop',
    attrMap: { each: 'var', item: 'var', as: 'var', var: 'var', in: 'values', of: 'values', items: 'values', collection: 'values', values: 'values', index: 'index' },
    requiredAttrs: ['values'],
  },
  BX1002: {
    targetTag: 'b:loop',
    attrMap: { each: 'var', item: 'var', as: 'var', var: 'var', in: 'values', of: 'values', items: 'values', collection: 'values', values: 'values', index: 'index' },
    requiredAttrs: ['values'],
  },
  BX1003: {
    targetTag: 'b:with',
    attrMap: { name: 'var', var: 'var', id: 'var', key: 'var', value: 'value', val: 'value', expr: 'value' },
    requiredAttrs: ['value', 'var'],
  },
  BX1004: {
    targetTag: 'b:with',
    attrMap: { name: 'var', var: 'var', id: 'var', key: 'var', value: 'value', val: 'value', expr: 'value' },
    requiredAttrs: ['value', 'var'],
  },
  BX1005: {
    targetTag: 'b:with',
    attrMap: { name: 'var', var: 'var', id: 'var', key: 'var', value: 'value', val: 'value', expr: 'value' },
    requiredAttrs: ['value', 'var'],
  },
  BX1006: {
    targetTag: 'b:elseif',
    attrMap: { cond: 'cond', test: 'cond', expr: 'cond' },
    requiredAttrs: ['cond'],
  },
  BX1007: {
    targetTag: 'b:switch',
    attrMap: { var: 'var', expr: 'var', value: 'var' },
  },
  BX1008: {
    targetTag: 'b:case',
    attrMap: { value: 'value', val: 'value', test: 'value', expr: 'value', cond: 'value' },
    requiredAttrs: ['value'],
  },
  BX1009: {
    targetTag: 'b:default',
    attrMap: {},
  },
  BX1010: {
    targetTag: 'b:includable',
    attrMap: { id: 'id', name: 'id' },
    requiredAttrs: ['id'],
  },
  BX1011: {
    targetTag: 'b:includable',
    attrMap: { id: 'id', name: 'id' },
    requiredAttrs: ['id'],
  },
  BX1012: {
    targetTag: 'b:includable',
    attrMap: { id: 'id', name: 'id' },
    requiredAttrs: ['id'],
  },
};

function buildHallucinatedDirectiveQuickFix(
  sd: { readonly code: string; readonly tagStart?: number | undefined; readonly tagEnd?: number | undefined },
  config: HallucinatedDirectiveConfig,
  tokens: readonly DirectiveToken[],
  lineOffsets: readonly number[],
  documentText: string,
): BloggerQuickFix | undefined {
  if (sd.tagStart === undefined || sd.tagEnd === undefined) {
    return undefined;
  }

  const openToken = tokens.find(t => t.tagStart === sd.tagStart && t.tagEnd === sd.tagEnd)
    ?? tokens.find(t => t.tagStart <= sd.tagStart! && t.tagEnd >= sd.tagEnd!);

  if (!openToken) {
    return undefined;
  }

  const isStrictlySelfClosing = STRICTLY_SELF_CLOSING_TAGS.has(config.targetTag);
  const parts: string[] = [];
  const handledAttrs = new Set<string>();
  const rawAttrs = openToken.attributes ?? {};

  for (const [attrName, attr] of Object.entries(rawAttrs)) {
    if (!attr) {
      continue;
    }
    let prefix = '';
    let baseName = attrName;
    if (attrName.startsWith('expr:')) {
      prefix = 'expr:';
      baseName = attrName.slice(5);
    }
    const targetName = config.attrMap[baseName] ?? baseName;
    const finalName = `${prefix}${targetName}`;
    handledAttrs.add(targetName);
    const quote = attr.quote || '\'';
    parts.push(`${finalName}=${quote}${attr.value}${quote}`);
  }

  if (config.requiredAttrs) {
    for (const req of config.requiredAttrs) {
      if (!handledAttrs.has(req)) {
        parts.push(`${req}='...'`);
      }
    }
  }

  const attrsString = parts.length > 0 ? ` ${parts.join(' ')}` : '';
  const closingSlash = isStrictlySelfClosing ? '/>' : (openToken.isSelfClosing ? '/>' : '>');
  const openTagReplacement = `<${config.targetTag}${attrsString}${closingSlash}`;
  const openRange = createRange(lineOffsets, openToken.tagStart, openToken.tagEnd);

  const edits: BloggerTextEdit[] = [
    { range: openRange, newText: openTagReplacement },
  ];

  if (!openToken.isSelfClosing) {
    let depth = 0;
    let closingToken: DirectiveToken | undefined;
    for (const tok of tokens) {
      if (tok.tagStart < openToken.tagStart) {
        continue;
      }
      if (tok.tagName.toLowerCase() === openToken.tagName.toLowerCase()) {
        if (!tok.isClosing && !tok.isSelfClosing) {
          depth++;
        }
        else if (tok.isClosing) {
          depth--;
          if (depth === 0) {
            closingToken = tok;
            break;
          }
        }
      }
    }

    if (closingToken) {
      let startOffset = closingToken.tagStart;
      let endOffset = closingToken.tagEnd;

      if (isStrictlySelfClosing) {
        const lineStart = documentText.lastIndexOf('\n', startOffset - 1);
        const effectiveLineStart = lineStart === -1 ? 0 : lineStart + 1;
        const prefix = documentText.slice(effectiveLineStart, startOffset);
        if (/^[ \t]*$/.test(prefix)) {
          startOffset = effectiveLineStart;
          if (documentText[endOffset] === '\r' && documentText[endOffset + 1] === '\n') {
            endOffset += 2;
          }
          else if (documentText[endOffset] === '\n') {
            endOffset += 1;
          }
          else if (lineStart !== -1) {
            startOffset = lineStart > 0 && documentText[lineStart - 1] === '\r' ? lineStart - 1 : lineStart;
          }
        }
      }

      const closingRange = createRange(lineOffsets, startOffset, endOffset);
      edits.push({
        range: closingRange,
        newText: isStrictlySelfClosing ? '' : `</${config.targetTag}>`,
      });
    }
  }

  return {
    title: `Replace <${openToken.tagName}> with <${config.targetTag}${isStrictlySelfClosing ? '/>' : '>'}>`,
    newText: openTagReplacement,
    range: openRange,
    edits,
    isPreferred: true,
  };
}

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
    if (sd.code in HALLUCINATED_DIRECTIVE_MAP) {
      const config = HALLUCINATED_DIRECTIVE_MAP[sd.code]!;
      const fix = buildHallucinatedDirectiveQuickFix(sd, config, tokens, lineOffsets, documentText);
      if (fix) {
        quickFixes.push(fix);
      }
    }
    else if (sd.code in INVERTED_ATTR_MAP && sd.tagStart !== undefined && sd.tagEnd !== undefined) {
      const targetAttr = INVERTED_ATTR_MAP[sd.code]!;
      const rawAttrText = documentText.slice(sd.tagStart, sd.tagEnd);
      const eqIndex = rawAttrText.indexOf('=');
      const newText = eqIndex !== -1 ? `${targetAttr}${rawAttrText.slice(eqIndex)}` : targetAttr;
      quickFixes.push({
        title: `Replace with '${newText}'`,
        newText,
        range,
        isPreferred: true,
      });
    }
    else if (sd.code === 'BX1022' && sd.tagStart !== undefined && sd.tagEnd !== undefined) {
      const missingMatch = /Mandatory attribute '([^']+)' is missing on <([^>]+)>/i.exec(sd.message);
      if (missingMatch) {
        const missingAttr = missingMatch[1]!;
        const tagName = missingMatch[2]!;
        const tagText = documentText.slice(sd.tagStart, sd.tagEnd);
        const isSelfClosing = tagText.endsWith('/>');
        const insertOffset = isSelfClosing ? sd.tagEnd - 2 : sd.tagEnd - 1;

        let attrVal = `=''`;
        if (tagName.toLowerCase() === 'b:widget' && missingAttr === 'id') {
          const token = tokens.find(t => t.tagStart === sd.tagStart && t.tagEnd === sd.tagEnd)
            ?? tokens.find(t => t.tagStart <= sd.tagStart! && t.tagEnd >= sd.tagEnd!);
          const widgetType = token?.attributes.type?.value;
          attrVal = widgetType ? `='${widgetType}1'` : `=''`;
        }

        const prevChar = documentText[insertOffset - 1] ?? '';
        const prefix = /\s/.test(prevChar) ? '' : ' ';
        const insertText = `${prefix}${missingAttr}${attrVal}`;
        const insertRange = createRange(lineOffsets, insertOffset, insertOffset);

        quickFixes.push({
          title: `Insert mandatory attribute '${missingAttr}${attrVal}'`,
          newText: insertText,
          range: insertRange,
          isPreferred: true,
        });
      }
    }
    else if (sd.code === 'BX1019' && sd.tagStart !== undefined && sd.tagEnd !== undefined) {
      const rawText = documentText.slice(sd.tagStart, sd.tagEnd);
      const iteratorName = rawText.startsWith('data:')
        ? rawText.slice(5)
        : (/lambda iterator property 'data:([^']+)'/i.exec(sd.message)?.[1] ?? rawText.replace(/^data:/, ''));
      quickFixes.push({
        title: `Remove redundant 'data:' prefix (use '${iteratorName}')`,
        newText: iteratorName,
        range,
        isPreferred: true,
      });
    }
    else if (sd.code === 'BX1030' && sd.tagStart !== undefined && sd.tagEnd !== undefined) {
      const rawExpr = documentText.slice(sd.tagStart, sd.tagEnd).trim();
      const inner = rawExpr.startsWith('-') ? rawExpr.slice(1).trim() : rawExpr;
      const newText = `(0 - ${inner})`;
      quickFixes.push({
        title: `Rewrite unary negation as '${newText}'`,
        newText,
        range,
        isPreferred: true,
      });
    }
    else if (sd.code === 'BX1038' && sd.tagStart !== undefined && sd.tagEnd !== undefined) {
      const rawText = documentText.slice(sd.tagStart, sd.tagEnd);
      const unquoted = rawText.replace(/^['"]|['"]$/g, '');
      const boolVal = unquoted.toLowerCase() === 'true' ? 'true' : 'false';
      quickFixes.push({
        title: `Replace with boolean literal '${boolVal}'`,
        newText: boolVal,
        range,
        isPreferred: true,
      });
    }
    else if (sd.rule?.replacement && !sd.rule.replacement.includes('...') && sd.tagStart !== undefined && sd.tagEnd !== undefined) {
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

    // BX1031: Non-object primitive payload in data attribute
    const dataAttr = token.attributes.data ?? token.attributes['expr:data'];
    if (dataAttr && dataAttr.value) {
      const rawVal = dataAttr.value.trim();
      const isStringLit = (rawVal.startsWith('"') && rawVal.endsWith('"')) || (rawVal.startsWith('\'') && rawVal.endsWith('\''));
      const isNumericLit = /^-?\d+(?:\.\d+)?$/.test(rawVal);
      const isBooleanLit = /^(?:true|false)$/i.test(rawVal);

      if (isStringLit || isNumericLit || isBooleanLit) {
        const range = createRange(lineOffsets, dataAttr.valueStart, dataAttr.valueEnd);
        const quickFixes: BloggerQuickFix[] = [
          {
            title: `Wrap payload in object literal '{ value: ${rawVal} }'`,
            newText: `{ value: ${rawVal} }`,
            range,
            isPreferred: true,
          },
        ];

        diagnostics.push({
          code: 'BX1031',
          message: 'The \'data\' attribute of <b:include> strictly requires an object reference or object literal { ... }; passing primitive scalars (string, number, boolean) aborts execution with runtime error \'Error during evaluation of <name>\'.',
          severity: 'error',
          range,
          quickFixes,
        });
      }
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

  // Parameterized message validations (BX1027, BX1028)
  for (const token of tokens) {
    if (token.isClosing) {
      continue;
    }

    // BX1027: Direct invocation of parameterized/plural message
    if (token.tagName.startsWith('data:messages.')) {
      const key = token.tagName.slice('data:messages.'.length);
      const msg = catalog.getMessage(key);
      if (msg && msg.direct_invocation === false) {
        const range = createRange(lineOffsets, token.tagStart, token.tagEnd);
        const paramList = msg.parameters?.map(p => `  <b:param name='${p.name}' value='...'/>`).join('\n') ?? '  <b:param value=\'...\'/>';
        const replacement = `<b:message name='messages.${key}'>\n${paramList}\n</b:message>`;

        diagnostics.push({
          code: 'BX1027',
          message: `Parameterized message tokens cannot be evaluated via direct tag invocation (<data:messages.${key}/>) and output raw un-interpolated template strings. Use <b:message name='messages.${key}'> with child <b:param> tags.`,
          severity: 'warning',
          range,
          quickFixes: [
            {
              title: `Convert to <b:message name='messages.${key}'>`,
              newText: replacement,
              range,
              isPreferred: true,
            },
          ],
        });
      }
    }

    // BX1028 & BX1029: Message directives child parameter validation
    if (token.tagName.toLowerCase() === 'b:message' && !token.isSelfClosing) {
      let depth = 0;
      let messageEnd = token.tagEnd;
      for (const tok of tokens) {
        if (tok.tagStart < token.tagStart) {
          continue;
        }
        if (tok.tagName.toLowerCase() === 'b:message') {
          if (!tok.isClosing && !tok.isSelfClosing) {
            depth++;
          }
          else if (tok.isClosing) {
            depth--;
            if (depth === 0) {
              messageEnd = tok.tagEnd;
              break;
            }
          }
        }
      }

      const childParams = tokens.filter(
        tok => tok.tagStart > token.tagStart && tok.tagEnd < messageEnd && tok.tagName.toLowerCase() === 'b:param',
      );

      // BX1029: Multiple <b:param> tags concatenated inline without whitespace
      for (let i = 1; i < childParams.length; i++) {
        const prevParam = childParams[i - 1]!;
        const currParam = childParams[i]!;
        const intervening = documentText.slice(prevParam.tagEnd, currParam.tagStart);
        if (!/^\s+$/.test(intervening)) {
          const range = createRange(lineOffsets, currParam.tagStart, currParam.tagEnd);
          const insertRange = createRange(lineOffsets, currParam.tagStart, currParam.tagStart);

          diagnostics.push({
            code: 'BX1029',
            message: 'Multiple <b:param> tags concatenated inline without intervening whitespace (<b:param .../><b:param .../>) cause Blogger runtime error \'Invalid parameters for message\'. Sibling <b:param> tags must be separated by whitespace or placed on separate lines.',
            severity: 'error',
            range,
            quickFixes: [
              {
                title: 'Separate <b:param> tags with whitespace',
                newText: ' ',
                range: insertRange,
                isPreferred: true,
              },
            ],
          });
        }
      }

      // BX1028: Plural message with <b:param> missing 'name' attribute
      const nameAttr = token.attributes.name?.value?.trim();
      if (nameAttr) {
        const key = nameAttr.startsWith('messages.') ? nameAttr.slice('messages.'.length) : nameAttr;
        const msg = catalog.getMessage(key);
        const isPlural = msg?.pattern?.includes('plural') || msg?.description?.toLowerCase().includes('plural');

        if (isPlural) {
          const expectedParamName = msg?.parameters?.[0]?.name ?? 'count';
          for (const paramToken of childParams) {
            if (!paramToken.attributes.name || !paramToken.attributes.name.value?.trim()) {
              const range = createRange(lineOffsets, paramToken.tagStart, paramToken.tagEnd);
              const tagText = documentText.slice(paramToken.tagStart, paramToken.tagEnd);
              const isSelfClosing = tagText.endsWith('/>');
              const insertOffset = isSelfClosing ? paramToken.tagEnd - 2 : paramToken.tagEnd - 1;
              const prevChar = documentText[insertOffset - 1] ?? '';
              const prefix = /\s/.test(prevChar) ? '' : ' ';
              const insertText = `${prefix}name='${expectedParamName}'`;
              const insertRange = createRange(lineOffsets, insertOffset, insertOffset);

              diagnostics.push({
                code: 'BX1028',
                message: `Pluralized ICU messages require the 'name' attribute on child <b:param> tags matching the plural identifier (e.g. <b:param name='${expectedParamName}' value='...'/>); omitting 'name' aborts template compilation.`,
                severity: 'error',
                range,
                quickFixes: [
                  {
                    title: `Insert mandatory parameter name='${expectedParamName}'`,
                    newText: insertText,
                    range: insertRange,
                    isPreferred: true,
                  },
                ],
              });
            }
          }
        }
      }
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
