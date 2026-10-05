import type { BloggerDataType, BloggerProperty } from '../models/types.js';
import { bloggerGlobalRoot } from '../data/globalData.js';
import { getPropertyMembers } from '../data/typeMembers.js';
import {
  commentProperties,
  postLabelItemProperties,
  singlePostProperties,
  WIDGET_DATA_DICTIONARIES,
} from '../data/widgetsData.js';
import { navigatePropertyPath } from '../resolver/pathResolver.js';

export interface ActiveLambdaContext {
  readonly paramName: string;
  readonly collectionExpression: string;
  readonly typedChain: readonly string[];
  readonly currentToken: string;
}

export interface InferredExprResult {
  readonly type: BloggerDataType;
  readonly targetProperty?: BloggerProperty | undefined;
  readonly children?: Record<string, BloggerProperty> | undefined;
  readonly itemChildren?: Record<string, BloggerProperty> | undefined;
}

export interface LambdaContextAtCursor {
  readonly activeParam: string;
  readonly activeScopes: Record<string, BloggerProperty>;
  readonly currentToken: string;
  readonly typedChain: readonly string[];
  readonly targetProperty?: BloggerProperty | undefined;
  readonly isNavigatingMember: boolean;
}

export interface LambdaHoverResult {
  readonly title: string;
  readonly category: 'variable' | 'data';
  readonly type: BloggerDataType;
  readonly description: string;
  readonly example: string;
  readonly range: { start: number; end: number };
  readonly docUrls?: readonly string[] | undefined;
}

/**
 * Extracts element properties for an array property.
 */
export function getArrayElementProperty(arrayProp?: BloggerProperty): BloggerProperty | undefined {
  if (!arrayProp) {
    return undefined;
  }

  if (arrayProp.itemChildren) {
    return {
      name: `${arrayProp.name}_item`,
      type: 'object',
      children: arrayProp.itemChildren,
    };
  }

  if (arrayProp.children) {
    const firstMember = arrayProp.children.first ?? arrayProp.children.last;
    if (firstMember && firstMember.children) {
      return firstMember;
    }
  }

  // Fallbacks for well-known collections
  if (arrayProp.name === 'posts' || arrayProp.name.endsWith('.posts')) {
    return {
      name: 'post',
      type: 'object',
      children: singlePostProperties,
    };
  }
  if (arrayProp.name === 'labels' || arrayProp.name.endsWith('.labels')) {
    return {
      name: 'label',
      type: 'object',
      children: postLabelItemProperties,
    };
  }
  if (arrayProp.name === 'comments' || arrayProp.name.endsWith('.comments')) {
    return {
      name: 'comment',
      type: 'object',
      children: commentProperties,
    };
  }

  return undefined;
}

/**
 * Resolves a property expression (e.g. 'data:posts', 'data:post.labels', 'p.labels')
 * using global root, local variables, and optional lambda parameter scopes.
 */
export function resolveCollectionProperty(
  collectionExpr: string,
  localVariables?: Record<string, BloggerProperty>,
  lambdaScope?: Record<string, BloggerProperty>,
): BloggerProperty | undefined {
  let trimmed = collectionExpr.trim();

  // Strip XML attribute quotes prefix if present
  const quoteIdx = Math.max(trimmed.lastIndexOf('"'), trimmed.lastIndexOf('\''));
  if (quoteIdx >= 0) {
    trimmed = trimmed.slice(quoteIdx + 1).trim();
  }

  // If it references a lambda parameter like 'p.labels' or 'item.author'
  if (lambdaScope) {
    const match = /^([a-z_]\w*)(?:\.([\w.]+))?$/i.exec(trimmed);
    if (match && match[1] && lambdaScope[match[1]]) {
      const baseParamProp = lambdaScope[match[1]]!;
      if (!match[2]) {
        return baseParamProp;
      }
      const segments = match[2].split('.').filter(Boolean);
      return navigatePropertyPath(segments, undefined, baseParamProp.children)?.target;
    }
  }

  // Standard data expression
  const rawPath = trimmed.replace(/^data:/, '');
  const segments = rawPath.replace(/\[/g, '.').replace(/\]/g, '').split('.').filter(Boolean);
  if (segments.length === 0) {
    return undefined;
  }

  // Direct navigation
  const direct = navigatePropertyPath(segments, localVariables, bloggerGlobalRoot)?.target;
  if (direct) {
    return direct;
  }

  // Fallback for posts in Blog widget
  const [first, ...rest] = segments;
  if (first === 'posts') {
    const postsProp = WIDGET_DATA_DICTIONARIES.Blog?.posts;
    if (!postsProp) {
      return undefined;
    }
    if (rest.length === 0) {
      return postsProp;
    }
    return navigatePropertyPath(rest, undefined, getPropertyMembers(postsProp))?.target;
  }

  if (first === 'post') {
    const postProp: BloggerProperty = {
      name: 'post',
      type: 'object',
      children: singlePostProperties,
    };
    if (rest.length === 0) {
      return postProp;
    }
    return navigatePropertyPath(rest, undefined, singlePostProperties)?.target;
  }

  return undefined;
}

