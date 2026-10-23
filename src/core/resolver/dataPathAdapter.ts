import type { BloggerMemberInfo } from 'blogger-spec';
import type { SpecCatalog } from 'blogger-spec/catalogs';
import type { BloggerSkinVariableSymbol, ResolveDataPathContext } from 'blogger-spec/data-path';
import type { BloggerScopeSymbol, PushScopeOptions } from 'blogger-spec/scope';
import type { BloggerDataType, BloggerProperty, BloggerSuggestion } from '../models/types.js';
import { getSpecCatalog } from 'blogger-spec/catalogs';
import { getDataPathMembers, getTypeMembers, resolveDataPath } from 'blogger-spec/data-path';
import { ScopeEnvironment } from 'blogger-spec/scope';

export function normalizeToBloggerDataType(rawType: string, isCollection?: boolean): BloggerDataType {
  if (isCollection || rawType.startsWith('array')) {
    return 'array';
  }
  if (rawType.includes('image')) {
    return 'image';
  }
  if (rawType.includes('url')) {
    return 'url';
  }
  switch (rawType) {
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
      return rawType;
    default:
      return 'object';
  }
}

export function toBloggerDataType(rawType?: string, isCollection?: boolean): BloggerDataType {
  if (!rawType) {
    return 'unknown';
  }
  return normalizeToBloggerDataType(rawType, isCollection);
}

export function mapMemberInfoToSuggestion(
  member: BloggerMemberInfo,
  basePath?: string,
): BloggerSuggestion {
  let categoryBadge = 'Property';
  let sortPriority = 20;

  if (member.isDeprecated) {
    sortPriority = 90;
  }
  else if (member.sourceCatalog === 'variables') {
    categoryBadge = 'Theme';
    sortPriority = 5;
  }
  else if (member.sourceCatalog === 'globals') {
    categoryBadge = 'Global';
    sortPriority = 10;
  }
  else if (member.isCollection) {
    categoryBadge = 'Collection';
    sortPriority = 15;
  }
  else if (member.sourceCatalog === 'widgets') {
    categoryBadge = 'Widget';
    sortPriority = 20;
  }
  else if (member.sourceCatalog === 'types' || member.isModifier) {
    categoryBadge = 'Modifier';
    sortPriority = 30;
  }
  else if (member.sourceCatalog === 'messages') {
    categoryBadge = 'Message';
    sortPriority = 40;
  }

  const kind = member.sourceCatalog === 'variables' ? 'variable' : 'property';

  return {
    name: member.name,
    type: normalizeToBloggerDataType(member.type, member.isCollection),
    description: member.description,
    example: basePath ? `data:${basePath}.${member.name}` : `data:${member.name}`,
    deprecated: member.isDeprecated,
    categoryBadge,
    sortPriority,
    kind,
  };
}

export interface ResolvePropertyContext {
  widgetType?: string | undefined;
  catalog?: SpecCatalog | undefined;
  variables?: Record<string, BloggerProperty | BloggerScopeSymbol | string> | undefined;
  scope?: ScopeEnvironment | undefined;
  skinVariables?: Record<string, BloggerProperty | BloggerSkinVariableSymbol | string> | undefined;
}

