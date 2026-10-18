import type { BloggerDataType, BloggerProperty } from '../models/types.js';
import { getSpecCatalog } from 'blogger-spec/catalogs';
import { resolveDataPath } from 'blogger-spec/data-path';
import { getArrayElementProperty, inferExpressionType } from '../parser/exprParser.js';
import {
  bloggerGlobalRoot,
  commentProperties,
  createArrayProperties,
  labelItemProperties,
  linkItemProperties,
  singlePostProperties,
  WIDGET_DATA_DICTIONARIES,
} from '../resolver/dataModel.js';
import { navigatePropertyPath } from '../resolver/propertyHierarchy.js';
import { buildPropertiesFromSpec } from '../resolver/specModelAdapter.js';

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
  return navigatePropertyPath(segments, localVariables, rootTree)?.target;
}

/**
 * Infers variable properties defined in a `<b:loop>` tag.
 */
export function inferLoopVariables(
  valuesExpr: string,
  varName?: string,
  indexName?: string,
  localVariables?: Record<string, BloggerProperty>,
  enclosingWidgetType?: string,
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
      let resolvedProp = resolvePropertyFromScope(segments, localVariables);

      if (!resolvedProp) {
        const specResolved = resolveDataPath(segments, {
          catalog: getSpecCatalog(),
          widgetType: enclosingWidgetType ?? '',
        });
        if (specResolved) {
          let itemChildren: Record<string, BloggerProperty> | undefined;
          let children: Record<string, BloggerProperty> | undefined;

          if (specResolved.definition?.item_properties) {
            itemChildren = buildPropertiesFromSpec(specResolved.definition.item_properties, specResolved.path);
          }
          if (specResolved.definition?.properties) {
            children = buildPropertiesFromSpec(specResolved.definition.properties, specResolved.path);
          }

          resolvedProp = {
            name: specResolved.name,
            type: specResolved.type === 'array[object]' || specResolved.isCollection ? 'array' : (specResolved.type as BloggerDataType),
            description: specResolved.description,
            ...(children ? { children } : {}),
            ...(itemChildren ? { itemChildren } : {}),
          };
        }
      }

      let children = resolvedProp?.children;
      let type: BloggerDataType = resolvedProp?.type ?? 'object';

      if (resolvedProp?.type === 'array') {
        const itemProp = getArrayElementProperty(resolvedProp);
        children = itemProp?.children ?? resolvedProp.itemChildren;
        type = itemProp?.type ?? 'object';
      }

      result[cleanVarName] = {
        name: cleanVarName,
        type,
        description: resolvedProp?.description
          ? `Loop variable for \`${valuesExpr}\`: ${resolvedProp.description}`
          : `Loop variable representing each item in \`${valuesExpr}\`.`,
        children,
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
    const parsedLiteral = parseObjectLiteralProperties(valueExpr, localVariables);
    if (parsedLiteral) {
      result[cleanVarName] = {
        name: cleanVarName,
        type: 'object',
        description: `Alias variable holding object literal \`${valueExpr}\`.`,
        children: parsedLiteral,
      };
      return result;
    }

    const inferred = inferExpressionType(valueExpr, localVariables);

    let resolvedProp = inferred.targetProperty;
    const isPureDataPath = /^(?:data:)?[\w.]+$/.test(valueExpr.trim());
    if (!resolvedProp && isPureDataPath) {
      const segments = extractDataPathSegments(valueExpr);
      resolvedProp = resolvePropertyFromScope(segments, localVariables);
    }

    const type: BloggerDataType = inferred.type !== 'object'
      ? inferred.type
      : (resolvedProp?.type ?? 'object');

    const isScalarPrimitive = type === 'number' || type === 'boolean' || type === 'string';
    let children: Record<string, BloggerProperty> | undefined;
    let itemChildren: Record<string, BloggerProperty> | undefined;

    if (!isScalarPrimitive) {
      if (type === 'array') {
        itemChildren = inferred.itemChildren ?? resolvedProp?.itemChildren;
        children = inferred.children ?? resolvedProp?.children;
        if (!children && itemChildren) {
          children = createArrayProperties(itemChildren);
        }
      }
      else if (type === 'object') {
        children = inferred.children ?? resolvedProp?.children;
      }
    }

    result[cleanVarName] = {
      name: cleanVarName,
      type,
      description: resolvedProp?.description
        ? `Alias variable for \`${valueExpr}\`: ${resolvedProp.description}`
        : `Alias variable holding the value of \`${valueExpr}\`.`,
      children,
      itemChildren,
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
        };
      }
      else {
        result[key] = { name: key, type: 'object', description: `Passed expression: ${val}` };
      }
    }
  }

  return Object.keys(result).length > 0 ? result : undefined;
}