/**
 * Detects all open lambda expressions up to cursorOffset, resolving their scopes
 * from outermost to innermost, and determines what member or parameter is being typed.
 */
export function resolveLambdaContextAtCursor(
  text: string,
  cursorOffset: number,
  localVariables?: Record<string, BloggerProperty>,
): LambdaContextAtCursor | undefined {
  const prefix = text.slice(0, cursorOffset);

  // Find all `(param =>` occurrences
  const lambdaRegex = /\(\s*([a-z_]\w*)\s*=>/gi;
  const matches: Array<{ paramName: string; openParenIndex: number; arrowEndIndex: number }> = [];

  for (const m of prefix.matchAll(lambdaRegex)) {
    if (m.index !== undefined && m[1]) {
      matches.push({
        paramName: m[1],
        openParenIndex: m.index,
        arrowEndIndex: m.index + m[0].length,
      });
    }
  }

  if (matches.length === 0) {
    return undefined;
  }

  // Filter to only those lambdas that are still open at cursorOffset
  const openLambdas: Array<{ paramName: string; openParenIndex: number; arrowEndIndex: number }> = [];
  for (const lambda of matches) {
    const afterArrow = prefix.slice(lambda.arrowEndIndex);
    let openParens = 1;
    for (let c = 0; c < afterArrow.length; c++) {
      if (afterArrow[c] === '(') {
        openParens++;
      }
      else if (afterArrow[c] === ')') {
        openParens--;
        if (openParens === 0) {
          break;
        }
      }
    }
    if (openParens > 0) {
      openLambdas.push(lambda);
    }
  }

  if (openLambdas.length === 0) {
    return undefined;
  }

  // Resolve scopes from outermost to innermost
  const activeScopes: Record<string, BloggerProperty> = {};
  for (const lambda of openLambdas) {
    const beforeLambda = prefix.slice(0, lambda.openParenIndex).trimEnd();
    const opMatch = /\b(?:filter|where|map|select|count|any|all|none)\s*$/i.exec(beforeLambda);
    const beforeOp = opMatch ? beforeLambda.slice(0, opMatch.index).trimEnd() : beforeLambda;

    const operandMatch = /(?:data:[\w.[\]]+|[a-z_]\w*(?:\.\w+)*|\([^)]+\))\s*$/i.exec(beforeOp);
    const colExpr = operandMatch ? operandMatch[0].trim() : beforeOp;

    const colProp = resolveCollectionProperty(colExpr, localVariables, activeScopes);
    const elemProp = getArrayElementProperty(colProp);

    activeScopes[lambda.paramName] = elemProp ?? {
      name: lambda.paramName,
      type: 'object',
      description: `Lambda parameter item \`${lambda.paramName}\`.`,
    };
  }

  const innermost = openLambdas[openLambdas.length - 1]!;
  const afterInnermostArrow = prefix.slice(innermost.arrowEndIndex);

  // If user is typing `data:`, let standard data completion handle it
  if (/(?:^|[^\w:.])data:[[\]\w.]*$/.test(afterInnermostArrow)) {
    return undefined;
  }

  const tokenMatch = /([a-z_]\w*(?:\.\w*)*)$/i.exec(afterInnermostArrow);
  if (!tokenMatch || !tokenMatch[1]) {
    return {
      activeParam: innermost.paramName,
      activeScopes,
      currentToken: '',
      typedChain: [],
      targetProperty: undefined,
      isNavigatingMember: false,
    };
  }

  const fullToken = tokenMatch[1];
  if (fullToken.includes('.')) {
    const parts = fullToken.split('.');
    const baseParam = parts[0]!;
    if (activeScopes[baseParam]) {
      let chain: string[];
      let currentToken: string;
      if (fullToken.endsWith('.')) {
        chain = parts.slice(1, -1);
        currentToken = '';
      }
      else {
        chain = parts.slice(1, -1);
        currentToken = parts[parts.length - 1] ?? '';
      }

      const targetProperty = chain.length === 0
        ? activeScopes[baseParam]
        : navigatePropertyPath(chain, undefined, activeScopes[baseParam]?.children)?.target;

      return {
        activeParam: innermost.paramName,
        activeScopes,
        currentToken,
        typedChain: chain,
        targetProperty,
        isNavigatingMember: true,
      };
    }
  }
  else {
    return {
      activeParam: innermost.paramName,
      activeScopes,
      currentToken: fullToken,
      typedChain: [],
      targetProperty: undefined,
      isNavigatingMember: false,
    };
  }

  return undefined;
}