export function buildSpecContext(context?: ResolvePropertyContext): ResolveDataPathContext | undefined {
  if (!context) {
    return { widgetType: '' };
  }
  const specCtx: ResolveDataPathContext = {
    widgetType: context.widgetType ?? '',
  };
  if (context.catalog) {
    specCtx.catalog = context.catalog;
  }
  if (context.scope) {
    specCtx.scope = context.scope;
  }
  if (context.skinVariables) {
    const skinSymbols: Record<string, any> = {};
    for (const [k, v] of Object.entries(context.skinVariables)) {
      if (typeof v === 'string') {
        skinSymbols[k] = v;
      }
      else {
        const rawType = (v as any).skinType ?? v.type;
        skinSymbols[k] = {
          name: v.name ?? k,
          type: rawType,
          description: v.description,
          default: (v as any).default,
          value: (v as any).value,
        };
      }
    }
    specCtx.skinVariables = skinSymbols;
  }
  if (context.variables) {
    const symbols: Record<string, any> = {};
    for (const [k, v] of Object.entries(context.variables)) {
      if (typeof v === 'string') {
        symbols[k] = v;
      }
      else if ('scopeType' in v) {
        symbols[k] = v;
      }
      else {
        symbols[k] = {
          name: v.name,
          type: v.type,
          scopeType: 'widget',
          metadata: { description: v.description },
        };
      }
    }
    specCtx.variables = symbols;
    if (!specCtx.scope && context.widgetType) {
      const scopeEnv = new ScopeEnvironment(context.catalog);
      const pushOpts: PushScopeOptions = {
        symbols,
        widgetType: context.widgetType,
      };
      scopeEnv.pushScope('widget', pushOpts);
      specCtx.scope = scopeEnv;
    }
  }
  return specCtx;
}

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
      return 0;
    });
  }
  for (const name of keys) {
    const def = specProperties[name];
    if (!def)
      continue;
    let children: Record<string, BloggerProperty> | undefined;
    let itemChildren: Record<string, BloggerProperty> | undefined;
    if (def.properties) {
      children = buildPropertiesFromSpec(def.properties, `${pathPrefix}.${name}`);
    }
    if (def.item_properties) {
      itemChildren = buildPropertiesFromSpec(def.item_properties, `${pathPrefix}.${name}[]`);
    }
    result[name] = {
      name,
      type: toBloggerDataType(def.type),
      description: def.description,
      deprecated: def.deprecated !== undefined ? Boolean(def.deprecated) : undefined,
      example: def.example,
      ...(children ? { children } : {}),
      ...(itemChildren ? { itemChildren } : {}),
    };
  }
  return result;
}

export function buildTypeMembersFromSpec(typeName: string): Record<string, BloggerProperty> {
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
      return 0;
    });
  }
  const result: Record<string, BloggerProperty> = {};
  for (const name of keys) {
    const mod = typeDef.modifiers[name];
    if (!mod)
      continue;
    result[name] = {
      name,
      type: toBloggerDataType(mod.output_type),
      description: mod.description,
      deprecated: (mod as any).deprecated !== undefined ? Boolean((mod as any).deprecated) : undefined,
      example: mod.example,
    };
  }
  return result;
}

export const STRING_MEMBERS: Record<string, BloggerProperty> = buildTypeMembersFromSpec('string');
export const IMAGE_MEMBERS: Record<string, BloggerProperty> = buildTypeMembersFromSpec('image');
export const LOCALE_MEMBERS: Record<string, BloggerProperty> = buildTypeMembersFromSpec('locale');
export const DATE_MEMBERS: Record<string, BloggerProperty> = buildTypeMembersFromSpec('date');
export const URL_MEMBERS: Record<string, BloggerProperty> = buildTypeMembersFromSpec('url');

export function createArrayProperties(
  itemChildren?: Record<string, BloggerProperty>,
  itemType: BloggerDataType = 'object',
): Record<string, BloggerProperty> {
  return {
    size: {
      name: 'size',
      type: 'number',
      description: 'The number of elements in the collection.',
    },
    length: {
      name: 'length',
      type: 'number',
      description: 'The number of elements in the collection (alias of size).',
    },
    empty: {
      name: 'empty',
      type: 'boolean',
      description: 'Indicates whether the collection is empty.',
    },
    notEmpty: {
      name: 'notEmpty',
      type: 'boolean',
      description: 'Indicates whether the collection contains at least one element.',
    },
    any: {
      name: 'any',
      type: 'boolean',
      description: 'Indicates whether the collection contains any elements.',
    },
    first: {
      name: 'first',
      type: itemType,
      description: 'The first element in the collection.',
      ...(itemChildren ? { children: itemChildren } : {}),
    },
    last: {
      name: 'last',
      type: itemType,
      description: 'The last element in the collection.',
      ...(itemChildren ? { children: itemChildren } : {}),
    },
  };
}

