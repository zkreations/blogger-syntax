import type { BloggerDataType, BloggerProperty } from '../models/types.js';
import { getSpecCatalog } from 'blogger-spec/catalogs';
import { resolveDataPath } from 'blogger-spec/data-path';
import {
  bloggerGlobalRoot,
  getPropertyMembers,
  getWidgetDescriptor,
} from './dataModel.js';
import { buildPropertiesFromSpec } from './specModelAdapter.js';

export {
  createArrayProperties,
  getCategorizedPropertyMembers,
  getPropertyMembers,
  getWidgetDescriptor,
} from './dataModel.js';

export interface PropertyNavigationResult {
  readonly target?: BloggerProperty | undefined;
  readonly children?: Record<string, BloggerProperty> | undefined;
}

export function navigatePropertyPath(
  segments: readonly string[],
  localVariables?: Record<string, BloggerProperty>,
  rootTree: Record<string, BloggerProperty> = bloggerGlobalRoot,
  skinVariables?: Record<string, BloggerProperty>,
): PropertyNavigationResult | undefined {
  if (segments.length === 0) {
    return undefined;
  }

  const normalizedSegments = segments.flatMap(s =>
    s.replace(/\[/g, '.').replace(/\]/g, '').split('.').filter(Boolean),
  );

  if (normalizedSegments.length === 0) {
    return undefined;
  }

  const [firstSegment, ...restSegments] = normalizedSegments;
  if (!firstSegment) {
    return undefined;
  }

  let targetProperty: BloggerProperty | undefined
    = localVariables?.[firstSegment] ?? rootTree[firstSegment];

  if (!targetProperty) {
    const specResolved = resolveDataPath(normalizedSegments, { catalog: getSpecCatalog(), widgetType: '' });
    if (specResolved) {
      let children: Record<string, BloggerProperty> | undefined;
      let itemChildren: Record<string, BloggerProperty> | undefined;

      if (specResolved.definition?.properties) {
        children = buildPropertiesFromSpec(specResolved.definition.properties, specResolved.path);
      }
      if (specResolved.definition?.item_properties) {
        itemChildren = buildPropertiesFromSpec(specResolved.definition.item_properties, `${specResolved.path}[]`);
      }

      targetProperty = {
        name: specResolved.name,
        type: (specResolved.type === 'array[object]' ? 'array' : (specResolved.type as BloggerDataType)),
        description: specResolved.description,
        deprecated: specResolved.isDeprecated,
        ...(children ? { children } : {}),
        ...(itemChildren ? { itemChildren } : {}),
      };
      return { target: targetProperty, children: getPropertyMembers(targetProperty) };
    }
    return undefined;
  }

  let currentMap: Record<string, BloggerProperty> | undefined = getPropertyMembers(targetProperty);

  for (const segment of restSegments) {
    if (!segment || !currentMap) {
      return undefined;
    }

    let nextProp = currentMap[segment];

    if (nextProp && nextProp.name === 'vars' && targetProperty.name === 'skin' && skinVariables) {
      nextProp = {
        ...nextProp,
        children: skinVariables,
      };
    }

    // Handle array indexing (e.g. 0, [0], i)
    if (!nextProp && targetProperty.type === 'array' && targetProperty.itemChildren) {
      const isIndex = /^\d+$/.test(segment) || /^\[\d+\]$/.test(segment) || segment === '[i]' || segment === 'i';
      if (isIndex) {
        nextProp = {
          name: `${targetProperty.name}[item]`,
          type: 'object',
          description: `Item of ${targetProperty.name} collection.`,
          children: targetProperty.itemChildren,
        };
      }
    }

    // Handle widget ID lookup on data:widgets (e.g. data:widgets.Blog1 or data:widgets.Header1)
    if (!nextProp && targetProperty.name === 'widgets') {
      const cleanSegment = segment.replace(/^\[['"]?/, '').replace(/['"]?\]$/, '');
      const specWidgetResolved = resolveDataPath(['widgets', cleanSegment], { catalog: getSpecCatalog() });
      const descriptorProps = getWidgetDescriptor(cleanSegment);
      nextProp = {
        name: cleanSegment,
        type: 'object',
        description: specWidgetResolved?.description ?? `Layout descriptor object for widget "${cleanSegment}".`,
        children: descriptorProps,
      };
    }

    if (!nextProp) {
      return undefined;
    }

    targetProperty = nextProp;
    currentMap = getPropertyMembers(targetProperty);
  }

  return { target: targetProperty, children: currentMap };
}