/**
 * Resolves hover information for a lambda parameter or member access.
 */
export function resolveLambdaHoverAtPosition(
  lineText: string,
  character: number,
  localVariables?: Record<string, BloggerProperty>,
): LambdaHoverResult | undefined {
  const lambdaRegex = /\(\s*([a-z_]\w*)\s*=>/gi;
  const matches: Array<{ paramName: string; openParenIndex: number; arrowEndIndex: number }> = [];

  for (const m of lineText.matchAll(lambdaRegex)) {
    if (m.index !== undefined && m[1]) {
      matches.push({
        paramName: m[1],
        openParenIndex: m.index,
        arrowEndIndex: m.index + m[0].length,
      });
    }
  }

  if (matches.length === 0) {
    return undefined;
  }

  const activeScopes: Record<string, BloggerProperty> = {};
  let enclosingLambda: { paramName: string; openParenIndex: number; arrowEndIndex: number } | undefined;

  for (const lambda of matches) {
    if (character < lambda.openParenIndex) {
      continue;
    }
    let openParens = 1;
    let closedAt = -1;
    for (let c = lambda.arrowEndIndex; c < lineText.length; c++) {
      if (lineText[c] === '(') {
        openParens++;
      }
      else if (lineText[c] === ')') {
        openParens--;
        if (openParens === 0) {
          closedAt = c;
          break;
        }
      }
    }
    if (closedAt === -1 || character <= closedAt) {
      enclosingLambda = lambda;
      const beforeLambda = lineText.slice(0, lambda.openParenIndex).trimEnd();
      const opMatch = /\b(?:filter|where|map|select|count|any|all|none)\s*$/i.exec(beforeLambda);
      const beforeOp = opMatch ? beforeLambda.slice(0, opMatch.index).trimEnd() : beforeLambda;
      const operandMatch = /(?:data:[\w.[\]]+|[a-z_]\w*(?:\.\w+)*|\([^)]+\))\s*$/i.exec(beforeOp);
      const colExpr = operandMatch ? operandMatch[0].trim() : beforeOp;
      const colProp = resolveCollectionProperty(colExpr, localVariables, activeScopes);
      const elemProp = getArrayElementProperty(colProp);
      activeScopes[lambda.paramName] = elemProp ?? {
        name: lambda.paramName,
        type: 'object',
        description: `Lambda parameter item \`${lambda.paramName}\`.`,
      };
    }
  }

  if (!enclosingLambda) {
    return undefined;
  }

  const tokenRegex = /[a-z_]\w*(?:\.\w+)*/gi;
  for (const match of lineText.matchAll(tokenRegex)) {
    if (match.index === undefined) {
      continue;
    }
    const tokenStart = match.index;
    const tokenEnd = tokenStart + match[0].length;
    if (character >= tokenStart && character <= tokenEnd) {
      const token = match[0];
      const parts = token.split('.');
      const baseParam = parts[0]!;
      if (activeScopes[baseParam]) {
        if (parts.length === 1) {
          const paramProp = activeScopes[baseParam]!;
          return {
            title: `(parameter) ${baseParam}`,
            category: 'variable',
            type: paramProp.type,
            description: paramProp.description ?? `Lambda parameter variable \`${baseParam}\`.`,
            example: baseParam,
            range: { start: tokenStart, end: tokenEnd },
          };
        }

        const memberPath = parts.slice(1);
        const resolved = navigatePropertyPath(memberPath, undefined, activeScopes[baseParam]?.children)?.target;
        if (resolved) {
          return {
            title: `(property) ${token}`,
            category: 'data',
            type: resolved.type,
            description: resolved.description ?? `Property \`${memberPath.join('.')}\` of \`${baseParam}\`.`,
            example: token,
            range: { start: tokenStart, end: tokenEnd },
            docUrls: resolved.docUrl ? (typeof resolved.docUrl === 'string' ? [resolved.docUrl] : resolved.docUrl) : undefined,
          };
        }
      }
    }
  }

  return undefined;
}

/**
 * Backward compatibility alias for single lambda detection.
 */
export function detectActiveLambdaAtCursor(
  exprText: string,
  cursorOffset: number,
): ActiveLambdaContext | undefined {
  const ctx = resolveLambdaContextAtCursor(exprText, cursorOffset);
  if (!ctx) {
    return undefined;
  }
  return {
    paramName: ctx.activeParam,
    collectionExpression: '',
    typedChain: ctx.typedChain,
    currentToken: ctx.currentToken,
  };
}