export function getPropertyMembers(property: BloggerProperty): Record<string, BloggerProperty> | undefined {
  if (property.type === 'array') {
    const base = createArrayProperties(property.itemChildren, 'object');
    if (property.children && Object.keys(property.children).length > 0) {
      return { ...base, ...property.children };
    }
    return base;
  }

  if (property.type === 'string') {
    return property.children ? { ...STRING_MEMBERS, ...property.children } : STRING_MEMBERS;
  }

  if (property.type === 'image') {
    const base = { ...STRING_MEMBERS, ...IMAGE_MEMBERS };
    return property.children ? { ...base, ...property.children } : base;
  }

  if (property.type === 'locale') {
    return property.children ? { ...LOCALE_MEMBERS, ...property.children } : LOCALE_MEMBERS;
  }

  if (property.type === 'date') {
    return property.children ? { ...DATE_MEMBERS, ...property.children } : DATE_MEMBERS;
  }

  if (property.type === 'url') {
    const base = { ...STRING_MEMBERS, ...URL_MEMBERS };
    return property.children ? { ...base, ...property.children } : base;
  }

  return property.children;
}

export interface CategorizedMember {
  readonly property: BloggerProperty;
  readonly originCategory: 'image' | 'url' | 'string' | 'date' | 'locale' | 'array' | 'custom';
  readonly categoryBadge: string;
  readonly sortPriority: number;
}

export function getCategorizedPropertyMembers(
  property: BloggerProperty,
): CategorizedMember[] | undefined {
  if (property.type === 'image') {
    const result: CategorizedMember[] = [];
    for (const prop of Object.values(IMAGE_MEMBERS)) {
      result.push({ property: prop, originCategory: 'image', categoryBadge: 'Image', sortPriority: 0 });
    }
    for (const prop of Object.values(STRING_MEMBERS)) {
      result.push({ property: prop, originCategory: 'string', categoryBadge: 'String', sortPriority: 10 });
    }
    if (property.children) {
      for (const prop of Object.values(property.children)) {
        if (!result.some(r => r.property.name === prop.name)) {
          result.push({ property: prop, originCategory: 'custom', categoryBadge: 'Property', sortPriority: 0 });
        }
      }
    }
    return result;
  }

  if (property.type === 'url') {
    const result: CategorizedMember[] = [];
    for (const prop of Object.values(URL_MEMBERS)) {
      result.push({ property: prop, originCategory: 'url', categoryBadge: 'URL', sortPriority: 0 });
    }
    for (const prop of Object.values(STRING_MEMBERS)) {
      result.push({ property: prop, originCategory: 'string', categoryBadge: 'String', sortPriority: 10 });
    }
    if (property.children) {
      for (const prop of Object.values(property.children)) {
        if (!result.some(r => r.property.name === prop.name)) {
          result.push({ property: prop, originCategory: 'custom', categoryBadge: 'Property', sortPriority: 0 });
        }
      }
    }
    return result;
  }

  if (property.type === 'date') {
    const result: CategorizedMember[] = [];
    for (const prop of Object.values(DATE_MEMBERS)) {
      result.push({ property: prop, originCategory: 'date', categoryBadge: 'Date', sortPriority: 0 });
    }
    if (property.children) {
      for (const prop of Object.values(property.children)) {
        if (!result.some(r => r.property.name === prop.name)) {
          result.push({ property: prop, originCategory: 'custom', categoryBadge: 'Property', sortPriority: 0 });
        }
      }
    }
    return result;
  }

  if (property.type === 'locale') {
    const result: CategorizedMember[] = [];
    for (const prop of Object.values(LOCALE_MEMBERS)) {
      result.push({ property: prop, originCategory: 'locale', categoryBadge: 'Locale', sortPriority: 0 });
    }
    if (property.children) {
      for (const prop of Object.values(property.children)) {
        if (!result.some(r => r.property.name === prop.name)) {
          result.push({ property: prop, originCategory: 'custom', categoryBadge: 'Property', sortPriority: 0 });
        }
      }
    }
    return result;
  }

  return undefined;
}

