import type { BloggerDiagnostic } from '../linterTypes.js';
import { isExpressionAttribute } from '../../resolver/pathResolver.js';
import { createRange, scanXmlTags } from '../linterUtils.js';

const ATTR_VALUE_SCANNER = /\b([\w:-]+)\s*=\s*(["'])([\s\S]*?)\2/g;

export interface Token {
  value: string;
  tokenType: string;
  tokensConsumed: number;
  pos: number;
}

export interface TokenInfo {
  value: string;
  tokenType: string;
  tokensConsumed: number;
}

export interface ExpressionBudgetResult {
  expression: string;
  totalTokens: number;
  isValid: boolean;
  status: 'SAFE' | 'WARNING' | 'EXCEEDED';
  tokenStream: TokenInfo[];
  recommendation: string;
}

export const COMPILER_QUOTA_LIMIT = 40;
export const COMPILER_QUOTA_WARNING = 36;
export const COMPILER_NESTING_LIMIT = 50;

const RELATIONAL_KEYWORDS = new Set(['eq', 'neq', 'lt', 'gt', 'lte', 'gte']);
const LOGICAL_KEYWORDS = new Set(['and', 'or', 'not']);
const MEMBERSHIP_KEYWORDS = new Set(['in', 'contains']);
const LAMBDA_KEYWORDS = new Set(['filter', 'where', 'map', 'select', 'first', 'count', 'any', 'all', 'none']);
const COLLECTION_KEYWORDS = new Set(['take', 'limit', 'skip', 'offset', 'to']);
const NATIVE_FUNCTIONS = new Set(['resizeimage', 'snippet', 'sourceset', 'format']);
const BOOLEAN_KEYWORDS = new Set(['true', 'false', 'null']);

export function flattenMultilineExpression(expr: string): string {
  const lines = expr
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line.length > 0);
  return lines.join(' ');
}

export function unescapeXmlEntities(text: string): string {
  return text
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, '\'')
    .replace(/&#39;/g, '\'')
    .replace(/&#x27;/gi, '\'')
    .replace(/&#34;/g, '"')
    .replace(/&#x22;/gi, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

export function tokenizeExpression(expr: string): Token[] {
  const tokens: Token[] = [];
  const flattened = flattenMultilineExpression(expr);
  const s = unescapeXmlEntities(flattened);

  const length = s.length;
  let pos = 0;
  const ternaryStack = [0];
  const inObjectStack = [false];

  while (pos < length) {
    const ch = s[pos]!;

    if (/\s/.test(ch)) {
      pos++;
      continue;
    }

    if (ch === '"' || ch === '\'') {
      const quoteChar = ch;
      const start = pos;
      pos++;
      while (pos < length && s[pos] !== quoteChar) {
        if (s[pos] === '\\' && pos + 1 < length) {
          pos += 2;
        }
        else {
          pos++;
        }
      }
      if (pos < length) {
        pos++;
      }
      const literal = s.slice(start, pos);
      tokens.push({ value: literal, tokenType: 'STRING_LITERAL', tokensConsumed: 1, pos: start });
      continue;
    }

    const twoChar = s.slice(pos, pos + 2);
    if (['==', '!=', '<=', '>=', '?:', '=>', '&&', '||'].includes(twoChar)) {
      let tType: string;
      if (twoChar === '?:') {
        tType = 'OPERATOR_ELVIS';
      }
      else if (twoChar === '=>') {
        tType = 'OPERATOR_LAMBDA';
      }
      else if (twoChar === '&&' || twoChar === '||') {
        tType = 'OPERATOR_LOGICAL_JS';
      }
      else {
        tType = 'OPERATOR_RELATIONAL';
      }
      tokens.push({ value: twoChar, tokenType: tType, tokensConsumed: 1, pos });
      pos += 2;
      continue;
    }

    if (ch === '{') {
      tokens.push({ value: ch, tokenType: 'CONTAINER_OBJECT', tokensConsumed: 1, pos });
      inObjectStack.push(true);
      pos++;
      continue;
    }

    if (ch === '}') {
      tokens.push({ value: ch, tokenType: 'CONTAINER_OBJECT_CLOSE', tokensConsumed: 0, pos });
      if (inObjectStack.length > 1) {
        inObjectStack.pop();
      }
      pos++;
      continue;
    }

    if (ch === '[') {
      tokens.push({ value: ch, tokenType: 'CONTAINER_ARRAY', tokensConsumed: 1, pos });
      pos++;
      continue;
    }

    if (ch === ']') {
      tokens.push({ value: ch, tokenType: 'CONTAINER_ARRAY_CLOSE', tokensConsumed: 0, pos });
      pos++;
      continue;
    }

    if (ch === '(' || ch === ')') {
      if (ch === '(') {
        ternaryStack.push(0);
        const lastToken = tokens[tokens.length - 1];
        const prevToken = tokens.length > 1 ? tokens[tokens.length - 2] : undefined;
        const isFunctionalCall
          = tokens.length > 0
            && (lastToken!.tokenType === 'NATIVE_FUNCTION'
              || lastToken!.tokenType === 'OPERATOR_LAMBDA'
              || LAMBDA_KEYWORDS.has(lastToken!.value.toLowerCase())
              || (lastToken!.tokenType.startsWith('OPERATOR_')
                && (tokens.length === 1
                  || (prevToken
                    && (prevToken.tokenType === 'DELIMITER_COMMA'
                      || prevToken.tokenType === 'GROUPING_PAREN_OPEN')))));
        const cost = isFunctionalCall ? 0 : 1;
        tokens.push({ value: ch, tokenType: 'GROUPING_PAREN_OPEN', tokensConsumed: cost, pos });
      }
      else {
        if (ternaryStack.length > 1) {
          ternaryStack.pop();
        }
        tokens.push({ value: ch, tokenType: 'GROUPING_PAREN_CLOSE', tokensConsumed: 0, pos });
      }
      pos++;
      continue;
    }

    if (ch === ',') {
      tokens.push({ value: ch, tokenType: 'DELIMITER_COMMA', tokensConsumed: 0, pos });
      pos++;
      continue;
    }

    if (ch === '?') {
      ternaryStack[ternaryStack.length - 1]! += 1;
      tokens.push({ value: ch, tokenType: 'OPERATOR_TERNARY_SELECT', tokensConsumed: 1, pos });
      pos++;
      continue;
    }

    if (ch === ':') {
      if (ternaryStack[ternaryStack.length - 1]! > 0) {
        ternaryStack[ternaryStack.length - 1]! -= 1;
        tokens.push({ value: ch, tokenType: 'OPERATOR_TERNARY_BRANCH', tokensConsumed: 1, pos });
      }
      else {
        tokens.push({ value: ch, tokenType: 'DELIMITER_COLON', tokensConsumed: 0, pos });
      }
      pos++;
      continue;
    }

    const isUnaryMinus
      = ch === '-'
        && (tokens.length === 0
          || tokens[tokens.length - 1]!.tokenType.startsWith('OPERATOR_')
          || [
            'GROUPING_PAREN_OPEN',
            'CONTAINER_ARRAY',
            'CONTAINER_OBJECT',
            'DELIMITER_COMMA',
            'DELIMITER_COLON',
          ].includes(tokens[tokens.length - 1]!.tokenType))
          && pos + 1 < length
          && /\d/.test(s[pos + 1]!);

    if (isUnaryMinus) {
      const numMatch = s.slice(pos).match(/^-\d+(?:\.\d+)?/);
      if (numMatch) {
        const val = numMatch[0];
        tokens.push({ value: val, tokenType: 'NUMBER_LITERAL', tokensConsumed: 1, pos });
        pos += val.length;
        continue;
      }
    }

    if (['+', '-', '*', '/', '%', '<', '>', '!'].includes(ch)) {
      let tType: string;
      if (ch === '<' || ch === '>') {
        tType = 'OPERATOR_RELATIONAL';
      }
      else if (ch === '!') {
        tType = 'OPERATOR_LOGICAL';
      }
      else {
        tType = 'OPERATOR_ARITHMETIC';
      }
      tokens.push({ value: ch, tokenType: tType, tokensConsumed: 1, pos });
      pos++;
      continue;
    }

    if (s.slice(pos).startsWith('data:')) {
      const start = pos;
      pos += 5;
      const m = s.slice(pos).match(/^\w*/);
      if (m) {
        pos += m[0].length;
      }

      while (pos < length) {
        if (s[pos] === '.') {
          const mProp = s.slice(pos).match(/^\.[\w-]+/);
          if (mProp) {
            pos += mProp[0].length;
          }
          else {
            break;
          }
        }
        else if (s[pos] === '[') {
          const bracketStart = pos;
          pos += 1;
          let bracketDepth = 1;
          let inQuote: string | null = null;
          while (pos < length && bracketDepth > 0) {
            const c = s[pos]!;
            if (inQuote) {
              if (c === '\\') {
                pos += 2;
                continue;
              }
              else if (c === inQuote) {
                inQuote = null;
              }
            }
            else {
              if (c === '"' || c === '\'') {
                inQuote = c;
              }
              else if (c === '[') {
                bracketDepth++;
              }
              else if (c === ']') {
                bracketDepth--;
              }
            }
            pos++;
          }
          if (bracketDepth !== 0) {
            pos = bracketStart;
            break;
          }
        }
        else {
          break;
        }
      }

      const val = s.slice(start, pos);
      tokens.push({ value: val, tokenType: 'DATA_PATH', tokensConsumed: 1, pos: start });
      continue;
    }

    const idMatch = s.slice(pos).match(/^[a-z_][\w-]*/i);
    if (idMatch) {
      const word = idMatch[0];
      const lowerWord = word.toLowerCase();
      const start = pos;
      pos += word.length;

      const following = s.slice(pos).trimStart();
      const lastToken = tokens[tokens.length - 1];

      const isObjectKey
        = inObjectStack[inObjectStack.length - 1]
          && following.startsWith(':')
          && ternaryStack[ternaryStack.length - 1] === 0
          && (!lastToken
            || lastToken.tokenType === 'CONTAINER_OBJECT'
            || lastToken.tokenType === 'DELIMITER_COMMA');

      if (isObjectKey) {
        tokens.push({ value: word, tokenType: 'OBJECT_KEY', tokensConsumed: 0, pos: start });
      }
      else if (following.startsWith('(') && NATIVE_FUNCTIONS.has(lowerWord)) {
        tokens.push({ value: word, tokenType: 'NATIVE_FUNCTION', tokensConsumed: 1, pos: start });
      }
      else if (RELATIONAL_KEYWORDS.has(lowerWord)) {
        tokens.push({ value: word, tokenType: 'OPERATOR_RELATIONAL', tokensConsumed: 1, pos: start });
      }
      else if (LOGICAL_KEYWORDS.has(lowerWord)) {
        tokens.push({ value: word, tokenType: 'OPERATOR_LOGICAL', tokensConsumed: 1, pos: start });
      }
      else if (MEMBERSHIP_KEYWORDS.has(lowerWord)) {
        tokens.push({ value: word, tokenType: 'OPERATOR_MEMBERSHIP', tokensConsumed: 1, pos: start });
      }
      else if (LAMBDA_KEYWORDS.has(lowerWord)) {
        tokens.push({ value: word, tokenType: 'OPERATOR_LAMBDA', tokensConsumed: 1, pos: start });
      }
      else if (COLLECTION_KEYWORDS.has(lowerWord)) {
        tokens.push({ value: word, tokenType: 'OPERATOR_COLLECTION', tokensConsumed: 1, pos: start });
      }
      else if (BOOLEAN_KEYWORDS.has(lowerWord)) {
        tokens.push({ value: word, tokenType: 'BOOLEAN_LITERAL', tokensConsumed: 1, pos: start });
      }
      else {
        tokens.push({ value: word, tokenType: 'IDENTIFIER', tokensConsumed: 1, pos: start });
      }
      continue;
    }

    const numMatch = s.slice(pos).match(/^-?\d+(?:\.\d+)?/);
    if (numMatch) {
      const val = numMatch[0];
      tokens.push({ value: val, tokenType: 'NUMBER_LITERAL', tokensConsumed: 1, pos });
      pos += val.length;
      continue;
    }

    if (ch === '.') {
      const dotMatch = s.slice(pos).match(/^\.[\w-]+/);
      if (dotMatch) {
        const val = dotMatch[0];
        tokens.push({ value: val, tokenType: 'PROPERTY_ACCESS', tokensConsumed: 1, pos });
        pos += val.length;
        continue;
      }
      pos++;
      continue;
    }

    pos++;
  }

  return tokens;
}

export function countExpressionTokens(exprText: string): number {
  const trimmed = exprText.trim();
  if (!trimmed) {
    return 0;
  }
  const tokens = tokenizeExpression(trimmed);
  return tokens.reduce((acc, t) => acc + t.tokensConsumed, 0);
}

export function analyzeExpressionBudget(expr: string): ExpressionBudgetResult {
  const flatExpr = flattenMultilineExpression(expr);
  const rawTokens = tokenizeExpression(flatExpr);
  const tokenStream: TokenInfo[] = rawTokens.map(t => ({
    value: t.value,
    tokenType: t.tokenType,
    tokensConsumed: t.tokensConsumed,
  }));
  const totalTokens = tokenStream.reduce((acc, t) => acc + t.tokensConsumed, 0);

  let status: 'SAFE' | 'WARNING' | 'EXCEEDED';
  let isValid: boolean;
  let recommendation: string;

  if (totalTokens > COMPILER_QUOTA_LIMIT) {
    status = 'EXCEEDED';
    isValid = false;
    recommendation = `CRITICAL: Expression uses ${totalTokens} tokens (limit is ${COMPILER_QUOTA_LIMIT}). Blogger compiler will abort with a fatal 'Invalid expression' error. Decompose using <b:with value='...' var='...'>.`;
  }
  else if (totalTokens >= COMPILER_QUOTA_WARNING) {
    status = 'WARNING';
    isValid = true;
    recommendation = `CAUTION: Expression uses ${totalTokens} tokens (limit is ${COMPILER_QUOTA_LIMIT}). Approaching compiler ceiling. Consider decomposing with <b:with> for safety.`;
  }
  else {
    status = 'SAFE';
    isValid = true;
    recommendation = `SAFE: Expression consumes ${totalTokens}/${COMPILER_QUOTA_LIMIT} tokens.`;
  }

  return {
    expression: flatExpr,
    totalTokens,
    isValid,
    status,
    tokenStream,
    recommendation,
  };
}

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

      // 1. Check token quota (> 40 tokens)
      const tokenCount = countExpressionTokens(attrVal);
      if (tokenCount > 40) {
        const fullRange = createRange(lineOffsets, attrValOffset, attrValOffset + attrVal.length);
        diagnostics.push({
          code: 'blogger.quota.token-limit',
          message: `Expression exceeds Blogger compiler token limit (currently ${tokenCount} tokens, maximum is 40). Break it down into intermediate variables using <b:with> to avoid server compilation rejection.`,
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
