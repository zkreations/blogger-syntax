import type { BloggerDataType, BloggerProperty } from '../models/types.js';
import { bloggerGlobalRoot } from '../data/globalData.js';
import { getPropertyMembers } from '../data/typeMembers.js';
import {
  commentProperties,
  labelItemProperties,
  linkItemProperties,
  singlePostProperties,
  WIDGET_DATA_DICTIONARIES,
} from '../data/widgetsData.js';
import { getArrayElementProperty, inferExpressionType } from '../parser/exprParser.js';
import { navigatePropertyPath } from '../resolver/pathResolver.js';

const PATH_EXTRACTOR_REGEX = /^(?:data:)?([\w.]+)/;

/**
 * Extracts normalized path segments from a data expression like 'data:posts', 'data:posts.first', or 'data:post.comments'.
 */
export function extractDataPathSegments(expression: string): string[] {
  const trimmed = expression.trim();
  const match = PATH_EXTRACTOR_REGEX.exec(trimmed);
  if (!match || !match[1]) {
    return [];
  }
  return match[1].split('.').filter(Boolean);
}

/**
 * Navigates a path across active local variables and the global root.
 */
export function resolvePropertyFromScope(
  segments: readonly string[],
  localVariables?: Record<string, BloggerProperty>,
  rootTree: Record<string, BloggerProperty> = bloggerGlobalRoot,
): BloggerProperty | undefined {
  const direct = navigatePropertyPath(segments, localVariables, rootTree)?.target;
  if (direct) {
    return direct;
  }

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
 * Infers variable properties defined in a `<b:loop>` tag.
 */
export function inferLoopVariables(
  valuesExpr: string,
  varName?: string,
  indexName?: string,
  localVariables?: Record<string, BloggerProperty>,
): Record<string, BloggerProperty> {
  const result: Record<string, BloggerProperty> = {};

  if (varName && varName.trim()) {
    const cleanVarName = varName.trim();
    if (/\bto\b/i.test(valuesExpr)) {
      result[cleanVarName] = {
        name: cleanVarName,
        type: 'number',
        description: `Loop number variable for range \`${valuesExpr}\`.`,
      };
    }
    else {
      const segments = extractDataPathSegments(valuesExpr);
      const resolvedProp = resolvePropertyFromScope(segments, localVariables);

      let children = resolvedProp?.children;
      let type: BloggerDataType = resolvedProp?.type ?? 'object';

      if (resolvedProp?.type === 'array') {
        const itemProp = getArrayElementProperty(resolvedProp);
        children = itemProp?.children;
        type = itemProp?.type ?? 'object';
      }

      result[cleanVarName] = {
        name: cleanVarName,
        type,
        description: resolvedProp?.description
          ? `Loop variable for \`${valuesExpr}\`: ${resolvedProp.description}`
          : `Loop variable representing each item in \`${valuesExpr}\`.`,
        children,
        docUrl: resolvedProp?.docUrl,
      };
    }
  }

  if (indexName && indexName.trim()) {
    const cleanIndexName = indexName.trim();
    result[cleanIndexName] = {
      name: cleanIndexName,
      type: 'number',
      description: `Zero-based loop index variable for \`${valuesExpr}\`.`,
    };
  }

  return result;
}

/**
 * Infers variable properties defined in a `<b:with>` tag.
 */
export function inferWithVariables(
  valueExpr: string,
  varName?: string,
  localVariables?: Record<string, BloggerProperty>,
): Record<string, BloggerProperty> {
  const result: Record<string, BloggerProperty> = {};

  if (varName && varName.trim()) {
    const cleanVarName = varName.trim();
    const inferred = inferExpressionType(valueExpr, localVariables);

    let resolvedProp = inferred.targetProperty;
    if (!resolvedProp) {
      const segments = extractDataPathSegments(valueExpr);
      resolvedProp = resolvePropertyFromScope(segments, localVariables);
    }

    const children = resolvedProp?.children;
    const type: BloggerDataType = inferred.type !== 'object' ? inferred.type : (resolvedProp?.type ?? 'object');

    result[cleanVarName] = {
      name: cleanVarName,
      type,
      description: resolvedProp?.description
        ? `Alias variable for \`${valueExpr}\`: ${resolvedProp.description}`
        : `Alias variable holding the value of \`${valueExpr}\`.`,
      children,
      itemChildren: inferred.itemChildren ?? resolvedProp?.itemChildren,
      docUrl: resolvedProp?.docUrl,
    };
  }

  return result;
}

/**
 * Parses simple object literals like `{ depth: 3 }` or `{ name: "Daniel", id: 99 }`
 * or `{ items: data:this.posts }`.
 */
export function parseObjectLiteralProperties(
  literalExpr: string,
  localVariables?: Record<string, BloggerProperty>,
  rootTree: Record<string, BloggerProperty> = bloggerGlobalRoot,
): Record<string, BloggerProperty> | undefined {
  const trimmed = literalExpr.trim();
  if (!trimmed.startsWith('{') || !trimmed.endsWith('}')) {
    return undefined;
  }
  const inner = trimmed.slice(1, -1).trim();
  if (!inner) {
    return {};
  }

  const result: Record<string, BloggerProperty> = {};
  const pairRegex = /(?:^|,)\s*([\w-]+)\s*:\s*([^,]+)/g;
  while (true) {
    const match = pairRegex.exec(inner);
    if (match === null) {
      break;
    }

    const key = match[1]?.trim();
    const val = match[2]?.trim();
    if (!key || !val) {
      continue;
    }

    if (/^["'].*["']$/.test(val)) {
      result[key] = { name: key, type: 'string', description: `Passed literal string: ${val}` };
    }
    else if (/^\d+(?:\.\d+)?$/.test(val)) {
      result[key] = { name: key, type: 'number', description: `Passed literal numeric value: ${val}` };
    }
    else if (val === 'true' || val === 'false') {
      result[key] = { name: key, type: 'boolean', description: `Passed literal boolean value: ${val}` };
    }
    else {
      const segments = extractDataPathSegments(val);
      const resolved = resolvePropertyFromScope(segments, localVariables, rootTree);
      if (resolved) {
        result[key] = {
          name: key,
          type: resolved.type,
          description: resolved.description ?? `Passed property: ${val}`,
          children: resolved.children,
          itemChildren: resolved.itemChildren,
          docUrl: resolved.docUrl,
        };
      }
      else {
        result[key] = { name: key, type: 'object', description: `Passed expression: ${val}` };
      }
    }
  }

  return Object.keys(result).length > 0 ? result : undefined;
}

/**
 * Infers variable properties defined in a `<b:includable>` tag, either from
 * an explicit forwarded dataset from `<b:include data='...'>` or via semantic conventions.
 */
export function inferIncludableVariables(
  varName: string | undefined,
  includeDataExpr: string | string[] | undefined,
  localVariables?: Record<string, BloggerProperty>,
  enclosingWidgetType?: string,
  rootTree: Record<string, BloggerProperty> = bloggerGlobalRoot,
): Record<string, BloggerProperty> {
  const result: Record<string, BloggerProperty> = {};
  const exprs = Array.isArray(includeDataExpr)
    ? includeDataExpr
    : includeDataExpr
      ? [includeDataExpr]
      : [];

  if (!varName || !varName.trim()) {
    for (const expr of exprs) {
      if (expr && expr.trim()) {
        const parsedLiteral = parseObjectLiteralProperties(expr, localVariables, rootTree);
        if (parsedLiteral) {
          Object.assign(result, parsedLiteral);
        }
      }
    }
    return result;
  }

  const cleanVarName = varName.trim();

  // 1. Explicit forwarded dataset from <b:include data='...'>
  if (exprs.length > 0) {
    const combinedChildren: Record<string, BloggerProperty> = {};
    let combinedItemChildren: Record<string, BloggerProperty> | undefined;
    let resolvedType: BloggerDataType = 'object';
    let docUrl: string | readonly string[] | undefined;
    let hasResolved = false;

    for (const expr of exprs) {
      const trimmedExpr = expr.trim();
      if (!trimmedExpr) {
        continue;
      }

      const parsedLiteral = parseObjectLiteralProperties(trimmedExpr, localVariables, rootTree);
      if (parsedLiteral) {
        Object.assign(combinedChildren, parsedLiteral);
        hasResolved = true;
        continue;
      }

      const segments = extractDataPathSegments(trimmedExpr);
      const resolvedProp = resolvePropertyFromScope(segments, localVariables, rootTree);
      if (resolvedProp) {
        hasResolved = true;
        resolvedType = resolvedProp.type;
        docUrl = resolvedProp.docUrl;

        if (resolvedProp.itemChildren) {
          combinedItemChildren = {
            ...(combinedItemChildren ?? {}),
            ...resolvedProp.itemChildren,
          };
          Object.assign(combinedChildren, resolvedProp.itemChildren);
        }
        if (resolvedProp.children) {
          Object.assign(combinedChildren, resolvedProp.children);
        }
      }
    }

    if (hasResolved) {
      result[cleanVarName] = {
        name: cleanVarName,
        type: resolvedType,
        description: `Passed parameter for \`${exprs.join(', ')}\`.`,
        children: Object.keys(combinedChildren).length > 0 ? combinedChildren : undefined,
        itemChildren: combinedItemChildren,
        docUrl,
      };
      return result;
    }
  }

  // 2. Canonical var='this'
  if (cleanVarName === 'this') {
    if (enclosingWidgetType && WIDGET_DATA_DICTIONARIES[enclosingWidgetType]) {
      result[cleanVarName] = {
        name: 'this',
        type: 'object',
        description: `Current ${enclosingWidgetType} widget data context.`,
        children: WIDGET_DATA_DICTIONARIES[enclosingWidgetType],
      };
      return result;
    }
    result[cleanVarName] = {
      name: 'this',
      type: 'object',
      description: 'Current widget data context.',
    };
    return result;
  }

  // 3. Fallback semantic conventions by parameter name
  if (cleanVarName === 'post') {
    result[cleanVarName] = {
      name: 'post',
      type: 'object',
      description: 'Current post object context.',
      children: singlePostProperties,
    };
    return result;
  }

  if (cleanVarName === 'comment') {
    result[cleanVarName] = {
      name: 'comment',
      type: 'object',
      description: 'Current comment item context.',
      children: commentProperties,
    };
    return result;
  }

  if (cleanVarName === 'label') {
    result[cleanVarName] = {
      name: 'label',
      type: 'object',
      description: 'Current label item context.',
      children: labelItemProperties,
    };
    return result;
  }

  if (cleanVarName === 'link') {
    result[cleanVarName] = {
      name: 'link',
      type: 'object',
      description: 'Current link item context.',
      children: linkItemProperties,
    };
    return result;
  }

  // 4. Generic parameter fallback
  result[cleanVarName] = {
    name: cleanVarName,
    type: 'object',
    description: `Subroutine parameter \`${cleanVarName}\`.`,
  };

  return result;
}
