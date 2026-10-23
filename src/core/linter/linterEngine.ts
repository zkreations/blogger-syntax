import type { BloggerDiagnosticCode } from 'blogger-spec';
import type { BloggerStructureDiagnostic } from 'blogger-spec/parser';
import type { BloggerDiagnostic, BloggerQuickFix, BloggerTextEdit, LinterOptions } from './linterTypes.js';
import { getSpecCatalog } from 'blogger-spec/catalogs';
import { scanDirectiveTokens, validateTemplateStructure } from 'blogger-spec/parser';
import { tokenizeExpression } from 'blogger-spec/quota';
import { getSkinTypeModifiers } from 'blogger-spec/type-system';
import { messagesProperties, resolveDataProperty } from '../resolver/dataPathAdapter.js';
import { buildSkinVariableProperties, extractSkinVariables } from '../resolver/skinVariableResolver.js';
import { BloggerScopeTracker } from '../scope/scopeTracker.js';
import {
  buildSuppressionQuickFixes,
  isDiagnosticSuppressed,
  scanSuppressionDirectives,
} from './linterSuppression.js';
import { computeLineOffsets, createRange, maskComments } from './linterUtils.js';

export { tokenizeExpression };
export type { BloggerExpressionToken as Token } from 'blogger-spec';

const INVERTED_ATTR_MAP: Readonly<Record<string, string>> = {
  BX1014: 'var',
  BX1015: 'id',
  BX1016: 'name',
};