export type ForwardedIncludeItem = string | { readonly expr: string; readonly localVariables?: Record<string, BloggerProperty> };

/**
 * Infers variable properties defined in a `<b:includable>` tag, either from
 * an explicit forwarded dataset from `<b:include data='...'>` or via semantic conventions.
 */
export function inferIncludableVariables(
  varName: string | undefined,
  includeDataExpr: ForwardedIncludeItem | ForwardedIncludeItem[] | undefined,
  localVariables?: Record<string, BloggerProperty>,
  enclosingWidgetType?: string,
  rootTree: Record<string, BloggerProperty> = bloggerGlobalRoot,
): Record<string, BloggerProperty> {
  const result: Record<string, BloggerProperty> = {};
  const exprs: ForwardedIncludeItem[] = Array.isArray(includeDataExpr)
    ? includeDataExpr
    : includeDataExpr
      ? [includeDataExpr]
      : [];

  if (!varName || !varName.trim()) {
    for (const exprItem of exprs) {
      const expr = typeof exprItem === 'string' ? exprItem : exprItem.expr;
      const callSiteVariables = typeof exprItem === 'string'
        ? localVariables
        : (exprItem.localVariables ?? localVariables);
      if (expr && expr.trim()) {
        const parsedLiteral = parseObjectLiteralProperties(expr, callSiteVariables, rootTree);
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
    let hasResolved = false;

    for (const exprItem of exprs) {
      const trimmedExpr = (typeof exprItem === 'string' ? exprItem : exprItem.expr).trim();
      const callSiteVariables = typeof exprItem === 'string'
        ? localVariables
        : (exprItem.localVariables ?? localVariables);

      if (!trimmedExpr) {
        continue;
      }

      const parsedLiteral = parseObjectLiteralProperties(trimmedExpr, callSiteVariables, rootTree);
      if (parsedLiteral) {
        Object.assign(combinedChildren, parsedLiteral);
        hasResolved = true;
        continue;
      }

      const segments = extractDataPathSegments(trimmedExpr);
      const resolvedProp = resolvePropertyFromScope(segments, callSiteVariables, rootTree);
      if (resolvedProp) {
        hasResolved = true;
        resolvedType = resolvedProp.type;

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
      const exprStrings = exprs.map(e => typeof e === 'string' ? e : e.expr);
      result[cleanVarName] = {
        name: cleanVarName,
        type: resolvedType,
        description: `Passed parameter for \`${exprStrings.join(', ')}\`.`,
        children: Object.keys(combinedChildren).length > 0 ? combinedChildren : undefined,
        itemChildren: combinedItemChildren,
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

  // 3. Fallback semantic conventions by parameter name resolved via canonical blogger-spec
  const catalog = getSpecCatalog();
  if (cleanVarName === 'post') {
    const postItemProps = catalog.getWidget('Blog')?.canonical?.posts?.item_properties;
    result[cleanVarName] = {
      name: 'post',
      type: 'object',
      description: 'Current post object context.',
      children: postItemProps ? buildPropertiesFromSpec(postItemProps, 'widget.Blog.posts[]') : singlePostProperties,
    };
    return result;
  }

  if (cleanVarName === 'comment') {
    const commentItemProps = catalog.getWidget('Blog')?.canonical?.posts?.item_properties?.comments?.item_properties;
    result[cleanVarName] = {
      name: 'comment',
      type: 'object',
      description: 'Current comment item context.',
      children: commentItemProps ? buildPropertiesFromSpec(commentItemProps, 'widget.Blog.posts[].comments[]') : commentProperties,
    };
    return result;
  }

  if (cleanVarName === 'label') {
    const labelItemProps = catalog.getWidget('Label')?.canonical?.labels?.item_properties;
    result[cleanVarName] = {
      name: 'label',
      type: 'object',
      description: 'Current label item context.',
      children: labelItemProps ? buildPropertiesFromSpec(labelItemProps, 'widget.Label.labels[]') : labelItemProperties,
    };
    return result;
  }

  if (cleanVarName === 'link') {
    const linkItemProps = catalog.getWidget('LinkList')?.canonical?.links?.item_properties;
    result[cleanVarName] = {
      name: 'link',
      type: 'object',
      description: 'Current link item context.',
      children: linkItemProps ? buildPropertiesFromSpec(linkItemProps, 'widget.LinkList.links[]') : linkItemProperties,
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
