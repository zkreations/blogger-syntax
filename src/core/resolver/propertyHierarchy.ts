import type { BloggerProperty } from '../models/types.js';
import { bloggerGlobalRoot } from '../data/globalData.js';
import { getPropertyMembers } from '../data/typeMembers.js';
import { getWidgetDescriptor } from '../data/widgetDescriptors.js';

export interface PropertyNavigationResult {
  readonly target?: BloggerProperty | undefined;
  readonly children?: Record<string, BloggerProperty> | undefined;
}

export function navigatePropertyPath(
  segments: readonly string[],
  localVariables?: Record<string, BloggerProperty>,
  rootTree: Record<string, BloggerProperty> = bloggerGlobalRoot,
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
    return undefined;
  }

  let currentMap: Record<string, BloggerProperty> | undefined = getPropertyMembers(targetProperty);

  for (const segment of restSegments) {
    if (!segment || !currentMap) {
      return undefined;
    }

    let nextProp = currentMap[segment];

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
      const descriptorProps = getWidgetDescriptor(cleanSegment);
      nextProp = {
        name: cleanSegment,
        type: 'object',
        description: `Layout descriptor object for widget "${cleanSegment}".`,
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
