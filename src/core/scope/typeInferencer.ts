import type { BloggerDataType, BloggerProperty } from '../models/types.js';
import { bloggerGlobalRoot } from '../data/globalData.js';

const PATH_EXTRACTOR_REGEX = /^(?:data:)?([\w.]+)/;

export function extractDataPathSegments(expression: string): string[] {
  const trimmed = expression.trim();
  const match = PATH_EXTRACTOR_REGEX.exec(trimmed);
  if (!match || !match[1]) {
    return [];
  }
  return match[1].split('.').filter(Boolean);
}

export function resolvePropertyFromScope(
  segments: readonly string[],
  localVariables?: Record<string, BloggerProperty>,
  rootTree: Record<string, BloggerProperty> = bloggerGlobalRoot,
): BloggerProperty | undefined {
  if (segments.length === 0) {
    return undefined;
  }

  const [firstSegment, ...restSegments] = segments;
  if (!firstSegment) {
    return undefined;
  }

  let currentProperty: BloggerProperty | undefined
    = localVariables?.[firstSegment] ?? rootTree[firstSegment];

  if (!currentProperty) {
    return undefined;
  }

  for (const segment of restSegments) {
    if (!segment) {
      return undefined;
    }

    if ((segment === 'first' || segment === 'last') && currentProperty.type === 'array') {
      currentProperty = {
        name: segment,
        type: 'object',
        description: `Element from ${currentProperty.name}`,
        children: currentProperty.children,
      };
      continue;
    }

    if (!currentProperty.children) {
      return undefined;
    }

    currentProperty = currentProperty.children[segment];
    if (!currentProperty) {
      return undefined;
    }
  }

  return currentProperty;
}

export function inferLoopVariables(
  valuesExpr: string,
  varName?: string,
  indexName?: string,
  localVariables?: Record<string, BloggerProperty>,
): Record<string, BloggerProperty> {
  const result: Record<string, BloggerProperty> = {};

  if (varName && varName.trim()) {
    const cleanVarName = varName.trim();
    const segments = extractDataPathSegments(valuesExpr);
    const resolvedProp = resolvePropertyFromScope(segments, localVariables);

    const children = resolvedProp?.children;
    const type: BloggerDataType = resolvedProp?.type === 'array' ? 'object' : (resolvedProp?.type ?? 'object');

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

export function inferWithVariables(
  valueExpr: string,
  varName?: string,
  localVariables?: Record<string, BloggerProperty>,
): Record<string, BloggerProperty> {
  const result: Record<string, BloggerProperty> = {};

  if (varName && varName.trim()) {
    const cleanVarName = varName.trim();
    const segments = extractDataPathSegments(valueExpr);
    const resolvedProp = resolvePropertyFromScope(segments, localVariables);

    const children = resolvedProp?.children;
    const type: BloggerDataType = resolvedProp?.type ?? 'object';

    result[cleanVarName] = {
      name: cleanVarName,
      type,
      description: resolvedProp?.description
        ? `Alias variable for \`${valueExpr}\`: ${resolvedProp.description}`
        : `Alias variable holding the value of \`${valueExpr}\`.`,
      children,
      docUrl: resolvedProp?.docUrl,
    };
  }

  return result;
}