export function getWidgetProperties(widgetType: string): Record<string, BloggerProperty> {
  const catalog = getSpecCatalog();
  const widgetDef = catalog.getWidget(widgetType);
  if (!widgetDef?.canonical) {
    return {};
  }
  return buildPropertiesFromSpec(widgetDef.canonical, `widget.${widgetType}`);
}

export function getGlobalProperties(globalName: string): Record<string, BloggerProperty> {
  const catalog = getSpecCatalog();
  const globalDef = catalog.getGlobal(`data:${globalName}`) ?? catalog.getGlobal(globalName);
  if (!globalDef?.canonical) {
    return {};
  }
  return buildPropertiesFromSpec(globalDef.canonical, `data.${globalName}`);
}

export function getWidgetDescriptor(typeOrId: string): Record<string, BloggerProperty> {
  const catalog = getSpecCatalog();
  const globalWidgets = catalog.getGlobal('data:widgets');
  const baseDesc = buildPropertiesFromSpec(globalWidgets?.item_properties, 'descriptor.base');
  const match = typeOrId.match(/^[a-z]+/i);
  const type = match ? match[0] : typeOrId;
  const widgetCanonical = globalWidgets?.canonical?.[type];
  const extendedProps = widgetCanonical?.item_properties;
  if (extendedProps) {
    return {
      ...baseDesc,
      ...buildPropertiesFromSpec(extendedProps, `descriptor.${type}`),
    };
  }
  return baseDesc;
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
        : (msg.description ?? `Blogger localized UI message: ${name}`),
    };
  }

  return result;
}

export const blogProperties: Record<string, BloggerProperty> = getGlobalProperties('blog');
export const viewProperties: Record<string, BloggerProperty> = getGlobalProperties('view');
export const skinProperties: Record<string, BloggerProperty> = getGlobalProperties('skin');
export const templateProperties: Record<string, BloggerProperty> = getGlobalProperties('template');
export const widgetMetaProperties: Record<string, BloggerProperty> = getGlobalProperties('widget');
export const messagesProperties: Record<string, BloggerProperty> = buildMessagesProperties();

export const widgetsMapProperties: Record<string, BloggerProperty> = (() => {
  const allWidgets = getSpecCatalog().getAllWidgets();
  const result: Record<string, BloggerProperty> = {};
  for (const name of Object.keys(allWidgets)) {
    const itemChildren = getWidgetDescriptor(name);
    result[name] = {
      name,
      type: 'array',
      description: `Collection of visible ${name} gadget descriptors.`,
      itemChildren,
      children: createArrayProperties(itemChildren),
    };
  }
  return result;
})();

export const bloggerGlobalRoot: Record<string, BloggerProperty> = {
  blog: {
    name: 'blog',
    type: 'object',
    description: 'Global blog information, URL structure, and configuration state.',
    children: blogProperties,
  },
  view: {
    name: 'view',
    type: 'object',
    description: 'Current request routing and page classification state.',
    children: viewProperties,
  },
  skin: {
    name: 'skin',
    type: 'object',
    description: 'Theme Designer skin variables, dynamic CSS rules, and user-configured styling.',
    children: skinProperties,
  },
  widgets: {
    name: 'widgets',
    type: 'array',
    description: 'Global cross-widget layout registry in Layouts v3.',
    itemChildren: getWidgetDescriptor(''),
    children: widgetsMapProperties,
  },
  template: {
    name: 'template',
    type: 'object',
    description: 'Template layout engine metadata and skin configuration.',
    children: templateProperties,
  },
  widget: {
    name: 'widget',
    type: 'object',
    description: 'Host widget contextual metadata and state.',
    children: widgetMetaProperties,
  },
  messages: {
    name: 'messages',
    type: 'object',
    description: 'Localized UI messages dictionary.',
    children: messagesProperties,
  },
};

