import type { BloggerDataType, BloggerProperty } from '../models/types.js';
import { parseExpression } from 'blogger-spec/ast';
import { getSpecCatalog } from 'blogger-spec/catalogs';
import { resolveDataPath } from 'blogger-spec/data-path';
import { getExpressionCursorContext } from 'blogger-spec/parser';
import { getTypeModifiers, inferExpressionType as specInferType } from 'blogger-spec/type-system';
import { buildPropertiesFromSpec, getPropertyMembers, resolveDataProperty } from '../resolver/dataPathAdapter.js';
import { inferSingularParamName } from '../utils/snippetFormatter.js';

export { inferSingularParamName };

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

  // Canonical spec resolution for collections lacking itemChildren
  const rawBaseName = arrayProp.name.split('.').pop() ?? arrayProp.name;
  const lookupPath = rawBaseName === 'labels'
    ? 'posts.labels'
    : rawBaseName === 'comments'
      ? 'posts.comments'
      : arrayProp.name;

  const specResolved = resolveDataPath(lookupPath, { catalog: getSpecCatalog(), widgetType: 'Blog' })
    ?? resolveDataPath(lookupPath, { catalog: getSpecCatalog(), widgetType: '' });

  if (specResolved?.definition?.item_properties) {
    const singularName = rawBaseName === 'posts'
      ? 'post'
      : rawBaseName === 'labels'
        ? 'label'
        : rawBaseName === 'comments'
          ? 'comment'
          : (rawBaseName.endsWith('s') ? rawBaseName.slice(0, -1) : `${rawBaseName}_item`);

    return {
      name: singularName,
      type: 'object',
      children: buildPropertiesFromSpec(specResolved.definition.item_properties, arrayProp.name),
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
  enclosingWidgetType?: string,
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
      return resolveDataProperty(segments, { variables: baseParamProp.children });
    }
  }

  const rawPath = trimmed.replace(/^data:/, '');
  const segments = rawPath.replace(/\[/g, '.').replace(/\]/g, '').split('.').filter(Boolean);
  if (segments.length === 0) {
    return undefined;
  }

  return resolveDataProperty(segments, {
    variables: localVariables,
    widgetType: enclosingWidgetType ?? (localVariables ? undefined : ''),
  });
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
    const opMatch = /\b(?:filter|where|map|select|count|first|any|all|none)\s*$/i.exec(beforeLambda);
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

      let targetProperty: BloggerProperty | undefined = activeScopes[baseParam];
      for (const seg of chain) {
        if (!targetProperty)
          break;
        const members = getPropertyMembers(targetProperty);
        targetProperty = members?.[seg];
      }

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
      const opMatch = /\b(?:filter|where|map|select|count|first|any|all|none)\s*$/i.exec(beforeLambda);
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
        let resolved: BloggerProperty | undefined = activeScopes[baseParam];
        for (const seg of memberPath) {
          if (!resolved)
            break;
          const members = getPropertyMembers(resolved);
          resolved = members?.[seg];
        }
        if (resolved) {
          return {
            title: `(property) ${token}`,
            category: 'data',
            type: resolved.type,
            description: resolved.description ?? `Property \`${memberPath.join('.')}\` of \`${baseParam}\`.`,
            example: token,
            range: { start: tokenStart, end: tokenEnd },
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

function unwrapOuterParens(str: string): string {
  let s = str.trim();
  while (s.startsWith('(') && s.endsWith(')')) {
    let depth = 0;
    let matched = true;
    for (let i = 0; i < s.length - 1; i++) {
      if (s[i] === '(')
        depth++;
      else if (s[i] === ')')
        depth--;
      if (depth === 0) {
        matched = false;
        break;
      }
    }
    if (matched && depth === 1) {
      s = s.slice(1, -1).trim();
    }
    else {
      break;
    }
  }
  return s;
}

function findEffectiveOperand(beforeOp: string): string {
  let depth = 0;
  let inDouble = false;
  let inSingle = false;

  for (let i = beforeOp.length - 1; i >= 0; i--) {
    const ch = beforeOp[i];
    if (ch === '"' && !inSingle) {
      inDouble = !inDouble;
    }
    else if (ch === '\'' && !inDouble) {
      inSingle = !inSingle;
    }
    else if (!inDouble && !inSingle) {
      if (ch === ')' || ch === ']' || ch === '}') {
        depth++;
      }
      else if (ch === '(' || ch === '[' || ch === '{') {
        if (depth === 0) {
          return beforeOp.slice(i + 1).trim();
        }
        depth--;
      }
      else if (depth === 0) {
        if (ch === '>' && i > 0 && beforeOp[i - 1] === '=') {
          return beforeOp.slice(i + 1).trim();
        }
        if (ch === ',' || ch === '?') {
          return beforeOp.slice(i + 1).trim();
        }
        if (ch === ':' && i > 0 && beforeOp[i - 1] !== '?') {
          return beforeOp.slice(i + 1).trim();
        }
        const sub = beforeOp.slice(0, i + 1);
        const logMatch = /\s+(?:and|or|&&|\|\|)\s*$/i.exec(sub);
        if (logMatch) {
          return beforeOp.slice(i + 1).trim();
        }
      }
    }
  }
  return beforeOp.trim();
}

export function extractLeftOperandAtCursor(
  expressionText: string,
): { operand: string; partialOp: string } | undefined {
  const ctx = getExpressionCursorContext(expressionText, expressionText.length);
  if (ctx.expectedKind === 'operator' && ctx.leftOperand) {
    let raw = ctx.leftOperand;
    if (raw.startsWith('(') && raw.endsWith(')')) {
      raw = raw.slice(1, -1).trim();
    }
    const operand = raw.startsWith('data:') ? raw.slice('data:'.length) : raw;
    return {
      operand,
      partialOp: ctx.partialOperator ?? '',
    };
  }

  const opMatch = /(?:data:[\w.[\]]*[\w\]]|[a-zA-Z_]\w*(?:\.\w+)*|\d+(?:\.\d+)?|"[^"]*"|'[^']*'|[)\]}])\s+([a-zA-Z_!=+\-*/?:%]*)$/.exec(expressionText);
  if (!opMatch) {
    return undefined;
  }
  const typedOp = opMatch[1] ?? '';
  const beforeOp = expressionText.slice(0, expressionText.length - (typedOp.length ? typedOp.length : 0)).trimEnd();
  if (!beforeOp) {
    return undefined;
  }

  const rawOperand = findEffectiveOperand(beforeOp);
  const operand = rawOperand.startsWith('data:') ? rawOperand.slice('data:'.length) : rawOperand;
  return {
    operand,
    partialOp: typedOp,
  };
}

export function extractPrecedingExpressionForMember(
  expressionText: string,
): { operand: string; partialMember: string } | undefined {
  const ctx = getExpressionCursorContext(expressionText, expressionText.length);
  if (ctx.expectedKind === 'member' && ctx.leftOperand && ctx.leftOperand.startsWith('(')) {
    const raw = ctx.leftOperand;
    const operand = raw.startsWith('(') && raw.endsWith(')') ? raw.slice(1, -1).trim() : raw;
    return {
      operand,
      partialMember: ctx.partialMember ?? '',
    };
  }
  return undefined;
}

/**
 * Infers the data type resulting from evaluating an expression.
 */
export function inferExpressionType(
  expr: string,
  localVariables?: Record<string, BloggerProperty>,
  lambdaScopes?: Record<string, BloggerProperty>,
): InferredExprResult {
  let trimmed = expr.trim();
  if (!trimmed) {
    return { type: 'unknown' };
  }

  // Parenthesized member access: (expr).modifier
  const parenMemberMatch = /^\((.+)\)\.([a-z_]\w*)$/i.exec(trimmed);
  if (parenMemberMatch && parenMemberMatch[1] && parenMemberMatch[2]) {
    const inner = parenMemberMatch[1].trim();
    const modName = parenMemberMatch[2];
    const innerRes = inferExpressionType(inner, localVariables, lambdaScopes);
    const modifiers = getTypeModifiers(innerRes.type as any);
    if (modifiers && modifiers[modName]) {
      const mod = modifiers[modName]!;
      const outType = (mod.output_type === 'child_item' || mod.output_type === 'object')
        ? 'object'
        : (mod.output_type as BloggerDataType);
      return {
        type: outType,
        targetProperty: {
          name: modName,
          type: outType,
          description: mod.description,
        },
        children: mod.output_type === 'child_item' ? innerRes.itemChildren : undefined,
      };
    }
  }

  trimmed = unwrapOuterParens(trimmed);

  if (trimmed === 'true' || trimmed === 'false') {
    return { type: 'boolean' };
  }

  // 1. Direct collection or property path (e.g. data:posts, data:post.title, p.labels)
  const isDirectDataPath = /^data:[a-z_]\w*(?:\.[\w[\]]+)*$/i.test(trimmed)
    || /^[a-z_]\w*(?:\.[\w[\]]+)+$/i.test(trimmed)
    || Boolean(localVariables?.[trimmed] || lambdaScopes?.[trimmed]);

  if (isDirectDataPath) {
    const directProp = resolveCollectionProperty(trimmed, localVariables, lambdaScopes);
    if (directProp) {
      return {
        type: directProp.type,
        targetProperty: directProp,
        children: directProp.children,
        itemChildren: directProp.itemChildren,
      };
    }
    return { type: 'unknown' };
  }

  // 2. Collection pipeline with metadata preservation (filter / where / take / limit / skip / offset)
  const filterKeywordMatch = /\s+(?:filter|where)\s*\(/i.exec(trimmed);
  if (filterKeywordMatch && filterKeywordMatch.index > 0) {
    const sourceExpr = trimmed.slice(0, filterKeywordMatch.index).trim();
    const source = inferExpressionType(sourceExpr, localVariables, lambdaScopes);
    return {
      type: 'array',
      targetProperty: source.targetProperty,
      children: source.targetProperty?.children,
      itemChildren: source.itemChildren,
    };
  }

  const firstLambdaMatch = /\s+first\s*\(/i.exec(trimmed);
  if (firstLambdaMatch && firstLambdaMatch.index > 0) {
    const sourceExpr = trimmed.slice(0, firstLambdaMatch.index).trim();
    const source = inferExpressionType(sourceExpr, localVariables, lambdaScopes);
    const elementProp = getArrayElementProperty(source.targetProperty);
    return {
      type: elementProp?.type ?? 'object',
      targetProperty: elementProp,
      children: elementProp?.children,
    };
  }

  const sliceKeywordMatch = /\s+(?:take|limit|skip|offset)\s+\d+/i.exec(trimmed);
  if (sliceKeywordMatch && sliceKeywordMatch.index > 0) {
    const sourceExpr = trimmed.slice(0, sliceKeywordMatch.index).trim();
    const source = inferExpressionType(sourceExpr, localVariables, lambdaScopes);
    return {
      type: 'array',
      targetProperty: source.targetProperty,
      children: source.targetProperty?.children,
      itemChildren: source.itemChildren,
    };
  }

  const elementNavMatch = /(?:\.(?:first|last)|\s+(?:first|last))$/i.exec(trimmed);
  if (elementNavMatch && elementNavMatch.index > 0) {
    const sourceExpr = trimmed.slice(0, elementNavMatch.index).trim();
    const source = inferExpressionType(sourceExpr, localVariables, lambdaScopes);
    const elementProp = getArrayElementProperty(source.targetProperty);
    return {
      type: elementProp?.type ?? 'object',
      targetProperty: elementProp,
      children: elementProp?.children,
    };
  }

  // 3. Delegate formal Pratt parsing and type inference to blogger-spec
  try {
    const ast = parseExpression(trimmed, { tolerant: true });
    if (ast && ast.type !== 'Error') {
      const inferred = specInferType(ast);
      if (inferred && inferred !== 'unknown') {
        const baseType: BloggerDataType = (inferred.startsWith('array[') || inferred === 'array')
          ? 'array'
          : (inferred as BloggerDataType);
        return { type: baseType };
      }
    }
  }
  catch {
    // Tolerant fallback for partially typed syntax
  }

  return { type: 'unknown' };
}

export interface LambdaPreArrowContext {
  readonly operator: string;
  readonly paramName?: string | undefined;
  readonly isWaitingForArrow: boolean;
  readonly collectionOperand?: string | undefined;
}

/**
 * Detects whether the cursor is inside an incomplete lambda before the arrow '=>'
 * (e.g. `data:posts first (` or `data:posts first (p `).
 */
export function detectLambdaPreArrowContext(
  expressionText: string,
): LambdaPreArrowContext | undefined {
  const ctx = getExpressionCursorContext(expressionText, expressionText.length);
  const lastParen = expressionText.lastIndexOf('(');
  const beforeParen = lastParen !== -1 ? expressionText.slice(0, lastParen).trimEnd() : expressionText;
  const kwMatch = /\b(filter|where|map|select|count|first|any|all|none)$/i.exec(beforeParen);
  if (!kwMatch) {
    return undefined;
  }
  const op = kwMatch[1]!;
  const beforeOp = beforeParen.slice(0, kwMatch.index).trim();
  const colMatch = /(?:data:[\w.[\]]+|[a-z_]\w*(?:\.\w+)*|\([^)]+\))\s*$/i.exec(beforeOp);
  const col = colMatch ? colMatch[0].trim() : undefined;

  if (ctx.expectedKind === 'lambda_param' && ctx.enclosingLambda?.isWaitingParam) {
    return {
      operator: op,
      paramName: undefined,
      isWaitingForArrow: false,
      collectionOperand: col,
    };
  }
  if (ctx.expectedKind === 'lambda_arrow' && ctx.enclosingLambda?.isWaitingForArrow) {
    return {
      operator: op,
      paramName: ctx.enclosingLambda.paramName,
      isWaitingForArrow: true,
      collectionOperand: col,
    };
  }
  return undefined;
}
