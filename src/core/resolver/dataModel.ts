import type { BloggerDataType, BloggerProperty } from '../models/types.js';
import { getSpecCatalog } from 'blogger-spec/catalogs';
import {
  buildMessagesProperties,
  buildPropertiesFromSpec,
  buildTypeMembersFromSpec,
  buildWidgetDescriptors,
  buildWidgetsDataDictionaries,
} from './specModelAdapter.js';

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
      children: itemChildren,
    },
    last: {
      name: 'last',
      type: itemType,
      description: 'The last element in the collection.',
      children: itemChildren,
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

  if (property.type === 'array') {
    const result: CategorizedMember[] = [];
    const arrayProps = createArrayProperties(property.itemChildren, 'object');
    const standardArrayKeys = new Set(Object.keys(arrayProps));

    if (property.children) {
      for (const prop of Object.values(property.children)) {
        if (!standardArrayKeys.has(prop.name)) {
          result.push({ property: prop, originCategory: 'custom', categoryBadge: 'Property', sortPriority: 0 });
        }
      }
    }

    const arrayPriority = result.length > 0 ? 10 : 0;
    for (const prop of Object.values(arrayProps)) {
      result.push({ property: prop, originCategory: 'array', categoryBadge: 'Array', sortPriority: arrayPriority });
    }

    return result;
  }

  if (property.type === 'string') {
    const result: CategorizedMember[] = [];
    for (const prop of Object.values(STRING_MEMBERS)) {
      result.push({ property: prop, originCategory: 'string', categoryBadge: 'String', sortPriority: 0 });
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

  if (property.children && Object.keys(property.children).length > 0) {
    return Object.values(property.children).map(prop => ({
      property: prop,
      originCategory: 'custom' as const,
      categoryBadge: 'Property',
      sortPriority: 0,
    }));
  }

  return undefined;
}

const { baseDescriptor, descriptorsMap } = buildWidgetDescriptors();

export const baseWidgetDescriptorProperties: Record<string, BloggerProperty> = Object.freeze(baseDescriptor);
export const blogDescriptorProperties: Record<string, BloggerProperty> = Object.freeze(descriptorsMap.Blog ?? baseDescriptor);
export const featuredPostDescriptorProperties: Record<string, BloggerProperty> = Object.freeze(descriptorsMap.FeaturedPost ?? baseDescriptor);
export const popularPostsDescriptorProperties: Record<string, BloggerProperty> = Object.freeze(descriptorsMap.PopularPosts ?? baseDescriptor);
export const WIDGET_DESCRIPTORS_MAP: Record<string, Record<string, BloggerProperty>> = Object.freeze(descriptorsMap);

export function getWidgetDescriptor(typeOrId: string): Record<string, BloggerProperty> {
  const match = typeOrId.match(/^[a-z]+/i);
  const type = match ? match[0] : typeOrId;
  return WIDGET_DESCRIPTORS_MAP[type] ?? baseWidgetDescriptorProperties;
}

export const WIDGET_DATA_DICTIONARIES: Record<string, Record<string, BloggerProperty>> = Object.freeze(
  buildWidgetsDataDictionaries(),
);

export const adSenseWidgetProperties = WIDGET_DATA_DICTIONARIES.AdSense!;
export const attributionWidgetProperties = WIDGET_DATA_DICTIONARIES.Attribution!;
export const blogWidgetProperties = WIDGET_DATA_DICTIONARIES.Blog!;
export const blogArchiveWidgetProperties = WIDGET_DATA_DICTIONARIES.BlogArchive!;
export const blogListWidgetProperties = WIDGET_DATA_DICTIONARIES.BlogList!;
export const blogSearchWidgetProperties = WIDGET_DATA_DICTIONARIES.BlogSearch!;
export const bloggerButtonWidgetProperties = WIDGET_DATA_DICTIONARIES.BloggerButton!;
export const contactFormWidgetProperties = WIDGET_DATA_DICTIONARIES.ContactForm!;
export const featuredPostWidgetProperties = WIDGET_DATA_DICTIONARIES.FeaturedPost!;
export const feedWidgetProperties = WIDGET_DATA_DICTIONARIES.Feed!;
export const followersWidgetProperties = WIDGET_DATA_DICTIONARIES.Followers!;
export const headerWidgetProperties = WIDGET_DATA_DICTIONARIES.Header!;
export const htmlWidgetProperties = WIDGET_DATA_DICTIONARIES.HTML!;
export const imageWidgetProperties = WIDGET_DATA_DICTIONARIES.Image!;
export const labelWidgetProperties = WIDGET_DATA_DICTIONARIES.Label!;
export const linkListWidgetProperties = WIDGET_DATA_DICTIONARIES.LinkList!;
export const pageListWidgetProperties = WIDGET_DATA_DICTIONARIES.PageList!;
export const popularPostsWidgetProperties = WIDGET_DATA_DICTIONARIES.PopularPosts!;
export const profileWidgetProperties = WIDGET_DATA_DICTIONARIES.Profile!;
export const reportAbuseWidgetProperties = WIDGET_DATA_DICTIONARIES.ReportAbuse!;
export const statsWidgetProperties = WIDGET_DATA_DICTIONARIES.Stats!;
export const subscribeWidgetProperties = WIDGET_DATA_DICTIONARIES.Subscribe!;
export const textWidgetProperties = WIDGET_DATA_DICTIONARIES.Text!;
export const textListWidgetProperties = WIDGET_DATA_DICTIONARIES.TextList!;
export const translateWidgetProperties = WIDGET_DATA_DICTIONARIES.Translate!;
export const wikipediaWidgetProperties = WIDGET_DATA_DICTIONARIES.Wikipedia!;

export const singlePostProperties: Record<string, BloggerProperty> = (blogWidgetProperties.posts?.itemChildren ?? {}) as Record<string, BloggerProperty>;
export const commentProperties: Record<string, BloggerProperty> = (singlePostProperties.comments?.itemChildren ?? {}) as Record<string, BloggerProperty>;
export const postLabelItemProperties: Record<string, BloggerProperty> = (singlePostProperties.labels?.itemChildren ?? {}) as Record<string, BloggerProperty>;
export const labelItemProperties: Record<string, BloggerProperty> = (labelWidgetProperties.labels?.itemChildren ?? {}) as Record<string, BloggerProperty>;
export const linkItemProperties: Record<string, BloggerProperty> = (linkListWidgetProperties.links?.itemChildren ?? {}) as Record<string, BloggerProperty>;

const catalog = getSpecCatalog();

export const blogProperties: Record<string, BloggerProperty> = buildPropertiesFromSpec(
  catalog.getGlobal('data:blog')?.canonical,
  'data.blog',
);

export const viewProperties: Record<string, BloggerProperty> = buildPropertiesFromSpec(
  catalog.getGlobal('data:view')?.canonical,
  'data.view',
);

export const skinProperties: Record<string, BloggerProperty> = buildPropertiesFromSpec(
  catalog.getGlobal('data:skin')?.canonical,
  'data.skin',
);

export const templateProperties: Record<string, BloggerProperty> = buildPropertiesFromSpec(
  catalog.getGlobal('data:template')?.canonical,
  'data.template',
);

export const widgetMetaProperties: Record<string, BloggerProperty> = buildPropertiesFromSpec(
  catalog.getGlobal('data:widget')?.canonical,
  'data.widget',
);

export const messagesProperties: Record<string, BloggerProperty> = buildMessagesProperties();

function buildWidgetsMap(): Record<string, BloggerProperty> {
  const allWidgets = catalog.getAllWidgets();
  const result: Record<string, BloggerProperty> = {};

  for (const name of Object.keys(allWidgets)) {
    const itemChildren = WIDGET_DESCRIPTORS_MAP[name] ?? baseWidgetDescriptorProperties;
    result[name] = {
      name,
      type: 'array',
      description: `Collection of visible ${name} gadget descriptors.`,
      itemChildren,
      children: createArrayProperties(itemChildren),
    };
  }

  return result;
}

export const widgetsMapProperties: Record<string, BloggerProperty> = buildWidgetsMap();

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
    description: 'Global cross-widget layout registry in Layouts v3. Exposes descriptor objects ({ id, sectionId, title, type }) for visible widgets; does NOT provide access to the full private widget data dictionaries.',
    itemChildren: baseWidgetDescriptorProperties,
    children: widgetsMapProperties,
  },
  messages: {
    name: 'messages',
    type: 'object',
    description: 'Localized UI messages dictionary.',
    children: messagesProperties,
  },
  template: {
    name: 'template',
    type: 'object',
    description: 'Template layout engine metadata and skin skin configuration.',
    children: templateProperties,
  },
  widget: {
    name: 'widget',
    type: 'object',
    description: 'Host widget contextual metadata and state.',
    children: widgetMetaProperties,
  },
};