export const WIDGET_DATA_DICTIONARIES: Record<string, Record<string, BloggerProperty>> = new Proxy({}, {
  get(_target, prop: string) {
    if (typeof prop !== 'string')
      return undefined;
    return getWidgetProperties(prop);
  },
});

export const blogWidgetProperties: Record<string, BloggerProperty> = getWidgetProperties('Blog');
export const labelWidgetProperties: Record<string, BloggerProperty> = getWidgetProperties('Label');

export function getCollectionItemProperties(collectionPath: string, widgetType?: string): Record<string, BloggerProperty> {
  const context: ResolvePropertyContext = {};
  if (widgetType) {
    context.widgetType = widgetType;
  }
  const effContext = buildSpecContext(context);
  const members = getDataPathMembers(`${collectionPath}.first`, effContext);
  const result: Record<string, BloggerProperty> = {};
  for (const m of members) {
    result[m.name] = memberInfoToProperty(m);
  }
  return result;
}

export const singlePostProperties: Record<string, BloggerProperty> = (blogWidgetProperties.posts?.itemChildren ?? {}) as Record<string, BloggerProperty>;
export const commentProperties: Record<string, BloggerProperty> = (singlePostProperties.comments?.itemChildren ?? {}) as Record<string, BloggerProperty>;
export const postLabelItemProperties: Record<string, BloggerProperty> = (singlePostProperties.labels?.itemChildren ?? {}) as Record<string, BloggerProperty>;

export function resolveDataProperty(
  path: string | readonly string[],
  context?: ResolvePropertyContext,
): BloggerProperty | undefined {
  const segments = typeof path === 'string'
    ? path.replace(/\[/g, '.').replace(/\]/g, '').split('.').filter(Boolean)
    : path.flatMap(s => s.replace(/\[/g, '.').replace(/\]/g, '').split('.').filter(Boolean));

  if (segments.length === 0) {
    return undefined;
  }

  // Handle skin.vars validation: if skinVariables is provided and accessing a specific variable, must exist
  if (segments[0] === 'skin' && segments[1] === 'vars' && segments.length >= 3 && context?.skinVariables) {
    const varName = segments[2]!;
    const skinVar = context.skinVariables[varName];
    if (!skinVar) {
      return undefined;
    }
    if (segments.length === 3) {
      if (typeof skinVar === 'string') {
        return { name: varName, type: 'string' };
      }
      return 'type' in skinVar ? (skinVar as BloggerProperty) : { name: varName, type: 'string' };
    }
    const prop: BloggerProperty = typeof skinVar === 'string'
      ? { name: varName, type: 'string' }
      : (skinVar as BloggerProperty);
    const members = getPropertyMembers(prop);
    const modName = segments[3]!;
    return members?.[modName];
  }

  const localVars = context?.variables ? (context.variables as Record<string, BloggerProperty>) : undefined;
  const skinVars = context?.skinVariables ? (context.skinVariables as Record<string, BloggerProperty>) : undefined;
  const nav = navigatePropertyPath(segments, localVars, bloggerGlobalRoot, skinVars);
  if (nav?.target) {
    return nav.target;
  }

  const effContext = buildSpecContext(context);
  const resolved = resolveDataPath(segments, effContext);
  if (!resolved) {
    return undefined;
  }
  let children: Record<string, BloggerProperty> | undefined;
  let itemChildren: Record<string, BloggerProperty> | undefined;
  if (resolved.definition?.properties) {
    children = buildPropertiesFromSpec(resolved.definition.properties, resolved.path);
  }
  if (resolved.definition?.item_properties) {
    itemChildren = buildPropertiesFromSpec(resolved.definition.item_properties, `${resolved.path}[]`);
  }
  return {
    name: resolved.name,
    type: toBloggerDataType(resolved.type),
    description: resolved.description,
    deprecated: resolved.isDeprecated,
    ...(children ? { children } : {}),
    ...(itemChildren ? { itemChildren } : {}),
  };
}