export function lintBloggerDocument(
  documentText: string,
  options?: LinterOptions,
): readonly BloggerDiagnostic[] {
  if (!documentText) {
    return [];
  }

  const catalog = getSpecCatalog();
  const lineOffsets = computeLineOffsets(documentText);
  const tokens = scanDirectiveTokens(documentText, { catalog });

  const specDiagnostics: readonly BloggerStructureDiagnostic[] = validateTemplateStructure(documentText, catalog, {
    validateExpressions: options?.rules?.structure !== false,
  });

  const diagnostics: BloggerDiagnostic[] = [];

  for (const sd of specDiagnostics) {
    const start = sd.tagStart ?? 0;
    const end = sd.tagEnd ?? start;
    const range = createRange(lineOffsets, start, end);

    const quickFixes: BloggerQuickFix[] = [];

    if (sd.code in INVERTED_ATTR_MAP && sd.tagStart !== undefined && sd.tagEnd !== undefined) {
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
    else if (sd.fixes && sd.fixes.length > 0) {
      for (const fix of sd.fixes) {
        const edits: BloggerTextEdit[] = fix.edits.map((e) => {
          let newText = e.newText;
          const tok = tokens.find(t => t.tagStart === e.start);
          if (tok && tok.isSelfClosing && newText.endsWith('>') && !newText.endsWith('/>')) {
            newText = `${newText.slice(0, -1)}/>`;
          }
          return {
            range: createRange(lineOffsets, e.start, e.end),
            newText,
          };
        });
        const primaryEdit = edits[0];
        quickFixes.push({
          title: fix.title,
          newText: primaryEdit ? primaryEdit.newText : '',
          range: primaryEdit ? primaryEdit.range : range,
          edits,
          isPreferred: fix.isPreferred,
        });
      }
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
    else if (sd.code === 'BX1024' && sd.tagStart !== undefined && sd.tagEnd !== undefined) {
      const attrName = sd.attribute ?? (/Attribute '([^']+)' on/i.exec(sd.message)?.[1]);
      if (sd.suggestedReplacement && !sd.suggestedReplacement.includes(' ') && !sd.suggestedReplacement.includes('/')) {
        quickFixes.push({
          title: `Replace with '${sd.suggestedReplacement}'`,
          newText: sd.suggestedReplacement,
          range,
          isPreferred: true,
        });
      }
      else if (attrName) {
        quickFixes.push({
          title: `Remove obsolete attribute "${attrName}"`,
          newText: '',
          range,
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

    const tags: ('deprecated' | 'unnecessary')[] = [];
    if (sd.rule?.category === 'deprecation' || sd.code === 'BX1024' || sd.code === 'BX1050') {
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

  // Hallucinated comment.replies (BX1051)
  for (const match of documentText.matchAll(/\b(?:data:)?comment\.replies\b/g)) {
    if (match.index === undefined) {
      continue;
    }
    const start = match.index;
    const end = start + match[0].length;
    diagnostics.push({
      code: 'BX1051',
      message: 'Nested "comment.replies" collection is hallucinated; Blogger comments are flat and filtered via (c => c.inReplyTo == comment.id).',
      severity: 'warning',
      range: createRange(lineOffsets, start, end),
    });
  }

  // Unknown widget types (BX1025)
  for (const token of tokens) {
    if (token.tagName === 'b:widget' && !token.isClosing) {
      const type = token.attributes.type?.value;
      if (type && !catalog.getWidget(type)) {
        diagnostics.push({
          code: 'BX1025',
          message: `Unknown widget type '${type}'.`,
          severity: 'error',
          range: createRange(lineOffsets, token.tagStart, token.tagEnd),
        });
      }
    }
  }

  // Validate unresolved <data:...> substitution tags in template
  const scopeTracker = new BloggerScopeTracker();
  const skinSymbols = extractSkinVariables(documentText);
  const skinProps = buildSkinVariableProperties(skinSymbols);
  const maskedText = maskComments(documentText);
  const dataTagRegex = /<data:([a-z_]\w*(?:\.[a-z_]\w*)*)(?:\s[^>]*?)?\/?>/gi;

  function buildUnresolvedDataMessage(path: string): string {
    return `<!--Can't find substitution for tag [${path}]-->`;
  }

  for (const match of maskedText.matchAll(dataTagRegex)) {
    if (match.index === undefined) {
      continue;
    }
    const fullTag = match[0];
    const path = match[1]!;
    const start = match.index;
    const end = start + fullTag.length;

    // Skip if tag already has syntax errors (prohibited bracket indexing BX1032 or operators BX1048 or deprecated BX1050)
    const hasSyntaxError = specDiagnostics.some(
      sd => (sd.code === 'BX1032' || (sd.code as string) === 'BX1048' || sd.code === 'BX1050')
        && sd.tagStart !== undefined && sd.tagStart <= end
        && sd.tagEnd !== undefined && sd.tagEnd >= start,
    );
    if (hasSyntaxError) {
      continue;
    }

    const range = createRange(lineOffsets, start, end);
    const activeVars = scopeTracker.getActiveVariables('linter_run', 1, documentText, start);

    const segments = path.split('.');
    const first = segments[0]!;

    // Check if user wrote skin.vars with dots instead of underscores (e.g. skin.vars.admin.name)
    if (segments[0] === 'skin' && segments[1] === 'vars' && segments.length > 2) {
      const rest = segments.slice(2).join('.');
      const normalizedRest = rest.replace(/\./g, '_');
      if (!(rest in skinSymbols) && (normalizedRest in skinSymbols)) {
        diagnostics.push({
          code: 'BX1054',
          message: `<!--Can't find substitution for tag [${path}]-->`,
          severity: 'warning',
          range,
          quickFixes: [{
            title: `Replace with 'data:skin.vars.${normalizedRest}'`,
            newText: `<data:skin.vars.${normalizedRest}/>`,
            range,
            isPreferred: true,
          }],
        });
        continue;
      }
    }

    const widgetType = scopeTracker.getEnclosingWidgetType('linter_run', 1, documentText, start) ?? '';

    let isResolved = true;
    if (first === 'widget' && !activeVars.widget) {
      isResolved = false;
    }
    else if (first === 'messages' && segments.length > 1 && !messagesProperties[segments[1]!]) {
      isResolved = false;
    }
    else {
      const resolved = resolveDataProperty(segments, {
        variables: activeVars,
        widgetType,
        skinVariables: skinProps,
      });
      if (!resolved) {
        isResolved = false;
      }
    }

    if (!isResolved) {
      diagnostics.push({
        code: 'BX1025',
        message: buildUnresolvedDataMessage(path),
        severity: 'warning',
        range,
      });
    }
  }

  // Validate CSS skin variable modifiers ($(var.modifier))
  const skinBlockRegex = /<b:(?:template-)?skin\b[^>]*>([\s\S]*?)<\/b:(?:template-)?skin>/gi;
  for (const match of documentText.matchAll(skinBlockRegex)) {
    if (match.index === undefined) {
      continue;
    }
    const blockStart = match.index;
    const blockContent = match[0];
    const cdataStart = blockContent.indexOf('<![CDATA[');
    if (cdataStart === -1) {
      continue;
    }
    const cdataContent = blockContent.slice(cdataStart + 9);
    const baseOffset = blockStart + cdataStart + 9;
    const parenRegex = /\$\(([a-z_][\w.-]*)\)/gi;
    for (const pMatch of cdataContent.matchAll(parenRegex)) {
      if (pMatch.index === undefined) {
        continue;
      }
      const inner = pMatch[1]!;
      const lastDot = inner.lastIndexOf('.');
      if (lastDot !== -1) {
        const candVar = inner.slice(0, lastDot);
        const candMod = inner.slice(lastDot + 1);
        const baseVar = Object.values(skinSymbols).find(s => s.name === candVar);
        if (baseVar) {
          const modifiers = getSkinTypeModifiers(baseVar.type);
          if (!(candMod in modifiers)) {
            const start = baseOffset + pMatch.index;
            diagnostics.push({
              code: 'BX1053',
              message: `Unknown modifier "${candMod}" for skin variable "${candVar}" of type "${baseVar.type}".`,
              severity: 'error',
              range: createRange(lineOffsets, start, start + pMatch[0].length),
            });
          }
        }
      }
    }
  }

  // Validate data:skin.vars in expressions
  const skinVarUsageRegex = /(?<!<)\bdata:skin\.vars\.([a-z_]\w*(?:\.[a-z_]\w*)*)\b/gi;
  for (const match of maskedText.matchAll(skinVarUsageRegex)) {
    if (match.index === undefined) {
      continue;
    }
    const fullMatch = match[0];
    const path = match[1]!;
    const segments = path.split('.');
    const firstSegment = segments[0]!;
    if (!(firstSegment in skinSymbols)) {
      const normalizedPath = path.replace(/\./g, '_');
      if (!(normalizedPath in skinSymbols)) {
        diagnostics.push({
          code: 'BX1053',
          message: `Undeclared skin variable "${firstSegment}". Variable is not declared in <b:skin> or <b:template-skin>.`,
          severity: 'error',
          range: createRange(lineOffsets, match.index, match.index + fullMatch.length),
        });
      }
    }
  }

  // Filter by options if specified
  const rules = options?.rules;
  const filtered = rules
    ? diagnostics.filter((diag) => {
        const ruleDef = catalog.getDiagnostic(diag.code as BloggerDiagnosticCode);
        const category = ruleDef?.category;

        if (rules.unresolvedData === false && (diag.code === 'BX1051' || diag.message.startsWith('<!--Can\'t find substitution for tag'))) {
          return false;
        }

        if (rules.deprecations === false && (category === 'deprecation' || diag.tags?.includes('deprecated') || diag.code === 'BX1050')) {
          return false;
        }
        if (rules.hallucinations === false && (category === 'hallucination' || diag.code === 'BX1051')) {
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
      })
    : diagnostics;

  // Filter by comment suppression directives and attach suppression QuickFixes
  const suppressionDirectives = scanSuppressionDirectives(documentText, lineOffsets);
  const finalDiagnostics: BloggerDiagnostic[] = [];

  for (const diag of filtered) {
    if (isDiagnosticSuppressed(diag, suppressionDirectives)) {
      continue;
    }

    const suppressionFixes = options?.includeSuppressionFixes
      ? buildSuppressionQuickFixes(diag, lineOffsets, documentText)
      : [];
    const existingFixes = diag.quickFixes ?? [];
    const mergedFixes = [...existingFixes, ...suppressionFixes];

    finalDiagnostics.push({
      ...diag,
      quickFixes: mergedFixes.length > 0 ? mergedFixes : undefined,
    });
  }

  return finalDiagnostics;
}
