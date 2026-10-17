import type { BloggerDiagnostic } from '../linterTypes.js';
import {
  COMPILER_NESTING_LIMIT,
  COMPILER_QUOTA_LIMIT,
  COMPILER_QUOTA_WARNING,
  countExpressionTokens,
} from 'blogger-spec/quota';
import { isExpressionAttribute } from '../../resolver/pathResolver.js';
import { createRange, scanXmlTags } from '../linterUtils.js';

export type {
  BloggerExpressionBudgetResult as ExpressionBudgetResult,
  BloggerExpressionToken as Token,
  BloggerExpressionTokenInfo as TokenInfo,
} from 'blogger-spec';

export {
  analyzeExpressionBudget,
  COMPILER_NESTING_LIMIT,
  COMPILER_QUOTA_LIMIT,
  COMPILER_QUOTA_WARNING,
  countExpressionTokens,
  evaluateExpressionBudget,
  flattenMultilineExpression,
  tokenizeExpression,
  unescapeXmlEntities,
} from 'blogger-spec/quota';

const ATTR_VALUE_SCANNER = /\b([\w:-]+)\s*=\s*(["'])([\s\S]*?)\2/g;

export function findUnspacedObjectColons(
  expr: string,
  baseOffset: number,
  lineOffsets: readonly number[],
): BloggerDiagnostic[] {
  const diagnostics: BloggerDiagnostic[] = [];
  const length = expr.length;
  let pos = 0;
  let inQuote: '"' | '\'' | null = null;
  let inBraceDepth = 0;

  while (pos < length) {
    const c = expr[pos];
    if (inQuote) {
      if (c === inQuote && (pos === 0 || expr[pos - 1] !== '\\')) {
        inQuote = null;
      }
      pos++;
      continue;
    }
    if (c === '"' || c === '\'') {
      inQuote = c;
      pos++;
      continue;
    }

    if (c === '{') {
      inBraceDepth++;
      pos++;
      continue;
    }
    if (c === '}') {
      if (inBraceDepth > 0) {
        inBraceDepth--;
      }
      pos++;
      continue;
    }

    if (expr.slice(pos).startsWith('data:')) {
      pos += 5;
      continue;
    }

    if (c === ':') {
      if (inBraceDepth > 0 && pos + 1 < length && !/\s/.test(expr[pos + 1]!)) {
        if (expr.slice(pos).startsWith('?:')) {
          pos += 2;
          continue;
        }
        if (pos > 0 && expr[pos - 1] === '?') {
          pos++;
          continue;
        }

        const prefix = expr.slice(0, pos).trimEnd();
        if (
          prefix.endsWith('data')
          || prefix.endsWith('expr')
          || prefix.endsWith('xmlns')
          || prefix.endsWith('b')
          || prefix.endsWith('params')
        ) {
          pos++;
          continue;
        }

        let kEnd = pos;
        while (kEnd > 0 && /\s/.test(expr[kEnd - 1]!)) {
          kEnd--;
        }
        let kStart = kEnd;
        while (kStart > 0 && /[\w-]/.test(expr[kStart - 1]!)) {
          kStart--;
        }
        const keyName = expr.slice(kStart, kEnd);

        if (keyName && !['data', 'expr', 'xmlns', 'b'].includes(keyName)) {
          const beforeKey = expr.slice(0, kStart).trimEnd();
          if (beforeKey.endsWith('{') || beforeKey.endsWith(',')) {
            const colonAbsoluteOffset = baseOffset + pos;
            const colonRange = createRange(lineOffsets, colonAbsoluteOffset, colonAbsoluteOffset + 1);

            diagnostics.push({
              code: 'blogger.syntax.object-colon-spacing',
              message: `Missing space after colon in object literal "{ ${keyName}: ... }". Omission of whitespace can cause an XML QName namespace collision during Blogger compilation.`,
              severity: 'warning',
              range: colonRange,
              quickFixes: [
                {
                  title: `Add space after colon "${keyName}: "`,
                  newText: ': ',
                  range: colonRange,
                  isPreferred: true,
                },
              ],
            });
          }
        }
      }
      pos++;
      continue;
    }

    pos++;
  }

  return diagnostics;
}

export function checkDirectiveNesting(
  maskedText: string,
  lineOffsets: readonly number[],
): BloggerDiagnostic[] {
  const diagnostics: BloggerDiagnostic[] = [];
  const directiveStack: { tag: string; start: number }[] = [];
  const tagScanner = /<\/?b:([a-z_][\w:-]*)\b([^>]*?)(\/?)>/gi;

  for (const match of maskedText.matchAll(tagScanner)) {
    const rawMatch = match[0];
    const tagName = `b:${match[1]!.toLowerCase()}`;
    const isClosing = rawMatch.startsWith('</');
    const isSelfClosing = match[3] === '/' || rawMatch.endsWith('/>');
    const matchStart = match.index ?? 0;
    const matchEnd = matchStart + rawMatch.length;

    if (isClosing) {
      for (let i = directiveStack.length - 1; i >= 0; i--) {
        if (directiveStack[i]!.tag === tagName) {
          directiveStack.splice(i, directiveStack.length - i);
          break;
        }
      }
    }
    else if (!isSelfClosing) {
      directiveStack.push({ tag: tagName, start: matchStart });
      if (directiveStack.length > COMPILER_NESTING_LIMIT) {
        const range = createRange(lineOffsets, matchStart, matchEnd);
        diagnostics.push({
          code: 'blogger.quota.nesting-limit',
          message: `Directive tag nesting exceeds Blogger compiler ceiling (currently ${directiveStack.length} levels, maximum is ${COMPILER_NESTING_LIMIT}). Deep nesting will cause fatal compilation failure.`,
          severity: 'error',
          range,
        });
      }
    }
  }

  return diagnostics;
}

export function checkQuotasAndFormatting(
  _text: string,
  maskedText: string,
  lineOffsets: readonly number[],
): BloggerDiagnostic[] {
  const diagnostics: BloggerDiagnostic[] = [];

  for (const tag of scanXmlTags(maskedText)) {
    const tagName = tag.tagName;
    const tagContent = tag.tagContent;
    const tagContentOffset = tag.tagContentOffset;

    for (const attrMatch of tagContent.matchAll(ATTR_VALUE_SCANNER)) {
      const attrName = attrMatch[1] ?? '';
      const attrVal = attrMatch[3] ?? '';
      const quoteLength = 1;
      const attrValOffset = tagContentOffset + (attrMatch.index ?? 0) + attrMatch[0].indexOf(attrMatch[2] ?? '"') + quoteLength;

      if (!isExpressionAttribute(attrName, tagName)) {
        continue;
      }

      // 1. Check token quota
      let tokenCount = 0;
      try {
        tokenCount = countExpressionTokens(attrVal);
      }
      catch {
        // Malformed expression: covered by syntax/hallucination rules
      }
      if (tokenCount > COMPILER_QUOTA_LIMIT) {
        const fullRange = createRange(lineOffsets, attrValOffset, attrValOffset + attrVal.length);
        diagnostics.push({
          code: 'blogger.quota.token-limit',
          message: `Expression exceeds Blogger compiler token limit (currently ${tokenCount} tokens, maximum is ${COMPILER_QUOTA_LIMIT}). Break it down into intermediate variables using <b:with> to avoid server compilation rejection.`,
          severity: 'error',
          range: fullRange,
        });
      }
      else if (tokenCount >= COMPILER_QUOTA_WARNING) {
        const fullRange = createRange(lineOffsets, attrValOffset, attrValOffset + attrVal.length);
        diagnostics.push({
          code: 'blogger.quota.token-limit',
          message: `Expression approaches Blogger compiler token limit (currently ${tokenCount} tokens, maximum is ${COMPILER_QUOTA_LIMIT}). Consider decomposing with <b:with> for safety.`,
          severity: 'warning',
          range: fullRange,
        });
      }

      // 2. Check unspaced colon in object literals: { key:value }
      diagnostics.push(...findUnspacedObjectColons(attrVal, attrValOffset, lineOffsets));
    }
  }

  // 3. Check directive nesting depth limit (> 50 levels)
  diagnostics.push(...checkDirectiveNesting(maskedText, lineOffsets));

  return diagnostics;
}
