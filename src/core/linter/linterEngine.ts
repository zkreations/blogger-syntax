import type { BloggerDiagnosticCode } from 'blogger-spec';
import type { BloggerStructureDiagnostic } from 'blogger-spec/parser';
import type { BloggerDiagnostic, BloggerQuickFix, BloggerTextEdit, LinterOptions } from './linterTypes.js';
import { STRICTLY_SELF_CLOSING_TAGS } from 'blogger-spec';
import { getSpecCatalog } from 'blogger-spec/catalogs';
import { parseExpression, scanDirectiveTokens, validateTemplateStructure } from 'blogger-spec/parser';
import { tokenizeExpression } from 'blogger-spec/quota';
import { getSkinTypeModifiers } from 'blogger-spec/type-system';
import { findIncludableDefinition } from '../navigation/definitionResolver.js';
import { extractSkinVariables } from '../resolver/skinVariableResolver.js';
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
  const skinSymbols = extractSkinVariables(documentText);

  const specDiagnostics: readonly BloggerStructureDiagnostic[] = validateTemplateStructure(tokens, catalog, {
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
    else if (sd.suggestedReplacement !== undefined && sd.tagStart !== undefined && sd.tagEnd !== undefined) {
      let title = `Replace with '${sd.suggestedReplacement}'`;
      if (sd.code === 'BX1038') {
        title = `Replace with boolean literal '${sd.suggestedReplacement}'`;
      }
      else if (sd.code === 'BX1019') {
        title = `Remove redundant 'data:' prefix (use '${sd.suggestedReplacement}')`;
      }
      else if ((sd.code as string) === 'BX1049') {
        title = 'Insert whitespace after \':\'';
      }

      quickFixes.push({
        title,
        newText: sd.suggestedReplacement,
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
    else if (sd.code === 'BX1031' && sd.tagStart !== undefined && sd.tagEnd !== undefined) {
      const token = tokens.find(t => t.tagStart <= sd.tagStart! && t.tagEnd >= sd.tagEnd!);
      const dataAttr = token?.attributes.data ?? token?.attributes['expr:data'];
      if (dataAttr && dataAttr.value) {
        const rawVal = dataAttr.value.trim();
        const attrValRange = createRange(lineOffsets, dataAttr.valueStart, dataAttr.valueEnd);
        quickFixes.push({
          title: `Wrap payload in object literal '{ value: ${rawVal} }'`,
          newText: `{ value: ${rawVal} }`,
          range: attrValRange,
          isPreferred: true,
        });
      }
    }
    else if (sd.code === 'BX1027' && sd.tagStart !== undefined && sd.tagEnd !== undefined) {
      const key = sd.tagName.startsWith('data:messages.')
        ? sd.tagName.slice('data:messages.'.length)
        : (/data:messages\.(\w+)/.exec(documentText.slice(sd.tagStart, sd.tagEnd))?.[1]);
      if (key) {
        const msg = catalog.getMessage(key);
        const paramList = msg?.parameters?.map(p => `  <b:param name='${p.name}' value='...'/>`).join('\n') ?? '  <b:param value=\'...\'/>';
        const replacement = `<b:message name='messages.${key}'>\n${paramList}\n</b:message>`;
        quickFixes.push({
          title: `Convert to <b:message name='messages.${key}'>`,
          newText: replacement,
          range,
          isPreferred: true,
        });
      }
    }
    else if (sd.code === 'BX1028' && sd.tagStart !== undefined && sd.tagEnd !== undefined) {
      const msgMatch = /Pluralized ICU message '([^']+)'/i.exec(sd.message);
      const msgKey = msgMatch?.[1];
      const msg = msgKey ? catalog.getMessage(msgKey) : undefined;
      const expectedParamName = msg?.parameters?.[0]?.name ?? 'count';
      const tagText = documentText.slice(sd.tagStart, sd.tagEnd);
      const isSelfClosing = tagText.endsWith('/>');
      const insertOffset = isSelfClosing ? sd.tagEnd - 2 : sd.tagEnd - 1;
      const prevChar = documentText[insertOffset - 1] ?? '';
      const prefix = /\s/.test(prevChar) ? '' : ' ';
      const insertText = `${prefix}name='${expectedParamName}'`;
      const insertRange = createRange(lineOffsets, insertOffset, insertOffset);

      quickFixes.push({
        title: `Insert mandatory parameter name='${expectedParamName}'`,
        newText: insertText,
        range: insertRange,
        isPreferred: true,
      });
    }
    else if (sd.code === 'BX1029' && sd.tagStart !== undefined && sd.tagEnd !== undefined) {
      const insertRange = createRange(lineOffsets, sd.tagStart, sd.tagStart);
      quickFixes.push({
        title: 'Separate <b:param> tags with whitespace',
        newText: ' ',
        range: insertRange,
        isPreferred: true,
      });
    }
    else if (((sd.code as string) === 'BX1032' || (sd.code as string) === 'BX1048') && sd.tagStart !== undefined && sd.tagEnd !== undefined) {
      const token = tokens.find(t => t.tagStart <= sd.tagStart! && t.tagEnd >= sd.tagEnd!);
      if (token) {
        const fullTag = documentText.slice(token.tagStart, token.tagEnd).trim();
        const innerContent = fullTag.replace(/^<\s*data:/, '').replace(/\/?>$/, '').trim();
        if (innerContent) {
          const expr = `data:${innerContent}`;
          const newText = `<b:eval expr='${expr}'/>`;
          const tagRange = createRange(lineOffsets, token.tagStart, token.tagEnd);
          quickFixes.push({
            title: `Convert to '${newText}'`,
            newText,
            range: tagRange,
            isPreferred: true,
          });
        }
      }
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

    let message = sd.message;
    if (sd.code === 'BX1037' && sd.tagStart !== undefined && sd.tagEnd !== undefined) {
      const token = tokens.find(t => t.tagStart <= sd.tagStart! && t.tagEnd >= sd.tagEnd!);
      const incName = token?.attributes.name?.value?.trim() ?? documentText.slice(sd.tagStart, sd.tagEnd).replace(/^name=['"]|['"]$/g, '').trim();
      if (incName && !message.includes(incName)) {
        message = `Unresolved inclusion "${incName}". ${sd.message}`;
      }
    }

    diagnostics.push({
      code: sd.code,
      message,
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

    const incMeta = catalog.getInclusion(name);
    if (incMeta?.deprecated != null || incMeta?.category === 'deprecated' || name === 'quickedit') {
      continue;
    }

    if (catalog.isServerInclusion(name)) {
      continue;
    }

    const resolved = findIncludableDefinition(documentText, nameAttr.valueStart);
    if (!resolved) {
      const rule = catalog.getDiagnostic('BX1037');
      const range = createRange(lineOffsets, nameAttr.valueStart, nameAttr.valueEnd);
      const alreadyReported = diagnostics.some(
        d => d.code === 'BX1037' && (
          (d.range.start.line === range.start.line && Math.abs(d.range.start.character - range.start.character) <= 10)
          || d.message.includes(`"${name}"`)
        ),
      );
      if (!alreadyReported) {
        diagnostics.push({
          code: 'BX1037',
          message: rule?.message ? `Unresolved inclusion "${name}". ${rule.message}` : `Unresolved inclusion "${name}". Subroutine is not defined in the template and is not a built-in server inclusion.`,
          severity: 'error',
          range,
        });
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

  // 6. Theme Designer skin variables validation inside <b:skin> and <b:template-skin>
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i]!;
    const tagLower = token.tagName.toLowerCase();
    if ((tagLower === 'b:skin' || tagLower === 'b:template-skin') && !token.isClosing && !token.isSelfClosing) {
      let closeToken: DirectiveToken | undefined;
      for (let j = i + 1; j < tokens.length; j++) {
        const nextTok = tokens[j]!;
        if (nextTok.tagName.toLowerCase() === tagLower && nextTok.isClosing) {
          closeToken = nextTok;
          break;
        }
      }

      const contentStart = token.tagEnd;
      const contentEnd = closeToken
        ? closeToken.tagStart
        : (documentText.includes(`</${token.tagName}`, token.tagEnd)
            ? documentText.indexOf(`</${token.tagName}`, token.tagEnd)
            : documentText.length);

      if (contentEnd <= contentStart) {
        continue;
      }

      const rawSlice = documentText.slice(contentStart, contentEnd);
      const chars = rawSlice.split('');

      // Mask CDATA delimiters if present
      const cdataOpenIdx = rawSlice.indexOf('<![CDATA[');
      if (cdataOpenIdx !== -1) {
        for (let c = 0; c < 9; c++) {
          chars[cdataOpenIdx + c] = ' ';
        }
      }
      const cdataCloseIdx = rawSlice.lastIndexOf(']]>');
      if (cdataCloseIdx !== -1) {
        for (let c = 0; c < 3; c++) {
          chars[cdataCloseIdx + c] = ' ';
        }
      }

      // Mask inner directive tokens (Variable, Group, etc.)
      for (let j = i + 1; j < tokens.length; j++) {
        const innerTok = tokens[j]!;
        if (innerTok.tagStart >= contentEnd) {
          break;
        }
        if (innerTok.tagStart >= contentStart && innerTok.tagEnd <= contentEnd) {
          const tokLocalStart = innerTok.tagStart - contentStart;
          const tokLocalEnd = innerTok.tagEnd - contentStart;
          for (let k = tokLocalStart; k < tokLocalEnd; k++) {
            chars[k] = ' ';
          }
        }
      }

      const maskedSkinContent = chars.join('');

      // 6.1. Parenthesized skin variables: $(varName) or $(varName.modifier)
      const parenRegex = /\$\(([a-z_][\w.-]*)\)/gi;
      for (const match of maskedSkinContent.matchAll(parenRegex)) {
        if (match.index === undefined) {
          continue;
        }
        const fullToken = match[0];
        const inner = match[1]!;
        const absStart = contentStart + match.index;
        const absEnd = absStart + fullToken.length;
        const range = createRange(lineOffsets, absStart, absEnd);

        // Direct variable match
        const exactVar = Object.values(skinSymbols).find(s => s.name === inner);
        if (exactVar) {
          continue;
        }

        // Variable with modifier: candVar.candMod
        const lastDot = inner.lastIndexOf('.');
        if (lastDot !== -1) {
          const candVar = inner.slice(0, lastDot);
          const candMod = inner.slice(lastDot + 1);
          const baseVar = Object.values(skinSymbols).find(s => s.name === candVar);
          if (baseVar) {
            const modifiers = getSkinTypeModifiers(baseVar.type);
            if (candMod in modifiers) {
              continue;
            }
            diagnostics.push({
              code: 'BX1025',
              message: `Unknown modifier "${candMod}" for skin variable "${candVar}" of type "${baseVar.type}".`,
              severity: 'error',
              range,
            });
            continue;
          }
        }

        diagnostics.push({
          code: 'BX1025',
          message: `Undeclared skin variable "$(${inner})". Variable is not declared in <b:skin> or <b:template-skin>.`,
          severity: 'error',
          range,
        });
      }

      // 6.2. Bare skin variables: $varName
      const bareRegex = /(?<![\w$])\$([a-z_]\w*)/gi;
      for (const match of maskedSkinContent.matchAll(bareRegex)) {
        if (match.index === undefined) {
          continue;
        }
        const fullToken = match[0];
        const varName = match[1]!;
        const absStart = contentStart + match.index;
        const absEnd = absStart + fullToken.length;
        const range = createRange(lineOffsets, absStart, absEnd);

        const exactVar = Object.values(skinSymbols).find(s => s.name === varName);
        if (exactVar) {
          continue;
        }

        const dottedVar = Object.values(skinSymbols).find(s => s.name?.startsWith(`${varName}.`));
        if (dottedVar && dottedVar.name) {
          const nextText = rawSlice.slice(match.index + fullToken.length);
          const expectedSuffix = dottedVar.name.slice(varName.length);
          const hasDottedSuffix = nextText.startsWith(expectedSuffix);
          const highlightEnd = hasDottedSuffix ? absEnd + expectedSuffix.length : absEnd;
          const highlightRange = createRange(lineOffsets, absStart, highlightEnd);

          diagnostics.push({
            code: 'BX1025',
            message: `Undeclared skin variable "$${varName}". Variable "${dottedVar.name}" contains dots and must be accessed with parentheses: "$(${dottedVar.name})".`,
            severity: 'error',
            range: highlightRange,
            quickFixes: [{
              title: `Replace with '$(${dottedVar.name})'`,
              newText: `$(${dottedVar.name})`,
              range: highlightRange,
              isPreferred: true,
            }],
          });
          continue;
        }

        diagnostics.push({
          code: 'BX1025',
          message: `Undeclared skin variable "$${varName}". Variable is not declared in <b:skin> or <b:template-skin>.`,
          severity: 'error',
          range,
        });
      }
    }
  }

  // 7. Validate data:skin.vars in template expressions and data tags (outside b:skin)
  const skinVarUsageRegex = /\bdata:skin\.vars\.([a-zA-Z_]\w*(?:\.[a-zA-Z_]\w*)*)\b/g;
  for (const match of maskedText.matchAll(skinVarUsageRegex)) {
    if (match.index === undefined) {
      continue;
    }
    const fullMatch = match[0];
    const path = match[1]!;
    const start = match.index;
    const end = start + fullMatch.length;
    const range = createRange(lineOffsets, start, end);

    const segments = path.split('.');
    const firstSegment = segments[0]!;

    if (!(firstSegment in skinSymbols)) {
      const normalizedPath = path.replace(/\./g, '_');
      const matchingSymbol = Object.entries(skinSymbols).find(([normKey]) => normKey === normalizedPath);
      if (matchingSymbol) {
        diagnostics.push({
          code: 'BX1025',
          message: `Undeclared skin variable "${firstSegment}". In expressions, dots in variable names must be replaced with underscores: "data:skin.vars.${matchingSymbol[0]}".`,
          severity: 'error',
          range,
          quickFixes: [{
            title: `Replace with 'data:skin.vars.${matchingSymbol[0]}'`,
            newText: `data:skin.vars.${matchingSymbol[0]}`,
            range,
            isPreferred: true,
          }],
        });
        continue;
      }

      diagnostics.push({
        code: 'BX1025',
        message: `Undeclared skin variable "${firstSegment}". Variable is not declared in <b:skin> or <b:template-skin>.`,
        severity: 'error',
        range,
      });
      continue;
    }

    const symbol = skinSymbols[firstSegment]!;
    const modSegments = segments.slice(1);
    if (modSegments.length === 1) {
      const modName = modSegments[0]!;
      const modifiers = getSkinTypeModifiers(symbol.type);
      if (!(modName in modifiers)) {
        diagnostics.push({
          code: 'BX1025',
          message: `Unknown modifier "${modName}" for skin variable "${symbol.name ?? firstSegment}" of type "${symbol.type}".`,
          severity: 'error',
          range,
        });
      }
    }
    else if (modSegments.length > 1) {
      diagnostics.push({
        code: 'BX1025',
        message: `Unknown modifier "${modSegments.join('.')}" for skin variable "${symbol.name ?? firstSegment}".`,
        severity: 'error',
        range,
      });
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