/**
 * Infers the data type resulting from evaluating an expression.
 */
export function inferExpressionType(
  expr: string,
  localVariables?: Record<string, BloggerProperty>,
): InferredExprResult {
  const trimmed = expr.trim();
  if (!trimmed) {
    return { type: 'string' };
  }

  // 1. Numeric Range: "1 to 10" or "start to end"
  if (/\s+to\s+/i.test(trimmed)) {
    return {
      type: 'array',
      itemChildren: undefined,
    };
  }

  // 2. Count operation: "... count (...)" -> number
  if (/\bcount\s*\(/i.test(trimmed)) {
    return { type: 'number' };
  }

  // 3. Boolean predicates: "... any (...)", "... all (...)", "... none (...)", "in", "contains", comparisons and logical
  if (
    /\b(?:any|all|none)\s*\(/i.test(trimmed)
    || /\b(?:in|contains|and|or|not|eq|neq|lt|lte|gt|gte)\b/i.test(trimmed)
    || /==|!=/.test(trimmed)
  ) {
    return { type: 'boolean' };
  }

  // 4. Collection pipeline (filter / where / take / limit / skip / offset)
  const filterKeywordMatch = /\s+(?:filter|where)\s*\(/i.exec(trimmed);
  if (filterKeywordMatch && filterKeywordMatch.index > 0) {
    const sourceExpr = trimmed.slice(0, filterKeywordMatch.index).trim();
    const source = inferExpressionType(sourceExpr, localVariables);
    return {
      type: 'array',
      targetProperty: source.targetProperty,
      children: source.targetProperty?.children,
      itemChildren: source.itemChildren,
    };
  }

  const sliceKeywordMatch = /\s+(?:take|limit|skip|offset)\s+\d+/i.exec(trimmed);
  if (sliceKeywordMatch && sliceKeywordMatch.index > 0) {
    const sourceExpr = trimmed.slice(0, sliceKeywordMatch.index).trim();
    const source = inferExpressionType(sourceExpr, localVariables);
    return {
      type: 'array',
      targetProperty: source.targetProperty,
      children: source.targetProperty?.children,
      itemChildren: source.itemChildren,
    };
  }

  // 5. Element navigation: .first or .last
  const elementNavMatch = /(?:\.(?:first|last)|\s+(?:first|last))$/i.exec(trimmed);
  if (elementNavMatch && elementNavMatch.index > 0) {
    const sourceExpr = trimmed.slice(0, elementNavMatch.index).trim();
    const source = inferExpressionType(sourceExpr, localVariables);
    const elementProp = getArrayElementProperty(source.targetProperty);
    return {
      type: elementProp?.type ?? 'object',
      targetProperty: elementProp,
      children: elementProp?.children,
    };
  }

  // 6. Ternary operation: "cond ? branchA : branchB"
  const questionIdx = trimmed.indexOf('?');
  const colonIdx = trimmed.lastIndexOf(':');
  if (questionIdx > 0 && colonIdx > questionIdx) {
    const branchA = trimmed.slice(questionIdx + 1, colonIdx).trim();
    if ((branchA.startsWith('"') && branchA.endsWith('"')) || (branchA.startsWith('\'') && branchA.endsWith('\''))) {
      return { type: 'string' };
    }
    if (/^\d+(?:\.\d+)?$/.test(branchA)) {
      return { type: 'number' };
    }
    if (branchA === 'true' || branchA === 'false') {
      return { type: 'boolean' };
    }
    return inferExpressionType(branchA, localVariables);
  }

  // 7. String concatenation or string literal
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith('\'') && trimmed.endsWith('\''))) {
    return { type: 'string' };
  }
  if (/^\d+(?:\.\d+)?$/.test(trimmed)) {
    return { type: 'number' };
  }
  if (trimmed === 'true' || trimmed === 'false') {
    return { type: 'boolean' };
  }

  // 8. Truncation and images
  if (/\bsnippet\s*[({]/i.test(trimmed)) {
    return { type: 'string' };
  }
  if (/\bresizeImage\s*[( ]/i.test(trimmed)) {
    return { type: 'image' };
  }

  // 9. Direct collection or property path
  const targetProp = resolveCollectionProperty(trimmed, localVariables);
  if (targetProp) {
    return {
      type: targetProp.type,
      targetProperty: targetProp,
      children: targetProp.children,
      itemChildren: targetProp.itemChildren,
    };
  }

  return { type: 'object' };
}
