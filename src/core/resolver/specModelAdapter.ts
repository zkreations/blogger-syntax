import type { BloggerDataType, BloggerProperty } from '../models/types.js';
import { getSpecCatalog } from 'blogger-spec/catalogs';

const CANONICAL_PROPERTY_ORDERS: Record<string, readonly string[]> = {
  'string': ['escaped', 'jsEscaped', 'jsonEscaped', 'cssEscaped', 'length', 'size'],
  'url': ['canonical', 'https', 'http', 'escaped', 'jsEscaped', 'jsonEscaped', 'cssEscaped', 'length', 'size'],
  'date': ['year', 'month', 'day', 'dayOfWeek', 'dayOfMonth', 'dayOfYear', 'iso8601'],
  'image': ['width', 'height', 'originalWidth', 'originalHeight', 'isResizable', 'isYouTube', 'youtubeMaxResDefaultUrl'],
  'locale': ['name', 'language', 'country', 'variant', 'script', 'languageDirection', 'languageAlignment'],
  'data.view.archive': ['rangeMessage', 'day', 'month', 'year'],
  'data.view.search': ['resultsMessageHtml', 'resultsMessage', 'query', 'label'],
  'widget.Blog.posts[].author': ['name', 'profileUrl', 'authorPhoto', 'aboutMe'],
  'widget.Blog.posts[].author.authorPhoto': ['image', 'width', 'height', 'alt'],
  'widget.Blog.posts[].snippets': ['short', 'long'],
  'descriptor.Blog.posts[]': ['id', 'title', 'featuredImage', 'showInlineAds'],
  'descriptor.PopularPosts.posts[]': ['id', 'title'],
};

export function toBloggerDataType(specType?: string): BloggerDataType {
  if (!specType) {
    return 'unknown';
  }
  if (specType.startsWith('array')) {
    return 'array';
  }
  if (specType.includes('image')) {
    return 'image';
  }
  if (specType.includes('url')) {
    return 'url';
  }
  switch (specType) {
    case 'string':
    case 'number':
    case 'boolean':
    case 'url':
    case 'image':
    case 'date':
    case 'locale':
    case 'message':
    case 'object':
    case 'array':
      return specType;
    default:
      return 'object';
  }
}

export function buildPropertiesFromSpec(
  specProperties: Record<string, any> | undefined,
  pathPrefix: string = '',
): Record<string, BloggerProperty> {
  if (!specProperties) {
    return {};
  }

  const result: Record<string, BloggerProperty> = {};
  const order = CANONICAL_PROPERTY_ORDERS[pathPrefix];
  const keys = Object.keys(specProperties);
  if (order) {
    keys.sort((a, b) => {
      const idxA = order.indexOf(a);
      const idxB = order.indexOf(b);
      if (idxA !== -1 && idxB !== -1)
        return idxA - idxB;
      if (idxA !== -1)
        return -1;
      if (idxB !== -1)
        return 1;
      return a.localeCompare(b);
    });
  }

  for (const name of keys) {
    const propDef = specProperties[name];
    if (!propDef) {
      continue;
    }
    const currentPath = pathPrefix ? `${pathPrefix}.${name}` : name;
    const type = toBloggerDataType(propDef.type);

    let children: Record<string, BloggerProperty> | undefined;
    let itemChildren: Record<string, BloggerProperty> | undefined;

    if (propDef.properties) {
      children = buildPropertiesFromSpec(propDef.properties, currentPath);
    }

    if (propDef.item_properties) {
      itemChildren = buildPropertiesFromSpec(propDef.item_properties, `${currentPath}[]`);
    }

    result[name] = {
      name,
      type,
      description: propDef.description,
      ...(children ? { children } : {}),
      ...(itemChildren ? { itemChildren } : {}),
    };
  }

  return result;
}

export function buildTypeMembersFromSpec(
  typeName: string,
): Record<string, BloggerProperty> {
  const typeDef = getSpecCatalog().getType(typeName);
  if (!typeDef?.modifiers) {
    return {};
  }

  const order = CANONICAL_PROPERTY_ORDERS[typeName];
  const keys = Object.keys(typeDef.modifiers);
  if (order) {
    keys.sort((a, b) => {
      const idxA = order.indexOf(a);
      const idxB = order.indexOf(b);
      if (idxA !== -1 && idxB !== -1)
        return idxA - idxB;
      if (idxA !== -1)
        return -1;
      if (idxB !== -1)
        return 1;
      return a.localeCompare(b);
    });
  }

  const result: Record<string, BloggerProperty> = {};
  for (const modName of keys) {
    const modDef = typeDef.modifiers[modName];
    if (!modDef) {
      continue;
    }
    result[modName] = {
      name: modName,
      type: toBloggerDataType(modDef.output_type),
      description: modDef.description,
    };
  }

  return Object.freeze(result);
}

export function buildWidgetsDataDictionaries(): Record<string, Record<string, BloggerProperty>> {
  const catalog = getSpecCatalog();
  const allWidgets = catalog.getAllWidgets();
  const result: Record<string, Record<string, BloggerProperty>> = {};

  for (const [widgetType, widgetDef] of Object.entries(allWidgets)) {
    result[widgetType] = buildPropertiesFromSpec(widgetDef.canonical, `widget.${widgetType}`);
  }

  return result;
}

export function buildWidgetDescriptors(): {
  baseDescriptor: Record<string, BloggerProperty>;
  descriptorsMap: Record<string, Record<string, BloggerProperty>>;
} {
  const catalog = getSpecCatalog();
  const widgetsGlobal = catalog.getGlobal('data:widgets');
  const baseDescriptor = buildPropertiesFromSpec(widgetsGlobal?.item_properties, 'descriptor.base');

  const descriptorsMap: Record<string, Record<string, BloggerProperty>> = {};
  if (widgetsGlobal?.canonical) {
    for (const [name, def] of Object.entries(widgetsGlobal.canonical)) {
      if (def.item_properties) {
        descriptorsMap[name] = buildPropertiesFromSpec(def.item_properties, `descriptor.${name}`);
      }
    }
  }

  return { baseDescriptor, descriptorsMap };
}

export function buildMessagesProperties(): Record<string, BloggerProperty> {
  const catalog = getSpecCatalog();
  const allMessages = catalog.getAllMessages();
  const result: Record<string, BloggerProperty> = {};

  for (const [name, msg] of Object.entries(allMessages)) {
    const isParam = msg.direct_invocation === false || Boolean(msg.parameters && msg.parameters.length > 0);
    result[name] = {
      name,
      type: 'message',
      description: isParam
        ? `Blogger localized UI message: ${name}. [Requires <b:message> and <b:param>; direct invocation via <data:messages.${name}/> is prohibited.]`
        : `Blogger localized UI message: ${name}`,
    };
  }

  return result;
}