export function getDataPathSuggestions(
  path: string | readonly string[],
  context?: ResolvePropertyContext,
): readonly BloggerSuggestion[] {
  const segments = typeof path === 'string'
    ? path.replace(/\[/g, '.').replace(/\]/g, '').split('.').filter(Boolean)
    : path.flatMap(s => s.replace(/\[/g, '.').replace(/\]/g, '').split('.').filter(Boolean));

  if (segments.length === 0) {
    const suggestions: BloggerSuggestion[] = [];
    const widgetType = context?.widgetType;
    const widgetDict = widgetType && WIDGET_DATA_DICTIONARIES[widgetType] ? WIDGET_DATA_DICTIONARIES[widgetType] : undefined;
    const seen = new Set<string>();

    if (context?.variables) {
      for (const [name, propOrSymbol] of Object.entries(context.variables)) {
        seen.add(name);
        const prop: BloggerProperty = typeof propOrSymbol === 'string'
          ? { name, type: 'string' }
          : 'scopeType' in propOrSymbol
            ? { name: propOrSymbol.name, type: toBloggerDataType(propOrSymbol.type), description: (propOrSymbol as any).metadata?.description }
            : propOrSymbol;

        const isGlobal = Boolean(bloggerGlobalRoot[name]);
        const isWidget = Boolean(widgetDict && widgetDict[name]);
        if (!isGlobal && !isWidget) {
          suggestions.push({
            name: prop.name,
            type: prop.type,
            description: prop.description ?? `Template variable \`${prop.name}\`.`,
            example: `data:${prop.name}`,
            deprecated: prop.deprecated,
            kind: 'variable',
            categoryBadge: 'Local',
            sortPriority: 0,
          });
        }
        else if (isWidget) {
          suggestions.push({
            name: prop.name,
            type: prop.type,
            description: prop.description,
            example: `data:${prop.name}`,
            deprecated: prop.deprecated,
            kind: 'property',
            categoryBadge: widgetType ? `Widget: ${widgetType}` : 'Widget',
            sortPriority: 10,
          });
        }
      }
    }

    if (widgetDict) {
      for (const [name, prop] of Object.entries(widgetDict)) {
        if (!seen.has(name)) {
          seen.add(name);
          suggestions.push({
            name: prop.name,
            type: prop.type,
            description: prop.description,
            example: `data:${prop.name}`,
            deprecated: prop.deprecated,
            kind: 'property',
            categoryBadge: widgetType ? `Widget: ${widgetType}` : 'Widget',
            sortPriority: 10,
          });
        }
      }
    }

    for (const [name, prop] of Object.entries(bloggerGlobalRoot)) {
      if (!seen.has(name) || (context?.variables && !widgetDict?.[name] && name === 'widget')) {
        suggestions.push({
          name: prop.name,
          type: prop.type,
          description: prop.description,
          example: `data:${prop.name}`,
          deprecated: prop.deprecated,
          kind: 'property',
          detail: `(Blogger Global: ${prop.name})`,
          categoryBadge: 'Global',
          sortPriority: 20,
        });
      }
    }

    return suggestions;
  }

  // Direct widget ID access on data:widgets (e.g. data:widgets.Blog1, data:widgets.Header1)
  if (segments.length >= 2 && (segments[0] === 'widgets' || segments[0] === 'data:widgets')) {
    const second = segments[1]!;
    if (/\d+$/.test(second)) {
      const desc = getWidgetDescriptor(second);
      if (segments.length === 2) {
        return Object.values(desc).map(p => ({
          name: p.name,
          type: p.type,
          description: p.description,
          deprecated: p.deprecated,
          example: `data:widgets.${second}.${p.name}`,
          kind: 'property' as const,
          categoryBadge: 'Widget',
          sortPriority: 10,
        }));
      }
      const subSegments = segments.slice(2);
      let curr: BloggerProperty | undefined = desc[subSegments[0]!];
      for (let i = 1; i < subSegments.length && curr; i++) {
        const seg = subSegments[i]!;
        if (seg === 'first' || seg === 'last' || /^\d+$/.test(seg)) {
          if (curr.itemChildren) {
            curr = { name: `${curr.name}[0]`, type: 'object', children: curr.itemChildren };
          }
        }
        else if (curr.children) {
          curr = curr.children[seg];
        }
        else {
          curr = undefined;
        }
      }
      if (curr?.children) {
        return Object.values(curr.children).map(p => ({
          name: p.name,
          type: p.type,
          description: p.description,
          deprecated: p.deprecated,
          example: `data:${segments.join('.')}.${p.name}`,
          kind: 'property' as const,
          categoryBadge: 'Widget',
          sortPriority: 10,
        }));
      }
    }
  }

  // Navigate path
  const localVars = context?.variables ? (context.variables as Record<string, BloggerProperty>) : undefined;
  const skinVars = context?.skinVariables ? (context.skinVariables as Record<string, BloggerProperty>) : undefined;
  const node = navigatePropertyPath(segments, localVars, bloggerGlobalRoot, skinVars);

  if (!node?.target || !node?.children) {
    return [];
  }

  const basePath = segments.join('.');
  const isSkinVars = segments.length === 2 && segments[0] === 'skin' && segments[1] === 'vars';
  const isSkinVarChild = segments.length === 3 && segments[0] === 'skin' && segments[1] === 'vars';

  const categorized = getCategorizedPropertyMembers(node.target);
  if (categorized && categorized.length > 0) {
    return categorized.map(m => ({
      name: m.property.name,
      type: m.property.type,
      description: m.property.description,
      example: m.property.example ?? `data:${basePath}.${m.property.name}`,
      deprecated: m.property.deprecated,
      kind: isSkinVars ? ('variable' as const) : 'property',
      detail: isSkinVars
        ? `(Theme Variable: ${m.property.type})`
        : isSkinVarChild
          ? `(Theme Modifier: ${m.property.type.charAt(0).toUpperCase() + m.property.type.slice(1)})`
          : `(Blogger Data: ${m.property.type.charAt(0).toUpperCase() + m.property.type.slice(1)})`,
      categoryBadge: isSkinVars ? 'Theme' : m.categoryBadge,
      sortPriority: m.sortPriority,
    }));
  }

  const isWidgetsRoot = segments.length === 1 && segments[0] === 'widgets';

  return Object.values(node.children).map((prop) => {
    let categoryBadge = isSkinVars ? 'Theme' : 'Property';
    let sortPriority = 0;
    if (isWidgetsRoot && (prop.name === 'first' || prop.name === 'last' || prop.name === 'size' || prop.name === 'length' || prop.name === 'empty' || prop.name === 'notEmpty' || prop.name === 'any')) {
      categoryBadge = 'Array';
      sortPriority = 10;
    }

    return {
      name: prop.name,
      type: prop.type,
      description: prop.description,
      example: prop.example ?? `data:${basePath}.${prop.name}`,
      deprecated: prop.deprecated,
      kind: isSkinVars ? ('variable' as const) : 'property',
      detail: isSkinVars
        ? `(Theme Variable: ${prop.type})`
        : isSkinVarChild
          ? `(Theme Modifier: ${prop.type.charAt(0).toUpperCase() + prop.type.slice(1)})`
          : undefined,
      categoryBadge,
      sortPriority,
    };
  });
}

export function getTypeMemberSuggestions(typeName: string): readonly BloggerSuggestion[] {
  const members = getTypeMembers(typeName);
  return members.map(m => mapMemberInfoToSuggestion(m, typeName));
}

export function memberInfoToProperty(member: BloggerMemberInfo): BloggerProperty {
  return {
    name: member.name,
    type: normalizeToBloggerDataType(member.type, member.isCollection),
    description: member.description,
    deprecated: member.isDeprecated,
  };
}

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
      const isIndex = /^\d+$/.test(segment) || /^\[\d+\]$/.test(segment) || segment === '[i]' || segment === 'i' || segment === 'first' || segment === 'last';
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

export { getDataPathMembers, getTypeMembers, resolveDataPath };
