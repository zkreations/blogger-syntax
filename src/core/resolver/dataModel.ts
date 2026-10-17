import type { BloggerDataType, BloggerProperty } from '../models/types.js';
import { getSpecCatalog } from 'blogger-spec/catalogs';

export const STRING_MEMBERS: Record<string, BloggerProperty> = Object.freeze({
  escaped: {
    name: 'escaped',
    type: 'string',
    description: 'HTML-escaped string representation.',
    docUrl: 'https://bloggercode.orbiona.com/2016/04/data-parameters-escaped.html',
  },
  jsEscaped: {
    name: 'jsEscaped',
    type: 'string',
    description: 'JavaScript string-escaped representation.',
    docUrl: 'https://bloggercode.orbiona.com/2016/04/data-parameters-escaped.html',
  },
  jsonEscaped: {
    name: 'jsonEscaped',
    type: 'string',
    description: 'JSON-escaped representation.',
    docUrl: 'https://bloggercode.orbiona.com/2016/04/data-parameters-escaped.html',
  },
  cssEscaped: {
    name: 'cssEscaped',
    type: 'string',
    description: 'CSS-escaped representation.',
    docUrl: 'https://bloggercode.orbiona.com/2016/04/data-parameters-escaped.html',
  },
  length: {
    name: 'length',
    type: 'number',
    description: 'The number of characters in the string.',
  },
  size: {
    name: 'size',
    type: 'number',
    description: 'The number of characters in the string (alias of length).',
  },
});

export const IMAGE_MEMBERS: Record<string, BloggerProperty> = Object.freeze({
  width: {
    name: 'width',
    type: 'number',
    description: 'Width of the image in pixels.',
    docUrl: 'https://bloggercode.orbiona.com/2018/02/data-parameters-width-height.html',
  },
  height: {
    name: 'height',
    type: 'number',
    description: 'Height of the image in pixels.',
    docUrl: 'https://bloggercode.orbiona.com/2018/02/data-parameters-width-height.html',
  },
  originalWidth: {
    name: 'originalWidth',
    type: 'number',
    description: 'Original width of the source image in pixels.',
    docUrl: 'https://bloggercode.orbiona.com/2018/02/data-parameters-width-height.html',
  },
  originalHeight: {
    name: 'originalHeight',
    type: 'number',
    description: 'Original height of the source image in pixels.',
    docUrl: 'https://bloggercode.orbiona.com/2018/02/data-parameters-width-height.html',
  },
  isResizable: {
    name: 'isResizable',
    type: 'boolean',
    description: 'Indicates whether the image is resizable via Blogger image service.',
    docUrl: 'https://bloggercode.orbiona.com/2016/04/data-parameters-isResizable.html',
  },
  isYouTube: {
    name: 'isYouTube',
    type: 'boolean',
    description: 'Indicates whether the image is a YouTube video thumbnail.',
    docUrl: 'https://bloggercode.orbiona.com/2018/02/data-parameters-isYouTube-youtubeMaxResDefaultUrl.html',
  },
  youtubeMaxResDefaultUrl: {
    name: 'youtubeMaxResDefaultUrl',
    type: 'image',
    description: 'High-resolution YouTube thumbnail image URL.',
    docUrl: 'https://bloggercode.orbiona.com/2018/02/data-parameters-isYouTube-youtubeMaxResDefaultUrl.html',
  },
});

export const LOCALE_MEMBERS: Record<string, BloggerProperty> = Object.freeze({
  name: {
    name: 'name',
    type: 'string',
    description: 'Full locale name representation (e.g. es_419, en_US).',
    docUrl: 'https://bloggercode.orbiona.com/2018/02/data-parameters-locale-name-lang-country-variant-script.html',
  },
  language: {
    name: 'language',
    type: 'string',
    description: 'Two-letter language code of the locale.',
    docUrl: 'https://bloggercode.orbiona.com/2018/02/data-parameters-locale-name-lang-country-variant-script.html',
  },
  country: {
    name: 'country',
    type: 'string',
    description: 'Two-letter country code of the locale.',
    docUrl: 'https://bloggercode.orbiona.com/2018/02/data-parameters-locale-name-lang-country-variant-script.html',
  },
  variant: {
    name: 'variant',
    type: 'string',
    description: 'Language/locale variant if specified.',
    docUrl: 'https://bloggercode.orbiona.com/2018/02/data-parameters-locale-name-lang-country-variant-script.html',
  },
  script: {
    name: 'script',
    type: 'string',
    description: 'Four-letter script code of the locale (e.g. Latn, Cyrl, Hant).',
    docUrl: 'https://bloggercode.orbiona.com/2018/02/data-parameters-locale-name-lang-country-variant-script.html',
  },
  languageDirection: {
    name: 'languageDirection',
    type: 'string',
    description: 'Text reading direction for locale (\'ltr\' or \'rtl\').',
    docUrl: 'https://bloggercode.orbiona.com/2018/02/data-parameters-locale-direction-alignment.html',
  },
  languageAlignment: {
    name: 'languageAlignment',
    type: 'string',
    description: 'Text alignment based on language (\'left\' or \'right\').',
    docUrl: 'https://bloggercode.orbiona.com/2018/02/data-parameters-locale-direction-alignment.html',
  },
});

export const DATE_MEMBERS: Record<string, BloggerProperty> = Object.freeze({
  year: {
    name: 'year',
    type: 'number',
    description: 'Four-digit year number.',
    docUrl: 'https://bloggercode.orbiona.com/2018/02/data-parameters-day-month-year.html',
  },
  month: {
    name: 'month',
    type: 'number',
    description: 'Month number (1-12).',
    docUrl: 'https://bloggercode.orbiona.com/2018/02/data-parameters-day-month-year.html',
  },
  day: {
    name: 'day',
    type: 'number',
    description: 'Day of the month number (1-31).',
    docUrl: 'https://bloggercode.orbiona.com/2018/02/data-parameters-day-month-year.html',
  },
  dayOfWeek: {
    name: 'dayOfWeek',
    type: 'number',
    description: 'Day of the week number (1-7).',
    docUrl: 'https://bloggercode.orbiona.com/2018/02/data-parameters-day-month-year.html',
  },
  dayOfMonth: {
    name: 'dayOfMonth',
    type: 'number',
    description: 'Day of the month number (1-31).',
    docUrl: 'https://bloggercode.orbiona.com/2018/02/data-parameters-day-month-year.html',
  },
  dayOfYear: {
    name: 'dayOfYear',
    type: 'number',
    description: 'Day of the year number (1-366).',
    docUrl: 'https://bloggercode.orbiona.com/2018/02/data-parameters-day-month-year.html',
  },
  iso8601: {
    name: 'iso8601',
    type: 'string',
    description: 'ISO 8601 formatted date string.',
    docUrl: 'https://bloggercode.orbiona.com/2018/02/data-parameters-iso8601.html',
  },
});

export const URL_MEMBERS: Record<string, BloggerProperty> = Object.freeze({
  canonical: {
    name: 'canonical',
    type: 'url',
    description: 'Canonical version of the URL.',
    docUrl: 'https://bloggercode.orbiona.com/2016/04/data-parameters-canonical.html',
  },
  https: {
    name: 'https',
    type: 'url',
    description: 'HTTPS version of the URL.',
    docUrl: 'https://bloggercode.orbiona.com/2016/04/data-parameters-http-protocole.html',
  },
  http: {
    name: 'http',
    type: 'url',
    description: 'HTTP version of the URL.',
    docUrl: 'https://bloggercode.orbiona.com/2016/04/data-parameters-http-protocole.html',
  },
});

export function createArrayProperties(
  itemChildren?: Record<string, BloggerProperty>,
  itemType: BloggerDataType = 'object',
): Record<string, BloggerProperty> {
  return {
    size: {
      name: 'size',
      type: 'number',
      description: 'The number of elements in the collection.',
      docUrl: 'https://bloggercode.orbiona.com/2018/02/data-parameters-length-size-array.html',
    },
    length: {
      name: 'length',
      type: 'number',
      description: 'The number of elements in the collection (alias of size).',
      docUrl: 'https://bloggercode.orbiona.com/2018/02/data-parameters-length-size-array.html',
    },
    empty: {
      name: 'empty',
      type: 'boolean',
      description: 'Indicates whether the collection is empty.',
      docUrl: 'https://bloggercode.orbiona.com/2018/02/data-parameters-empty.html',
    },
    notEmpty: {
      name: 'notEmpty',
      type: 'boolean',
      description: 'Indicates whether the collection contains at least one element.',
      docUrl: 'https://bloggercode.orbiona.com/2018/02/data-parameters-empty.html',
    },
    any: {
      name: 'any',
      type: 'boolean',
      description: 'Indicates whether the collection contains any elements.',
      docUrl: 'https://bloggercode.orbiona.com/2018/02/data-parameters-empty.html',
    },
    first: {
      name: 'first',
      type: itemType,
      description: 'The first element in the collection.',
      docUrl: 'https://bloggercode.orbiona.com/2018/02/data-parameters-first-last.html',
      children: itemChildren,
    },
    last: {
      name: 'last',
      type: itemType,
      description: 'The last element in the collection.',
      docUrl: 'https://bloggercode.orbiona.com/2018/02/data-parameters-first-last.html',
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

export const baseWidgetDescriptorProperties: Record<string, BloggerProperty> = Object.freeze({
  id: {
    name: 'id',
    type: 'string',
    description: 'Unique widget instance ID (e.g. "Blog1", "Header1").',
    docUrl: 'https://bloggercode.orbiona.com/1978/02/data-widgets-id.html',
  },
  sectionId: {
    name: 'sectionId',
    type: 'string',
    description: 'Parent <b:section> identifier containing the widget.',
    docUrl: 'https://bloggercode.orbiona.com/1978/02/data-widgets-sectionId.html',
  },
  title: {
    name: 'title',
    type: 'string',
    description: 'Configured widget header title.',
    docUrl: 'https://bloggercode.orbiona.com/1978/02/data-widgets-title.html',
  },
  type: {
    name: 'type',
    type: 'string',
    description: 'Canonical widget type name (e.g. "Blog", "AdSense").',
    docUrl: 'https://bloggercode.orbiona.com/1978/02/data-widgets-type.html',
  },
});

export const blogDescriptorPostSummaryProperties: Record<string, BloggerProperty> = Object.freeze({
  id: {
    name: 'id',
    type: 'number',
    description: 'Unique numerical post identifier.',
    docUrl: 'https://bloggercode.orbiona.com/1978/02/data-widgets-posts-id.html',
  },
  title: {
    name: 'title',
    type: 'string',
    description: 'Post title string.',
    docUrl: 'https://bloggercode.orbiona.com/1978/02/data-widgets-posts-title.html',
  },
  featuredImage: {
    name: 'featuredImage',
    type: 'image',
    description: 'Primary post hero image URL.',
    docUrl: 'https://bloggercode.orbiona.com/1978/02/data-widgets-posts-featuredImage.html',
  },
  showInlineAds: {
    name: 'showInlineAds',
    type: 'boolean',
    description: 'Inline ads display toggle.',
    docUrl: 'https://bloggercode.orbiona.com/1978/02/data-widgets-posts-showInlineAds.html',
  },
});

export const blogDescriptorBylineItemProperties: Record<string, BloggerProperty> = Object.freeze({
  name: {
    name: 'name',
    type: 'string',
    description: 'Byline item identifier (e.g. "author", "timestamp").',
  },
  label: {
    name: 'label',
    type: 'string',
    description: 'Localized byline label prefix.',
  },
});

export const blogDescriptorRegionProperties: Record<string, BloggerProperty> = Object.freeze({
  regionName: {
    name: 'regionName',
    type: 'string',
    description: 'Name of the byline region (e.g. "header-byline", "footer1").',
  },
  items: {
    name: 'items',
    type: 'array',
    description: 'Byline item objects in region.',
    itemChildren: blogDescriptorBylineItemProperties,
    children: createArrayProperties(blogDescriptorBylineItemProperties),
  },
});

export const blogDescriptorProperties: Record<string, BloggerProperty> = Object.freeze({
  ...baseWidgetDescriptorProperties,
  posts: {
    name: 'posts',
    type: 'array',
    description: 'Summaries of blog posts rendered in the main blog gadget.',
    docUrl: 'https://bloggercode.orbiona.com/1978/02/data-widgets-posts.html',
    itemChildren: blogDescriptorPostSummaryProperties,
    children: createArrayProperties(blogDescriptorPostSummaryProperties),
  },
  headerByline: {
    name: 'headerByline',
    type: 'object',
    description: 'Header byline region descriptor.',
    children: blogDescriptorRegionProperties,
  },
  footerBylines: {
    name: 'footerBylines',
    type: 'array',
    description: 'Array of footer byline regions and item lists.',
    itemChildren: blogDescriptorRegionProperties,
    children: createArrayProperties(blogDescriptorRegionProperties),
  },
  allBylineItems: {
    name: 'allBylineItems',
    type: 'array',
    description: 'Flat list of active byline items.',
    itemChildren: blogDescriptorBylineItemProperties,
    children: createArrayProperties(blogDescriptorBylineItemProperties),
  },
});

export const featuredPostDescriptorProperties: Record<string, BloggerProperty> = Object.freeze({
  ...baseWidgetDescriptorProperties,
  postId: {
    name: 'postId',
    type: 'number',
    description: 'Numerical identifier of the featured post.',
    docUrl: 'https://bloggercode.orbiona.com/1978/02/data-widgets-postId.html',
  },
});

export const popularPostsSummaryProperties: Record<string, BloggerProperty> = Object.freeze({
  id: {
    name: 'id',
    type: 'number',
    description: 'Unique numerical post identifier.',
    docUrl: 'https://bloggercode.orbiona.com/1978/02/data-widgets-posts-id.html',
  },
  title: {
    name: 'title',
    type: 'string',
    description: 'Post title string.',
    docUrl: 'https://bloggercode.orbiona.com/1978/02/data-widgets-posts-title.html',
  },
});

export const popularPostsDescriptorProperties: Record<string, BloggerProperty> = Object.freeze({
  ...baseWidgetDescriptorProperties,
  posts: {
    name: 'posts',
    type: 'array',
    description: 'Summaries of popular posts in the gadget.',
    docUrl: 'https://bloggercode.orbiona.com/1978/02/data-widgets-posts.html',
    itemChildren: popularPostsSummaryProperties,
    children: createArrayProperties(popularPostsSummaryProperties),
  },
});

export const WIDGET_DESCRIPTORS_MAP: Record<string, Record<string, BloggerProperty>> = Object.freeze({
  AdSense: baseWidgetDescriptorProperties,
  Attribution: baseWidgetDescriptorProperties,
  Blog: blogDescriptorProperties,
  BlogArchive: baseWidgetDescriptorProperties,
  BloggerButton: baseWidgetDescriptorProperties,
  BlogList: baseWidgetDescriptorProperties,
  BlogSearch: baseWidgetDescriptorProperties,
  ContactForm: baseWidgetDescriptorProperties,
  FeaturedPost: featuredPostDescriptorProperties,
  Feed: baseWidgetDescriptorProperties,
  Followers: baseWidgetDescriptorProperties,
  Header: baseWidgetDescriptorProperties,
  HTML: baseWidgetDescriptorProperties,
  Image: baseWidgetDescriptorProperties,
  Label: baseWidgetDescriptorProperties,
  LinkList: baseWidgetDescriptorProperties,
  PageList: baseWidgetDescriptorProperties,
  PopularPosts: popularPostsDescriptorProperties,
  Profile: baseWidgetDescriptorProperties,
  ReportAbuse: baseWidgetDescriptorProperties,
  Stats: baseWidgetDescriptorProperties,
  Subscribe: baseWidgetDescriptorProperties,
  Text: baseWidgetDescriptorProperties,
  TextList: baseWidgetDescriptorProperties,
  Translate: baseWidgetDescriptorProperties,
  Wikipedia: baseWidgetDescriptorProperties,
});

export function getWidgetDescriptor(typeOrId: string): Record<string, BloggerProperty> {
  if (WIDGET_DESCRIPTORS_MAP[typeOrId]) {
    return WIDGET_DESCRIPTORS_MAP[typeOrId];
  }
  const typeWithoutIndex = typeOrId.replace(/\d+$/, '');
  if (WIDGET_DESCRIPTORS_MAP[typeWithoutIndex]) {
    return WIDGET_DESCRIPTORS_MAP[typeWithoutIndex];
  }
  return baseWidgetDescriptorProperties;
}

export const postAuthorPhotoProperties: Record<string, BloggerProperty> = {
  image: {
    name: 'image',
    type: 'image',
    description: 'Image resource associated with the author\'s profile photo.',
    docUrl: 'https://bloggercode.orbiona.com/1971/03/data-posts-author-authorPhoto-image.html',
  },
  width: {
    name: 'width',
    type: 'number',
    description: 'Width of the author\'s profile image.',
    docUrl: 'https://bloggercode.orbiona.com/1971/03/data-posts-author-authorPhoto-width.html',
  },
  height: {
    name: 'height',
    type: 'number',
    description: 'Height of the author\'s profile image.',
    docUrl: 'https://bloggercode.orbiona.com/2021/10/posts-author-authorPhoto-height.html',
  },
  alt: {
    name: 'alt',
    type: 'string',
    description: 'Alternative text associated with the author\'s profile image.',
    docUrl: 'https://bloggercode.orbiona.com/2021/10/posts-author-authorPhoto-alt.html',
  },
};

export const postAuthorProperties: Record<string, BloggerProperty> = {
  name: {
    name: 'name',
    type: 'string',
    description: 'Display name of the post author.',
    docUrl: 'https://bloggercode.orbiona.com/1971/03/data-posts-author-name.html',
  },
  profileUrl: {
    name: 'profileUrl',
    type: 'string',
    description: 'URL of the author\'s profile.',
    docUrl: 'https://bloggercode.orbiona.com/1971/03/data-posts-author-profileUrl.html',
  },
  authorPhoto: {
    name: 'authorPhoto',
    type: 'object',
    description: 'Author profile image object associated with the post.',
    docUrl: 'https://bloggercode.orbiona.com/1971/03/data-posts-author-authorPhoto.html',
    children: postAuthorPhotoProperties,
  },
  aboutMe: {
    name: 'aboutMe',
    type: 'string',
    description: 'Author bio / about me text.',
  },
};

export const postSnippetProperties: Record<string, BloggerProperty> = {
  short: {
    name: 'short',
    type: 'string',
    description: 'Short excerpt generated from the post content.',
    docUrl: 'https://bloggercode.orbiona.com/2021/10/posts-snippets-short.html',
  },
  long: {
    name: 'long',
    type: 'string',
    description: 'Long excerpt generated from the post content.',
    docUrl: 'https://bloggercode.orbiona.com/1970/07/data-posts-snippets-long.html',
  },
};

export const postLocationProperties: Record<string, BloggerProperty> = {
  mapsUrl: {
    name: 'mapsUrl',
    type: 'string',
    description: 'Google Maps URL for the location associated with the post.',
    docUrl: 'https://bloggercode.orbiona.com/1973/06/Blog-data-posts-location-mapsUrl.html',
  },
  name: {
    name: 'name',
    type: 'string',
    description: 'Name of the location associated with the post.',
    docUrl: 'https://bloggercode.orbiona.com/1973/06/Blog-data-posts-location-name.html',
  },
};

export const commentAuthorPhotoProperties: Record<string, BloggerProperty> = {
  height: {
    name: 'height',
    type: 'number',
    description: 'Pixel height of commenter avatar.',
  },
  thumbHeight: {
    name: 'thumbHeight',
    type: 'number',
    description: 'Pixel height of thumbnail avatar.',
  },
  thumbUrl: {
    name: 'thumbUrl',
    type: 'string',
    description: 'Thumbnail avatar image URL.',
  },
  thumbWidth: {
    name: 'thumbWidth',
    type: 'number',
    description: 'Pixel width of thumbnail avatar.',
  },
  url: {
    name: 'url',
    type: 'string',
    description: 'Full-size avatar image URL.',
  },
  width: {
    name: 'width',
    type: 'number',
    description: 'Pixel width of commenter avatar.',
  },
};

export const commentProperties: Record<string, BloggerProperty> = {
  id: {
    name: 'id',
    type: 'string',
    description: 'Unique comment identifier string.',
  },
  anchorName: {
    name: 'anchorName',
    type: 'string',
    description: 'DOM anchor identifier string (e.g. \'c123456789\').',
  },
  author: {
    name: 'author',
    type: 'string',
    description: 'Display name of comment author.',
  },
  authorAvatarImage: {
    name: 'authorAvatarImage',
    type: 'string',
    description: 'Pre-formatted HTML img markup of commenter avatar.',
  },
  authorAvatarSrc: {
    name: 'authorAvatarSrc',
    type: 'image',
    description: 'Avatar profile image source URL for the comment author.',
  },
  authorPhoto: {
    name: 'authorPhoto',
    type: 'object',
    description: 'Avatar photo dimension model (url, width, height).',
    children: commentAuthorPhotoProperties,
  },
  authorUrl: {
    name: 'authorUrl',
    type: 'url',
    description: 'Web address or profile URL of the comment author.',
  },
  authorUserType: {
    name: 'authorUserType',
    type: 'string',
    description: 'Classification type string (\'BLOGGER\', \'ANONYMOUS\', \'OPENID\').',
  },
  body: {
    name: 'body',
    type: 'string',
    description: 'HTML content body of the comment.',
  },
  cmtBodyIdPostfix: {
    name: 'cmtBodyIdPostfix',
    type: 'string',
    description: 'DOM ID postfix integer for comment body container.',
  },
  extraIconClass: {
    name: 'extraIconClass',
    type: 'string',
    description: 'CSS icon badge class string for registered author comments.',
  },
  timestamp: {
    name: 'timestamp',
    type: 'string',
    description: 'Formatted submission timestamp string.',
  },
  timestampAbs: {
    name: 'timestampAbs',
    type: 'number',
    description: 'Absolute timestamp integer value.',
  },
  timestampValue: {
    name: 'timestampValue',
    type: 'number',
    description: 'Unix epoch timestamp in milliseconds.',
  },
  date: {
    name: 'date',
    type: 'date',
    description: 'Native date object for the comment submission time.',
  },
  isDeleted: {
    name: 'isDeleted',
    type: 'boolean',
    description: 'True if the comment was marked as deleted.',
  },
  inReplyTo: {
    name: 'inReplyTo',
    type: 'string',
    description: 'Identifier of parent comment this comment replies to.',
  },
  deleteUrl: {
    name: 'deleteUrl',
    type: 'url',
    description: 'Administrative action URL to delete the comment.',
  },
  adminClass: {
    name: 'adminClass',
    type: 'string',
    description: 'CSS class applied to admin author comments.',
  },
  url: {
    name: 'url',
    type: 'string',
    description: 'Direct permalink anchor URL to comment.',
  },
};

export const postLabelItemProperties: Record<string, BloggerProperty> = {
  name: {
    name: 'name',
    type: 'string',
    description: 'Tag label name text.',
    docUrl: 'https://bloggercode.orbiona.com/1970/09/data-posts-labels.html',
  },
  url: {
    name: 'url',
    type: 'url',
    description: 'Category archive URL for this label.',
    docUrl: 'https://bloggercode.orbiona.com/1970/09/data-posts-labels.html',
  },
};

export const labelItemProperties: Record<string, BloggerProperty> = {
  name: {
    name: 'name',
    type: 'string',
    description: 'Display name of the label category.',
  },
  count: {
    name: 'count',
    type: 'number',
    description: 'Total published posts assigned to this label.',
  },
  url: {
    name: 'url',
    type: 'url',
    description: 'Target search URL for posts tagged with this label.',
  },
  cssSize: {
    name: 'cssSize',
    type: 'number',
    description: 'Relative frequency rank/weight (1-5) used for font scaling in cloud mode.',
  },
};

export const linkItemProperties: Record<string, BloggerProperty> = {
  name: {
    name: 'name',
    type: 'string',
    description: 'Anchor label or link text.',
  },
  target: {
    name: 'target',
    type: 'url',
    description: 'Destination hyperlink URL.',
  },
};

export const pageLinkItemProperties: Record<string, BloggerProperty> = {
  id: {
    name: 'id',
    type: 'string',
    description: 'Unique page identifier (numeric ID string or \'c0\' for Home).',
  },
  title: {
    name: 'title',
    type: 'string',
    description: 'Visible navigation label or page title.',
  },
  href: {
    name: 'href',
    type: 'url',
    description: 'Destination page or external link URL.',
  },
  isCurrentPage: {
    name: 'isCurrentPage',
    type: 'boolean',
    description: 'True if the link matches the current view URL request.',
  },
};

export const enclosureItemProperties: Record<string, BloggerProperty> = {
  mimeType: {
    name: 'mimeType',
    type: 'string',
    description: 'MIME type string of enclosure asset.',
  },
  url: {
    name: 'url',
    type: 'string',
    description: 'Direct link URL to media enclosure.',
  },
};

export const feedLinkItemProperties: Record<string, BloggerProperty> = {
  feedType: {
    name: 'feedType',
    type: 'string',
    description: 'Feed protocol standard (\'atom\' or \'rss\').',
  },
  mimeType: {
    name: 'mimeType',
    type: 'string',
    description: 'MIME type string (\'application/atom+xml\' or \'application/rss+xml\').',
  },
  name: {
    name: 'name',
    type: 'string',
    description: 'Localized feed title or descriptor.',
  },
  url: {
    name: 'url',
    type: 'url',
    description: 'Public URL for syndicated feed.',
  },
};

export const singlePostProperties: Record<string, BloggerProperty> = {
  id: {
    name: 'id',
    type: 'string',
    description: 'Unique post ID.',
  },
  title: {
    name: 'title',
    type: 'string',
    description: 'Post title.',
  },
  body: {
    name: 'body',
    type: 'string',
    description: 'HTML content body of the post.',
  },
  snippets: {
    name: 'snippets',
    type: 'object',
    description: 'Object containing the available post excerpts.',
    docUrl: 'https://bloggercode.orbiona.com/1970/07/data-posts-snippets.html',
    children: postSnippetProperties,
  },
  url: {
    name: 'url',
    type: 'url',
    description: 'Permanent canonical URL of the post.',
  },
  absoluteUrl: {
    name: 'absoluteUrl',
    type: 'url',
    description: 'Absolute URL of the post.',
    docUrl: 'https://bloggercode.orbiona.com/2021/10/posts-absoluteUrl.html',
  },
  link: {
    name: 'link',
    type: 'string',
    description: 'Post URL or external link URL.',
  },
  thumbnailUrl: {
    name: 'thumbnailUrl',
    type: 'string',
    description: 'URL of post thumbnail.',
  },
  featuredImage: {
    name: 'featuredImage',
    type: 'image',
    description: 'Featured image URL for the post.',
  },
  date: {
    name: 'date',
    type: 'date',
    description: 'Post publication date.',
  },
  lastUpdated: {
    name: 'lastUpdated',
    type: 'date',
    description: 'Date and time when the post was last updated.',
    docUrl: 'https://bloggercode.orbiona.com/1971/05/data-posts-lastUpdated.html',
  },
  author: {
    name: 'author',
    type: 'object',
    description: 'Author information associated with the post.',
    docUrl: 'https://bloggercode.orbiona.com/1971/03/data-posts-author.html',
    children: postAuthorProperties,
  },
  hasJumpLink: {
    name: 'hasJumpLink',
    type: 'boolean',
    description: 'Indicates whether the post has a jump link to the full content.',
    docUrl: 'https://bloggercode.orbiona.com/1971/06/data-posts-hasJumpLink.html',
  },
  isFirstPost: {
    name: 'isFirstPost',
    type: 'boolean',
    description: 'Indicates whether the post is the first post in the current collection or context.',
    docUrl: 'https://bloggercode.orbiona.com/1973/08/Blog-data-posts-isFirstPost.html',
  },
  isDateStart: {
    name: 'isDateStart',
    type: 'boolean',
    description: 'Indicates whether the post begins a new date grouping.',
    docUrl: 'https://bloggercode.orbiona.com/1973/08/Blog-data-posts-isDateStart.html',
  },
  postAuthorClass: {
    name: 'postAuthorClass',
    type: 'string',
    description: 'CSS class for post author styling.',
  },
  adminClass: {
    name: 'adminClass',
    type: 'string',
    description: 'CSS class used to identify an administrative post state.',
    docUrl: 'https://bloggercode.orbiona.com/2021/10/posts-adminClass.html',
  },
  commentSource: {
    name: 'commentSource',
    type: 'number',
    description: 'Comment system source type identifier.',
  },
  commentConfig: {
    name: 'commentConfig',
    type: 'string',
    description: 'JSON configuration for comments.',
  },
  commentJso: {
    name: 'commentJso',
    type: 'string',
    description: 'Comment JavaScript object string.',
  },
  commentMsgs: {
    name: 'commentMsgs',
    type: 'string',
    description: 'Comment localized messages string.',
  },
  commentSrc: {
    name: 'commentSrc',
    type: 'string',
    description: 'URL source for comment iframe.',
  },
  allowComments: {
    name: 'allowComments',
    type: 'boolean',
    description: 'True if comments are allowed on this post.',
  },
  allowNewComments: {
    name: 'allowNewComments',
    type: 'boolean',
    description: 'Indicates whether new comments are allowed on the post.',
    docUrl: 'https://bloggercode.orbiona.com/1973/08/Blog-data-posts-allowNewComments.html',
  },
  noNewCommentsText: {
    name: 'noNewCommentsText',
    type: 'string',
    description: 'Message displayed when new comments are closed.',
  },
  numberOfComments: {
    name: 'numberOfComments',
    type: 'number',
    description: 'Total number of comments associated with the post.',
    docUrl: 'https://bloggercode.orbiona.com/1971/05/data-posts-numberOfComments.html',
  },
  commentsUrl: {
    name: 'commentsUrl',
    type: 'url',
    description: 'URL for the comments associated with the post.',
    docUrl: 'https://bloggercode.orbiona.com/1971/07/data-posts-commentsUrl.html',
  },
  commentsUrlOnclick: {
    name: 'commentsUrlOnclick',
    type: 'string',
    description: 'JavaScript click handler for comment popup.',
  },
  commentPagingRequired: {
    name: 'commentPagingRequired',
    type: 'boolean',
    description: 'Indicates whether comment pagination is required.',
    docUrl: 'https://bloggercode.orbiona.com/1973/08/Blog-data-posts-commentPagingRequired.html',
  },
  hasOlderLinks: {
    name: 'hasOlderLinks',
    type: 'boolean',
    description: 'Indicates whether older posts are available for navigation.',
    docUrl: 'https://bloggercode.orbiona.com/2021/10/posts-hasOlderLinks.html',
  },
  oldLinkClass: {
    name: 'oldLinkClass',
    type: 'string',
    description: 'CSS class for older posts link.',
  },
  oldestLinkUrl: {
    name: 'oldestLinkUrl',
    type: 'url',
    description: 'URL for navigating to the oldest posts.',
    docUrl: 'https://bloggercode.orbiona.com/2021/10/posts-oldestLinkUrl.html',
  },
  olderLinkUrl: {
    name: 'olderLinkUrl',
    type: 'url',
    description: 'URL for navigating to older posts.',
    docUrl: 'https://bloggercode.orbiona.com/2021/10/posts-olderLinkUrl.html',
  },
  hasNewerLinks: {
    name: 'hasNewerLinks',
    type: 'boolean',
    description: 'Indicates whether newer posts are available for navigation.',
    docUrl: 'https://bloggercode.orbiona.com/1973/08/Blog-data-posts-hasNewerLinks.html',
  },
  newLinkClass: {
    name: 'newLinkClass',
    type: 'string',
    description: 'CSS class for newer posts link.',
  },
  newerLinkUrl: {
    name: 'newerLinkUrl',
    type: 'url',
    description: 'URL for navigating to newer posts.',
    docUrl: 'https://bloggercode.orbiona.com/1973/08/Blog-data-posts-newerLinkUrl.html',
  },
  newestLinkUrl: {
    name: 'newestLinkUrl',
    type: 'url',
    description: 'URL for navigating to the newest posts.',
    docUrl: 'https://bloggercode.orbiona.com/2021/10/posts-newestLinkUrl.html',
  },
  commentRangeText: {
    name: 'commentRangeText',
    type: 'string',
    description: 'Text describing the range of comments currently visible.',
  },
  commentFormIframeSrc: {
    name: 'commentFormIframeSrc',
    type: 'string',
    description: 'URL for comment submission iframe form.',
  },
  embedCommentForm: {
    name: 'embedCommentForm',
    type: 'boolean',
    description: 'Indicates whether the comment form should be embedded with the post.',
    docUrl: 'https://bloggercode.orbiona.com/1973/08/Blog-data-posts-embedCommentForm.html',
  },
  showThreadedComments: {
    name: 'showThreadedComments',
    type: 'boolean',
    description: 'Indicates whether threaded comments should be displayed.',
    docUrl: 'https://bloggercode.orbiona.com/1973/08/Blog-data-posts-showThreadedComments.html',
  },
  commentHtml: {
    name: 'commentHtml',
    type: 'string',
    description: 'Raw HTML of comments.',
  },
  avatarIndentClass: {
    name: 'avatarIndentClass',
    type: 'string',
    description: 'CSS class used to control comment avatar indentation.',
    docUrl: 'https://bloggercode.orbiona.com/1973/07/Blog-data-posts-avatarIndentClass.html',
  },
  includeAd: {
    name: 'includeAd',
    type: 'boolean',
    description: 'Indicates whether an advertisement should be included with the post.',
    docUrl: 'https://bloggercode.orbiona.com/1973/08/Blog-data-posts-includeAd.html',
  },
  adNumber: {
    name: 'adNumber',
    type: 'number',
    description: 'Sequential inline ad index number.',
  },
  emailPostUrl: {
    name: 'emailPostUrl',
    type: 'string',
    description: 'URL for the email-this-post feature.',
  },
  shareUrl: {
    name: 'shareUrl',
    type: 'string',
    description: 'URL used to share the post.',
    docUrl: 'https://bloggercode.orbiona.com/1971/04/data-posts-shareUrl.html',
  },
  cmtfpIframe: {
    name: 'cmtfpIframe',
    type: 'string',
    description: 'Comment popup iframe URL.',
  },
  appRpcRelayPath: {
    name: 'appRpcRelayPath',
    type: 'string',
    description: 'RPC relay path for comment authentication.',
  },
  location: {
    name: 'location',
    type: 'object',
    description: 'Post geotagged location.',
    children: postLocationProperties,
  },
  labels: {
    name: 'labels',
    type: 'array',
    description: 'Collection of labels assigned to the post.',
    docUrl: 'https://bloggercode.orbiona.com/1970/09/data-posts-labels.html',
    itemChildren: postLabelItemProperties,
    children: createArrayProperties(postLabelItemProperties),
  },
  feedLinks: {
    name: 'feedLinks',
    type: 'array',
    description: 'Collection of feed links associated with the post.',
    docUrl: 'https://bloggercode.orbiona.com/2021/10/posts-feedLinks.html',
    itemChildren: feedLinkItemProperties,
    children: createArrayProperties(feedLinkItemProperties),
  },
  comments: {
    name: 'comments',
    type: 'array',
    description: 'Collection of comments associated with the post.',
    docUrl: 'https://bloggercode.orbiona.com/1973/03/Blog-data-posts-comments.html',
    itemChildren: commentProperties,
    children: createArrayProperties(commentProperties),
  },
  enclosures: {
    name: 'enclosures',
    type: 'array',
    description: 'Collection of media enclosures associated with the post.',
    docUrl: 'https://bloggercode.orbiona.com/1973/01/Blog-data-posts-enclosures.html',
    itemChildren: enclosureItemProperties,
    children: createArrayProperties(enclosureItemProperties),
  },
};

export const blogWidgetProperties: Record<string, BloggerProperty> = {
  title: {
    name: 'title',
    type: 'string',
    description: 'Blog widget title.',
  },
  description: {
    name: 'description',
    type: 'string',
    description: 'Blog widget description.',
  },
  numPosts: {
    name: 'numPosts',
    type: 'number',
    description: 'Number of posts configured to display per page.',
  },
  olderPageUrl: {
    name: 'olderPageUrl',
    type: 'url',
    description: 'URL to older posts page.',
  },
  newerPageUrl: {
    name: 'newerPageUrl',
    type: 'url',
    description: 'URL to newer posts page.',
  },
  navMessage: {
    name: 'navMessage',
    type: 'string',
    description: 'Navigation status message.',
  },
  adCode: {
    name: 'adCode',
    type: 'string',
    description: 'AdSense script code.',
  },
  adClientId: {
    name: 'adClientId',
    type: 'string',
    description: 'AdSense client ID.',
  },
  cmtIframeInitialHeight: {
    name: 'cmtIframeInitialHeight',
    type: 'string',
    description: 'Initial height in px for comment iframe.',
  },
  showCmtPopup: {
    name: 'showCmtPopup',
    type: 'boolean',
    description: 'Whether comments open in a popup window.',
  },
  backgroundColor: {
    name: 'backgroundColor',
    type: 'string',
    description: 'Configured background color hex.',
  },
  linkColor: {
    name: 'linkColor',
    type: 'string',
    description: 'Configured link color hex.',
  },
  textColor: {
    name: 'textColor',
    type: 'string',
    description: 'Configured text color hex.',
  },
  languageCode: {
    name: 'languageCode',
    type: 'string',
    description: 'Language code configured for blog widget.',
  },
  messages: {
    name: 'messages',
    type: 'object',
    description: 'Blog widget localized messages.',
    children: {
      blogComment: {
        name: 'blogComment',
        type: 'string',
        description: 'Localized blog comment label.',
      },
    },
  },
  feedLinks: {
    name: 'feedLinks',
    type: 'array',
    description: 'Blog feed links array.',
    itemChildren: feedLinkItemProperties,
    children: createArrayProperties(feedLinkItemProperties),
  },
  posts: {
    name: 'posts',
    type: 'array',
    description: 'Collection of posts available in the current widget context.',
    docUrl: 'https://bloggercode.orbiona.com/1971/08/data-posts.html',
    itemChildren: singlePostProperties,
    children: createArrayProperties(singlePostProperties),
  },
};

export const adSenseWidgetProperties: Record<string, BloggerProperty> = {
  adClientId: {
    name: 'adClientId',
    type: 'string',
    description: 'AdSense publisher ID (`ca-pub-XXXXXXXXXXXXXXXX`). Gadget v2 only.',
  },
  adCode: {
    name: 'adCode',
    type: 'string',
    description: 'Raw HTML/JavaScript snippet for the AdSense ad unit.',
  },
};

export const imageAuthorProperties: Record<string, BloggerProperty> = {
  name: {
    name: 'name',
    type: 'string',
    description: 'Name of the theme background image creator/photographer.',
  },
  url: {
    name: 'url',
    type: 'url',
    description: 'Portfolio or source link for the background image creator.',
  },
};

export const attributionWidgetProperties: Record<string, BloggerProperty> = {
  bloggerUrl: {
    name: 'bloggerUrl',
    type: 'url',
    description: 'Blogger platform URL (`https://www.blogger.com`).',
  },
  copyright: {
    name: 'copyright',
    type: 'string',
    description: 'Custom copyright notice entered in Layout UI.',
  },
  imageAuthor: {
    name: 'imageAuthor',
    type: 'object',
    description: 'Credit details for template background image designer.',
    children: imageAuthorProperties,
  },
};

export const archivePostItemProperties: Record<string, BloggerProperty> = {
  title: {
    name: 'title',
    type: 'string',
    description: 'Post headline title string.',
  },
  url: {
    name: 'url',
    type: 'url',
    description: 'Canonical permalink URL of the post.',
  },
};

export const archiveIntervalNodeProperties: Record<string, BloggerProperty> = {
  'expclass': {
    name: 'expclass',
    type: 'string',
    description: 'Collapsible CSS state class (\'expanded\' or \'collapsed\').',
  },
  'name': {
    name: 'name',
    type: 'string',
    description: 'Formatted interval date label.',
  },
  'post-count': {
    name: 'post-count',
    type: 'number',
    description: 'Number of posts published within this interval.',
  },
  'posts': {
    name: 'posts',
    type: 'array',
    description: 'Child post entry inside leaf interval nodes.',
    itemChildren: archivePostItemProperties,
    children: createArrayProperties(archivePostItemProperties),
  },
  'toggleId': {
    name: 'toggleId',
    type: 'string',
    description: 'Unique DOM ID for collapsible JS toggle script.',
  },
  'url': {
    name: 'url',
    type: 'url',
    description: 'Archive filter URL for this interval.',
  },
};

archiveIntervalNodeProperties.data = {
  name: 'data',
  type: 'array',
  description: 'Nested child intervals (empty at leaf level).',
  itemChildren: archiveIntervalNodeProperties,
  children: createArrayProperties(archiveIntervalNodeProperties),
};

export const blogArchiveWidgetProperties: Record<string, BloggerProperty> = {
  'data': {
    name: 'data',
    type: 'array',
    description: 'Recursive collection of archive interval nodes.',
    itemChildren: archiveIntervalNodeProperties,
    children: createArrayProperties(archiveIntervalNodeProperties),
  },
  'expclass': {
    name: 'expclass',
    type: 'string',
    description: 'Collapsible CSS class (`\'expanded\'` / `\'collapsed\'`) for all-time interval.',
  },
  'name': {
    name: 'name',
    type: 'string',
    description: 'Formatted date string for root all-time period.',
  },
  'post-count': {
    name: 'post-count',
    type: 'number',
    description: 'Total published post count across all-time period.',
  },
  'style': {
    name: 'style',
    type: 'string',
    description: 'Display style configured in UI: `\'HIERARCHY\'`, `\'FLAT\'`, or `\'MENU\'`.',
  },
  'title': {
    name: 'title',
    type: 'string',
    description: 'Widget header title (max 100 chars).',
  },
  'toggleId': {
    name: 'toggleId',
    type: 'string',
    description: 'DOM ID string for hierarchy toggle button.',
  },
  'toggleopen': {
    name: 'toggleopen',
    type: 'string',
    description: 'Toggle state indicator string (`\'toggleopen\'` or empty).',
  },
  'url': {
    name: 'url',
    type: 'url',
    description: 'Archive landing URL for root all-time period.',
  },
};

export const blogListItemThumbnailProperties: Record<string, BloggerProperty> = {
  height: {
    name: 'height',
    type: 'number',
    description: 'Native height of the thumbnail image in pixels.',
  },
  url: {
    name: 'url',
    type: 'url',
    description: 'Direct image source URL of the thumbnail.',
  },
  width: {
    name: 'width',
    type: 'number',
    description: 'Native width of the thumbnail image in pixels.',
  },
};

export const blogListItemProperties: Record<string, BloggerProperty> = {
  blogIconUrl: {
    name: 'blogIconUrl',
    type: 'string',
    description: 'URL to the blog\'s favicon or icon image.',
  },
  blogTitle: {
    name: 'blogTitle',
    type: 'string',
    description: 'Title of the external blog.',
  },
  blogUrl: {
    name: 'blogUrl',
    type: 'url',
    description: 'Homepage URL of the external blog.',
  },
  displayStyle: {
    name: 'displayStyle',
    type: 'string',
    description: 'Display style configured in UI (\'list\' or \'icon\').',
  },
  itemSnippet: {
    name: 'itemSnippet',
    type: 'string',
    description: 'Short summary excerpt of the latest published post.',
  },
  itemThumbnail: {
    name: 'itemThumbnail',
    type: 'object',
    description: 'Thumbnail image dimensions and URL for latest post.',
    children: blogListItemThumbnailProperties,
  },
  itemTitle: {
    name: 'itemTitle',
    type: 'string',
    description: 'Headline/title of the latest published post.',
  },
  itemUrl: {
    name: 'itemUrl',
    type: 'url',
    description: 'Direct permalink URL to the latest published post.',
  },
  timePeriodSinceLastUpdate: {
    name: 'timePeriodSinceLastUpdate',
    type: 'string',
    description: 'Localized human-readable elapsed duration (e.g. \'2 hours ago\').',
  },
};

export const blogListWidgetProperties: Record<string, BloggerProperty> = {
  items: {
    name: 'items',
    type: 'array',
    description: 'Collection of syndicated blog entries in the blogroll.',
    itemChildren: blogListItemProperties,
    children: createArrayProperties(blogListItemProperties),
  },
  linkColor: {
    name: 'linkColor',
    type: 'string',
    description: 'Link color hexadecimal code from widget styling settings.',
  },
  numItemsToShow: {
    name: 'numItemsToShow',
    type: 'number',
    description: 'Max number of blogs displayed before truncation.',
  },
  showAllText: {
    name: 'showAllText',
    type: 'string',
    description: 'Localized label to reveal all blogs (e.g. \'Show all\').',
  },
  showIcon: {
    name: 'showIcon',
    type: 'boolean',
    description: 'UI toggle for rendering each blog\'s favicon.',
  },
  showItemSnippet: {
    name: 'showItemSnippet',
    type: 'boolean',
    description: 'UI toggle for rendering the latest post summary.',
  },
  showItemThumbnail: {
    name: 'showItemThumbnail',
    type: 'boolean',
    description: 'UI toggle for rendering the latest post thumbnail.',
  },
  showItemTitle: {
    name: 'showItemTitle',
    type: 'boolean',
    description: 'UI toggle for rendering the latest post title.',
  },
  showNText: {
    name: 'showNText',
    type: 'string',
    description: 'Localized label for displaying limited count (e.g. \'Show %d\').',
  },
  showTimePeriodSinceLastUpdate: {
    name: 'showTimePeriodSinceLastUpdate',
    type: 'boolean',
    description: 'UI toggle for rendering elapsed time since last post.',
  },
  sortType: {
    name: 'sortType',
    type: 'string',
    description: 'Sorting order (`\'ALPHABETICAL\'`, `\'LAST_UPDATE_DESCENDING\'`).',
  },
  textColor: {
    name: 'textColor',
    type: 'string',
    description: 'Text color hexadecimal code from widget styling settings.',
  },
  title: {
    name: 'title',
    type: 'string',
    description: 'Widget header title (max 100 chars).',
  },
  totalItems: {
    name: 'totalItems',
    type: 'number',
    description: 'Total count of blogs registered in this gadget.',
  },
};

export const blogSearchWidgetProperties: Record<string, BloggerProperty> = {
  title: {
    name: 'title',
    type: 'string',
    description: 'Widget header title (max 100 chars).',
  },
};

export const bloggerButtonWidgetProperties: Record<string, BloggerProperty> = {
  source: {
    name: 'source',
    type: 'url',
    description: 'Direct URL path to selected logo graphic. Gadget v2 only.',
  },
  srcset: {
    name: 'srcset',
    type: 'string',
    description: 'Responsive `srcset` string containing `1x` and `2x` image source descriptors. Gadget v2 only.',
  },
};

export const contactFormWidgetProperties: Record<string, BloggerProperty> = {
  contactFormEmailMsg: {
    name: 'contactFormEmailMsg',
    type: 'string',
    description: 'Label and placeholder text for email input field.',
  },
  contactFormEmptyMessageMsg: {
    name: 'contactFormEmptyMessageMsg',
    type: 'string',
    description: 'Client/server validation warning for empty message textarea.',
  },
  contactFormInvalidEmailMsg: {
    name: 'contactFormInvalidEmailMsg',
    type: 'string',
    description: 'Client/server validation warning for invalid email format.',
  },
  contactFormMessageMsg: {
    name: 'contactFormMessageMsg',
    type: 'string',
    description: 'Label and placeholder text for message textarea.',
  },
  contactFormMessageNotSentMsg: {
    name: 'contactFormMessageNotSentMsg',
    type: 'string',
    description: 'Status alert displayed when delivery encounters server error.',
  },
  contactFormMessageSendingMsg: {
    name: 'contactFormMessageSendingMsg',
    type: 'string',
    description: 'In-flight submission progress indicator text.',
  },
  contactFormMessageSentMsg: {
    name: 'contactFormMessageSentMsg',
    type: 'string',
    description: 'Success confirmation notice displayed after dispatch.',
  },
  contactFormNameMsg: {
    name: 'contactFormNameMsg',
    type: 'string',
    description: 'Label and placeholder text for sender name input.',
  },
  contactFormSendMsg: {
    name: 'contactFormSendMsg',
    type: 'string',
    description: 'Action text displayed on form submit button.',
  },
  submitUrl: {
    name: 'submitUrl',
    type: 'url',
    description: 'Platform AJAX RPC endpoint URL for form submission.',
  },
  title: {
    name: 'title',
    type: 'string',
    description: 'Widget header title (max 100 chars).',
  },
};

export const postDisplayProperties: Record<string, BloggerProperty> = {
  showAuthor: {
    name: 'showAuthor',
    type: 'boolean',
    description: 'UI toggle indicating whether post author is shown.',
  },
  showDate: {
    name: 'showDate',
    type: 'boolean',
    description: 'UI toggle indicating whether publication date is shown.',
  },
  showFeaturedImage: {
    name: 'showFeaturedImage',
    type: 'boolean',
    description: 'UI toggle indicating whether hero/featured thumbnail is displayed.',
  },
  showSnippet: {
    name: 'showSnippet',
    type: 'boolean',
    description: 'UI toggle indicating whether post excerpt/snippet is shown.',
  },
  showTitle: {
    name: 'showTitle',
    type: 'boolean',
    description: 'UI toggle indicating whether post title headline is shown.',
  },
};

export const featuredPostWidgetProperties: Record<string, BloggerProperty> = {
  postDisplay: {
    name: 'postDisplay',
    type: 'object',
    description: 'Structured display preferences configured in UI.',
    children: postDisplayProperties,
  },
  posts: {
    name: 'posts',
    type: 'array',
    description: 'Single-element collection containing the pinned post model.',
    itemChildren: singlePostProperties,
    children: createArrayProperties(singlePostProperties),
  },
  title: {
    name: 'title',
    type: 'string',
    description: 'Widget header title (max 100 chars).',
  },
};

export const feedWidgetProperties: Record<string, BloggerProperty> = {
  feedUrl: {
    name: 'feedUrl',
    type: 'url',
    description: 'Syndication feed endpoint URL (RSS 2.0 or Atom).',
  },
  loadingMsg: {
    name: 'loadingMsg',
    type: 'string',
    description: 'Localized placeholder text while fetching feed items (e.g. \'Loading...\').',
  },
  numItemsShow: {
    name: 'numItemsShow',
    type: 'number',
    description: 'Maximum entries to display.',
  },
  openLinksInNewWindow: {
    name: 'openLinksInNewWindow',
    type: 'boolean',
    description: 'UI toggle indicating whether feed links open in `target=\'_blank\'`.',
  },
  showItemAuthor: {
    name: 'showItemAuthor',
    type: 'boolean',
    description: 'UI toggle indicating whether to display entry author.',
  },
  showItemDate: {
    name: 'showItemDate',
    type: 'boolean',
    description: 'UI toggle indicating whether to display entry publication date.',
  },
  title: {
    name: 'title',
    type: 'string',
    description: 'Widget header title (defaults to feed title if omitted).',
  },
};

export const followersWidgetProperties: Record<string, BloggerProperty> = {
  codeSnippet: {
    name: 'codeSnippet',
    type: 'string',
    description: 'Raw HTML/JS snippet generating the sandboxed Google Friend Connect / Followers iframe.',
  },
  title: {
    name: 'title',
    type: 'string',
    description: 'Widget header title (e.g. \'Followers\' or localized equivalent).',
  },
};

export const htmlWidgetProperties: Record<string, BloggerProperty> = {
  content: {
    name: 'content',
    type: 'string',
    description: 'Raw HTML markup, JavaScript snippet, or formatted text payload.',
  },
  title: {
    name: 'title',
    type: 'string',
    description: 'Optional widget header title configured in UI.',
  },
};

export const headerWidgetProperties: Record<string, BloggerProperty> = {
  backgroundPositionStyleStr: {
    name: 'backgroundPositionStyleStr',
    type: 'string',
    description: 'Inline CSS string for banner background positioning (e.g. \'background-position: center;\').',
  },
  description: {
    name: 'description',
    type: 'string',
    description: 'Blog tagline/description configured in blog settings.',
  },
  height: {
    name: 'height',
    type: 'number',
    description: 'Native banner image height in pixels.',
  },
  image: {
    name: 'image',
    type: 'image',
    description: 'Native Blogger image resource; supports `resizeImage()` expressions.',
  },
  imagePlacement: {
    name: 'imagePlacement',
    type: 'string',
    description: 'Banner placement mode: `\'BEHIND\'`, `\'REPLACE\'`, or `\'BEFORE_DESCRIPTION\'`.',
  },
  sectionWidth: {
    name: 'sectionWidth',
    type: 'number',
    description: 'Available width of the parent `<b:section>` in pixels.',
  },
  shrinkToFit: {
    name: 'shrinkToFit',
    type: 'boolean',
    description: 'UI toggle indicating whether banner scales down to fit container width.',
  },
  sourceUrl: {
    name: 'sourceUrl',
    type: 'url',
    description: 'Direct CDN URL of the uploaded banner image.',
  },
  title: {
    name: 'title',
    type: 'string',
    description: 'Blog title text (or custom header title).',
  },
  useImage: {
    name: 'useImage',
    type: 'boolean',
    description: 'True when an uploaded banner image is active.',
  },
  width: {
    name: 'width',
    type: 'number',
    description: 'Native banner image width in pixels.',
  },
};

export const imageWidgetProperties: Record<string, BloggerProperty> = {
  caption: {
    name: 'caption',
    type: 'string',
    description: 'Caption or descriptive text displayed with the image.',
  },
  height: {
    name: 'height',
    type: 'number',
    description: 'Native height of the image in pixels.',
  },
  link: {
    name: 'link',
    type: 'url',
    description: 'Target destination URL activated when clicking the image.',
  },
  sectionWidth: {
    name: 'sectionWidth',
    type: 'number',
    description: 'Target width of the parent `<b:section>` in pixels.',
  },
  shrinkToFit: {
    name: 'shrinkToFit',
    type: 'boolean',
    description: 'UI toggle indicating whether the image scales down to container width.',
  },
  sourceSet: {
    name: 'sourceSet',
    type: 'string',
    description: 'Comma-separated responsive image candidates (`srcset`).',
  },
  sourceUrl: {
    name: 'sourceUrl',
    type: 'url',
    description: 'Direct CDN or external source URL of the image.',
  },
  title: {
    name: 'title',
    type: 'string',
    description: 'Widget header title configured in UI.',
  },
  width: {
    name: 'width',
    type: 'number',
    description: 'Native width of the image in pixels.',
  },
};

export const labelWidgetProperties: Record<string, BloggerProperty> = {
  display: {
    name: 'display',
    type: 'string',
    description: 'Presentation format chosen in UI: `\'list\'` or `\'cloud\'`.',
  },
  labels: {
    name: 'labels',
    type: 'array',
    description: 'Collection of label models configured for display in this gadget.',
    itemChildren: labelItemProperties,
    children: createArrayProperties(labelItemProperties),
  },
  showFreqNumbers: {
    name: 'showFreqNumbers',
    type: 'boolean',
    description: 'UI toggle indicating whether to display post count per label.',
  },
  title: {
    name: 'title',
    type: 'string',
    description: 'Widget header title (defaults to \'Labels\' if omitted).',
  },
};

export const linkListWidgetProperties: Record<string, BloggerProperty> = {
  links: {
    name: 'links',
    type: 'array',
    description: 'Collection of user-configured hyperlink items.',
    itemChildren: linkItemProperties,
    children: createArrayProperties(linkItemProperties),
  },
  shownum: {
    name: 'shownum',
    type: 'number',
    description: 'Maximum links to display (0 or negative indicates no limit / show all).',
  },
  sorting: {
    name: 'sorting',
    type: 'string',
    description: 'Ordering mode set in UI (`\'none\'`, `\'alpha\'`, `\'reverse-alpha\'`).',
  },
  title: {
    name: 'title',
    type: 'string',
    description: 'Widget header title (defaults to \'Links\' if omitted).',
  },
};

export const pageListWidgetProperties: Record<string, BloggerProperty> = {
  links: {
    name: 'links',
    type: 'array',
    description: 'Collection of standalone page and custom navigation links.',
    itemChildren: pageLinkItemProperties,
    children: createArrayProperties(pageLinkItemProperties),
  },
  title: {
    name: 'title',
    type: 'string',
    description: 'Widget header title (defaults to \'Pages\' if omitted).',
  },
};

export const popularPostsWidgetProperties: Record<string, BloggerProperty> = {
  postDisplay: {
    name: 'postDisplay',
    type: 'object',
    description: 'Structured display preferences configured in UI.',
    children: postDisplayProperties,
  },
  posts: {
    name: 'posts',
    type: 'array',
    description: 'Collection of popular post models (canonical `Blog` post schema).',
    itemChildren: singlePostProperties,
    children: createArrayProperties(singlePostProperties),
  },
  title: {
    name: 'title',
    type: 'string',
    description: 'Widget header title (defaults to \'Popular Posts\' if omitted).',
  },
};

export const profileAuthorPhotoProperties: Record<string, BloggerProperty> = {
  alt: {
    name: 'alt',
    type: 'string',
    description: 'Accessible alternate text for author avatar.',
  },
  height: {
    name: 'height',
    type: 'number',
    description: 'Pixel height of author avatar image.',
  },
  image: {
    name: 'image',
    type: 'image',
    description: 'Native image resource of author avatar; supports `resizeImage()`.',
  },
  width: {
    name: 'width',
    type: 'number',
    description: 'Pixel width of author avatar image.',
  },
};

export const profileAuthorItemProperties: Record<string, BloggerProperty> = {
  'authorPhoto': {
    name: 'authorPhoto',
    type: 'object',
    description: 'Structured contributor avatar with native image resource.',
    children: profileAuthorPhotoProperties,
  },
  'display-name': {
    name: 'display-name',
    type: 'string',
    description: 'Display name of team contributor.',
  },
  'profileLogo': {
    name: 'profileLogo',
    type: 'string',
    description: 'Platform badge/logo URL for contributor.',
  },
  'userUrl': {
    name: 'userUrl',
    type: 'url',
    description: 'URL linking to contributor\'s profile page.',
  },
};

export const profileWidgetProperties: Record<string, BloggerProperty> = {
  aboutme: {
    name: 'aboutme',
    type: 'string',
    description: 'Author biography or introduction text.',
  },
  authorPhoto: {
    name: 'authorPhoto',
    type: 'object',
    description: 'Structured avatar object with native `image` type.',
    children: profileAuthorPhotoProperties,
  },
  authors: {
    name: 'authors',
    type: 'array',
    description: 'Collection of contributors populated when `team == true`.',
    itemChildren: profileAuthorItemProperties,
    children: createArrayProperties(profileAuthorItemProperties),
  },
  displayname: {
    name: 'displayname',
    type: 'string',
    description: 'Author display name.',
  },
  hasgoogleprofile: {
    name: 'hasgoogleprofile',
    type: 'boolean',
    description: 'True if linked to a Google account profile.',
  },
  location: {
    name: 'location',
    type: 'string',
    description: 'Geographic location configured in author profile.',
  },
  profileLogo: {
    name: 'profileLogo',
    type: 'string',
    description: 'Small platform profile badge/logo URL.',
  },
  showaboutme: {
    name: 'showaboutme',
    type: 'boolean',
    description: 'UI toggle for rendering the biography text.',
  },
  showlocation: {
    name: 'showlocation',
    type: 'boolean',
    description: 'UI toggle for rendering the location string.',
  },
  team: {
    name: 'team',
    type: 'boolean',
    description: 'True if the blog has multiple authors and is configured as a team blog.',
  },
  title: {
    name: 'title',
    type: 'string',
    description: 'Widget header title (defaults to \'About Me\' or \'Contributors\' if omitted).',
  },
  userUrl: {
    name: 'userUrl',
    type: 'url',
    description: 'URL linking to the author\'s public profile page.',
  },
  viewProfileMsg: {
    name: 'viewProfileMsg',
    type: 'string',
    description: 'Localized string (e.g. \'View my complete profile\').',
  },
};

export const statsWidgetProperties: Record<string, BloggerProperty> = {
  showAnimatedCounter: {
    name: 'showAnimatedCounter',
    type: 'boolean',
    description: 'UI toggle indicating whether digits animate dynamically on increment.',
  },
  showGraphicalCounter: {
    name: 'showGraphicalCounter',
    type: 'boolean',
    description: 'UI toggle indicating whether to render stylized graphical digit tiles.',
  },
  showSparkline: {
    name: 'showSparkline',
    type: 'boolean',
    description: 'UI toggle indicating whether to display the miniature traffic trend chart.',
  },
  statsUrl: {
    name: 'statsUrl',
    type: 'url',
    description: 'Blogger endpoint URL used to retrieve traffic counts and sparkline graphics.',
  },
  title: {
    name: 'title',
    type: 'string',
    description: 'Widget header title (defaults to \'Total Pageviews\' if omitted).',
  },
};

export const subscribeFeedItemProperties: Record<string, BloggerProperty> = {
  encodedUrl: {
    name: 'encodedUrl',
    type: 'string',
    description: 'URL-encoded feed endpoint used in reader query parameter strings.',
  },
  title: {
    name: 'title',
    type: 'string',
    description: 'Display name of the feed reader service (e.g. \'Google\', \'Yahoo\').',
  },
  type: {
    name: 'type',
    type: 'string',
    description: 'Identifier code for the feed reader target (e.g. \'GOOGLE\', \'YAHOO\').',
  },
  url: {
    name: 'url',
    type: 'url',
    description: 'Direct one-click subscription endpoint targeting that reader service.',
  },
};

export const subscribeWidgetProperties: Record<string, BloggerProperty> = {
  arrowDropdownImg: {
    name: 'arrowDropdownImg',
    type: 'url',
    description: 'Static platform image URL for the dropdown chevron arrow.',
  },
  atomFeedTxt: {
    name: 'atomFeedTxt',
    type: 'string',
    description: 'Localized label for direct Atom feed subscription (e.g. \'Posts (Atom)\').',
  },
  feedIconImg: {
    name: 'feedIconImg',
    type: 'url',
    description: 'Static platform image URL for the standard orange RSS feed icon.',
  },
  feeds: {
    name: 'feeds',
    type: 'array',
    description: 'Collection of supported web feed reader targets.',
    itemChildren: subscribeFeedItemProperties,
    children: createArrayProperties(subscribeFeedItemProperties),
  },
  imagePathBase: {
    name: 'imagePathBase',
    type: 'url',
    description: 'Base CDN directory URL containing feed reader brand logos.',
  },
  title: {
    name: 'title',
    type: 'string',
    description: 'Widget header title (e.g. \'Subscribe To\').',
  },
  widgetId: {
    name: 'widgetId',
    type: 'string',
    description: 'Canonical widget instance ID string.',
  },
};

export const textWidgetProperties: Record<string, BloggerProperty> = {
  content: {
    name: 'content',
    type: 'string',
    description: 'Raw HTML markup, JavaScript snippet, or formatted text payload.',
  },
  title: {
    name: 'title',
    type: 'string',
    description: 'Optional widget header title configured in UI.',
  },
};

export const textListWidgetProperties: Record<string, BloggerProperty> = {
  items: {
    name: 'items',
    type: 'array',
    description: 'Collection of user-configured text strings.',
    children: createArrayProperties(),
  },
  shownum: {
    name: 'shownum',
    type: 'number',
    description: 'Maximum items to display (0 or negative indicates no limit / show all).',
  },
  sorting: {
    name: 'sorting',
    type: 'string',
    description: 'Ordering mode set in UI (\'none\', \'alpha\', \'reverse-alpha\').',
  },
  title: {
    name: 'title',
    type: 'string',
    description: 'Widget header title (defaults to \'List\' if omitted).',
  },
};

export const translateWidgetProperties: Record<string, BloggerProperty> = {
  layout: {
    name: 'layout',
    type: 'string',
    description: 'Presentation format chosen in UI: `\'VERTICAL\'`, `\'HORIZONTAL\'`, `\'SIMPLE\'`.',
  },
  pageLanguage: {
    name: 'pageLanguage',
    type: 'string',
    description: 'Source language ISO code of the blog (e.g. \'en\', \'es\', \'fr\').',
  },
  title: {
    name: 'title',
    type: 'string',
    description: 'Widget header title (e.g. \'Translate\').',
  },
};

export const wikipediaWidgetProperties: Record<string, BloggerProperty> = {
  enterTextMsg: {
    name: 'enterTextMsg',
    type: 'string',
    description: 'Localized placeholder/prompt (e.g. \'Enter search terms\').',
  },
  fetchingErrorMsg: {
    name: 'fetchingErrorMsg',
    type: 'string',
    description: 'Localized error message displayed when Wikipedia API query fails.',
  },
  moreMsg: {
    name: 'moreMsg',
    type: 'string',
    description: 'Localized string for expansion/read more link (e.g. \'More\').',
  },
  noResultsFoundMsg: {
    name: 'noResultsFoundMsg',
    type: 'string',
    description: 'Localized message when query yields zero results (e.g. \'No results found\').',
  },
  searchResultsMsg: {
    name: 'searchResultsMsg',
    type: 'string',
    description: 'Localized header for results list (e.g. \'Search Results\').',
  },
  title: {
    name: 'title',
    type: 'string',
    description: 'Widget header title (defaults to \'Wikipedia\' if omitted).',
  },
};

export const reportAbuseWidgetProperties: Record<string, BloggerProperty> = {};

export const WIDGET_DATA_DICTIONARIES: Record<string, Record<string, BloggerProperty>> = {
  AdSense: adSenseWidgetProperties,
  Attribution: attributionWidgetProperties,
  Blog: blogWidgetProperties,
  BlogArchive: blogArchiveWidgetProperties,
  BlogList: blogListWidgetProperties,
  BlogSearch: blogSearchWidgetProperties,
  BloggerButton: bloggerButtonWidgetProperties,
  ContactForm: contactFormWidgetProperties,
  FeaturedPost: featuredPostWidgetProperties,
  Feed: feedWidgetProperties,
  Followers: followersWidgetProperties,
  HTML: htmlWidgetProperties,
  Header: headerWidgetProperties,
  Image: imageWidgetProperties,
  Label: labelWidgetProperties,
  LinkList: linkListWidgetProperties,
  PageList: pageListWidgetProperties,
  PopularPosts: popularPostsWidgetProperties,
  Profile: profileWidgetProperties,
  ReportAbuse: reportAbuseWidgetProperties,
  Stats: statsWidgetProperties,
  Subscribe: subscribeWidgetProperties,
  Text: textWidgetProperties,
  TextList: textListWidgetProperties,
  Translate: translateWidgetProperties,
};

export const sharingPlatformProperties: Record<string, BloggerProperty> = {
  key: {
    name: 'key',
    type: 'string',
    description: 'Identifier (\'facebook\', \'twitter\', \'pinterest\', \'email\', \'link\').',
  },
  name: {
    name: 'name',
    type: 'string',
    description: 'Localized display name (\'Facebook\', \'Twitter\', etc.).',
  },
  shareMessage: {
    name: 'shareMessage',
    type: 'string',
    description: 'Localized action label (\'Share to Facebook\').',
  },
  target: {
    name: 'target',
    type: 'string',
    description: 'Outbound URL endpoint with pre-encoded sharing parameters.',
  },
};

export const sharingProperties: Record<string, BloggerProperty> = {
  platforms: {
    name: 'platforms',
    type: 'array',
    description: 'List of active social sharing networks.',
    itemChildren: sharingPlatformProperties,
  },
};

export const blogProperties: Record<string, BloggerProperty> = {
  adsenseAutoAds: {
    name: 'adsenseAutoAds',
    type: 'boolean',
    description: 'True if auto ads are enabled for the blog.',
    docUrl: 'https://bloggercode.orbiona.com/1978/08/data-blog-adsenseAutoAds.html',
  },
  adsenseClientId: {
    name: 'adsenseClientId',
    type: 'string',
    description: 'The client ID for the blog\'s AdSense account.',
    docUrl: 'https://bloggercode.orbiona.com/1978/10/data-blog-adsenseClientId.html',
  },
  adsenseHasAds: {
    name: 'adsenseHasAds',
    type: 'boolean',
    description: 'True if the blog has AdSense ads enabled.',
    docUrl: 'https://bloggercode.orbiona.com/1978/11/data-blog-adsenseHasAds.html',
  },
  adsenseHostId: {
    name: 'adsenseHostId',
    type: 'string',
    description: 'The host ID for the blog\'s AdSense account.',
    docUrl: 'https://bloggercode.orbiona.com/1978/11/data-blog-disableAdSenseWidget.html',
  },
  adultContent: {
    name: 'adultContent',
    type: 'boolean',
    description: 'True if the blog is marked as containing adult content.',
    docUrl: 'https://bloggercode.orbiona.com/1978/10/data-blog-adultContent.html',
  },
  analytics4: {
    name: 'analytics4',
    type: 'boolean',
    description: 'True if the blog owner has entered a Google Analytics 4 (GA4) measurement ID.',
    docUrl: 'https://bloggercode.orbiona.com/1978/08/blog-analytics4.html',
  },
  analyticsAccountNumber: {
    name: 'analyticsAccountNumber',
    type: 'string',
    description: 'The Google Analytics account number for the blog.',
    docUrl: 'https://bloggercode.orbiona.com/1978/10/data-blog-analyticsAccountNumber.html',
  },
  bloggerUrl: {
    name: 'bloggerUrl',
    type: 'url',
    description: 'The URL of blogger.com.',
    docUrl: 'https://bloggercode.orbiona.com/1978/10/data-blog-bloggerUrl.html',
  },
  blogId: {
    name: 'blogId',
    type: 'string',
    description: 'The unique ID of the blog.',
    docUrl: 'https://bloggercode.orbiona.com/1978/11/data-blog-blogId.html',
  },
  blogspotFaviconUrl: {
    name: 'blogspotFaviconUrl',
    type: 'url',
    description: 'The URL of the blog\'s favicon.',
    docUrl: 'https://bloggercode.orbiona.com/1978/10/data-blog-blogspotFaviconUrl.html',
  },
  encoding: {
    name: 'encoding',
    type: 'string',
    description: 'Character encoding of the blog (e.g. UTF-8).',
    docUrl: 'https://bloggercode.orbiona.com/1978/11/data-blog-encoding.html',
  },
  feedLinks: {
    name: 'feedLinks',
    type: 'string',
    description: 'Auto-discovery link tags for RSS/Atom feeds.',
    docUrl: 'https://bloggercode.orbiona.com/1978/11/data-blog-feedLinks.html',
  },
  hasCustomDomain: {
    name: 'hasCustomDomain',
    type: 'boolean',
    description: 'True if the blog uses a custom domain.',
    docUrl: 'https://bloggercode.orbiona.com/1978/12/data-blog-hasCustomDomain.html',
  },
  hasCustomJumpLinkMessage: {
    name: 'hasCustomJumpLinkMessage',
    type: 'boolean',
    description: 'True if a custom "Read more" / jump link text is defined.',
    docUrl: 'https://bloggercode.orbiona.com/1972/12/data-blog-hasCustomJumpLinkMessage.html',
  },
  homepageUrl: {
    name: 'homepageUrl',
    type: 'url',
    description: 'The main homepage URL of the blog.',
    docUrl: 'https://bloggercode.orbiona.com/1978/11/data-blog-homepageUrl.html',
  },
  httpsEnabled: {
    name: 'httpsEnabled',
    type: 'boolean',
    description: 'True if HTTPS redirection is enabled on the blog.',
    docUrl: 'https://bloggercode.orbiona.com/1978/12/data-blog-httpsEnabled.html',
  },
  isMobileRequest: {
    name: 'isMobileRequest',
    type: 'boolean',
    description: 'True if the request comes from a mobile user agent.',
    docUrl: 'https://bloggercode.orbiona.com/1978/10/data-blog-isMobileRequest.html',
  },
  isPrivate: {
    name: 'isPrivate',
    type: 'boolean',
    description: 'True if the blog is restricted to author/reader permissions only.',
    docUrl: 'https://bloggercode.orbiona.com/1978/11/data-blog-isPrivate.html',
  },
  isPrivateBlog: {
    name: 'isPrivateBlog',
    type: 'boolean',
    description: 'True if the blog is configured as private.',
    docUrl: 'https://bloggercode.orbiona.com/1978/10/data-blog-isPrivateBlog.html',
  },
  jumpLinkMessage: {
    name: 'jumpLinkMessage',
    type: 'string',
    description: 'The text displayed for the jump link ("Read more").',
    docUrl: 'https://bloggercode.orbiona.com/1978/11/data-blog-jumpLinkMessage.html',
  },
  languageDirection: {
    name: 'languageDirection',
    type: 'string',
    description: 'Text direction of the current language (\'ltr\' or \'rtl\').',
    docUrl: 'https://bloggercode.orbiona.com/1978/10/data-blog-languageDirection.html',
  },
  locale: {
    name: 'locale',
    type: 'locale',
    description: 'Standard language/locale code of the blog (e.g. \'es\', \'en\').',
    docUrl: 'https://bloggercode.orbiona.com/1978/10/data-blog-locale.html',
  },
  localeUnderscoreDelimited: {
    name: 'localeUnderscoreDelimited',
    type: 'string',
    description: 'Locale code formatted with an underscore (e.g. \'es_419\', \'en_US\').',
    docUrl: 'https://bloggercode.orbiona.com/1978/10/data-blog-localeUnderscoreDelimited.html',
  },
  metaDescription: {
    name: 'metaDescription',
    type: 'string',
    description: 'Search meta description configured for the current page or blog.',
    docUrl: 'https://bloggercode.orbiona.com/1978/10/data-blog-metaDescription.html',
  },
  pageId: {
    name: 'pageId',
    type: 'string',
    description: 'The unique ID of the static page (when on a static page).',
    docUrl: 'https://bloggercode.orbiona.com/2021/11/blog-pageId.html',
  },
  pageName: {
    name: 'pageName',
    type: 'string',
    description: 'Name or title of the current post, static page, label, or archive.',
    docUrl: 'https://bloggercode.orbiona.com/1978/11/data-blog-pageName.html',
  },
  pageTitle: {
    name: 'pageTitle',
    type: 'string',
    description: 'Formatted title string intended for the HTML <title> tag.',
    docUrl: 'https://bloggercode.orbiona.com/1978/11/data-blog-pageTitle.html',
  },
  pageType: {
    name: 'pageType',
    type: 'string',
    description: 'Current page type (\'item\', \'static_page\', \'index\', \'archive\', \'error_page\').',
    docUrl: 'https://bloggercode.orbiona.com/1978/11/data-blog-pageType.html',
  },
  postId: {
    name: 'postId',
    type: 'string',
    description: 'The unique ID of the post (when on a post page).',
    docUrl: 'https://bloggercode.orbiona.com/2021/11/blog-postId.html',
  },
  postImageThumbnailUrl: {
    name: 'postImageThumbnailUrl',
    type: 'string',
    description: 'URL of the thumbnail of the primary post image.',
    docUrl: 'https://bloggercode.orbiona.com/1978/10/data-blog-postImageThumbnailUrl.html',
  },
  postImageUrl: {
    name: 'postImageUrl',
    type: 'string',
    description: 'Full-size URL of the primary image in the post.',
    docUrl: 'https://bloggercode.orbiona.com/1978/10/data-blog-postImageUrl.html',
  },
  searchLabel: {
    name: 'searchLabel',
    type: 'string',
    description: 'Label term when viewing a label search page.',
    docUrl: 'https://bloggercode.orbiona.com/2021/11/blog-searchLabel.html',
  },
  searchQuery: {
    name: 'searchQuery',
    type: 'string',
    description: 'Search query keyword when viewing a query result page.',
    docUrl: 'https://bloggercode.orbiona.com/2021/11/blog-searchQuery.html',
  },
  searchUrl: {
    name: 'searchUrl',
    type: 'url',
    description: 'Base URL for internal blog search queries.',
    docUrl: 'https://bloggercode.orbiona.com/1978/12/data-blog-searchUrl.html',
  },
  sharing: {
    name: 'sharing',
    type: 'object',
    description: 'Container for social sharing targets and platforms.',
    docUrl: 'https://bloggercode.orbiona.com/1978/11/data-blog-sharing.html',
    children: sharingProperties,
  },
  title: {
    name: 'title',
    type: 'string',
    description: 'The general name / main title of the blog.',
    docUrl: 'https://bloggercode.orbiona.com/1978/11/data-blog-title.html',
  },
  url: {
    name: 'url',
    type: 'url',
    description: 'Current canonical URL of the requested page.',
    docUrl: 'https://bloggercode.orbiona.com/1978/11/data-blog-url.html',
  },
  view: {
    name: 'view',
    type: 'string',
    description: 'Contains the name of the current view.',
    docUrl:
      'https://bloggercode.orbiona.com/1978/10/data-blog-view.html',
  },
};

const messageNames = [
  'adsGoHere',
  'archive',
  'at',
  'authorSaid',
  'authorSaidWithLink',
  'blogArchive',
  'blogAuthors',
  'by',
  'byAuthor',
  'byAuthorLink',
  'comments',
  'configurationRequired',
  'copy',
  'copyToClipboard',
  'deleteComment',
  'dynamicViewsNotAvailable',
  'edit',
  'emailAddress',
  'emailPost',
  'euCookieNotice',
  'euCookieNotice2018',
  'euCookieResponsibility',
  'euCookieResponsibility2018',
  'featured',
  'getEmailNotifications',
  'gotIt',
  'hidden',
  'home',
  'image',
  'joinTheConversation',
  'keepReading',
  'labels',
  'latestPosts',
  'learnMore',
  'linkCopiedToClipboard',
  'loadMorePosts',
  'loading',
  'moreEllipsis',
  'morePosts',
  'myBlogList',
  'myFavoriteSites',
  'myPhoto',
  'newer',
  'newerPosts',
  'newest',
  'noResultsFound',
  'noTitle',
  'numberOfComments',
  'ok',
  'older',
  'olderPosts',
  'oldest',
  'onlyTeamMembersCanComment',
  'on',
  'photo',
  'popularPosts',
  'popularPostsFromThisBlog',
  'postAComment',
  'postLink',
  'postedBy',
  'postedByAuthor',
  'postedByAuthorLink',
  'posts',
  'poweredByBlogger',
  'poweredByBloggerLink',
  'readMore',
  'recentPosts',
  'reportAbuse',
  'search',
  'searchBlog',
  'searchThisBlog',
  'share',
  'shareOtherApps',
  'shareToOtherApps',
  'showAll',
  'showLess',
  'showMore',
  'skipToMainContent',
  'someOfMyFavoriteSites',
  'subscribe',
  'subscribeTo',
  'subscribeToThisBlog',
  'templateImagesBy',
  'templateImagesByLink',
  'theresNothingHere',
  'title',
  'viewAll',
  'viewMyCompleteProfile',
  'visible',
  'visitProfile',
  'visitSite',
  'widget',
  'widgetNotAvailableInPreview',
  'widgetNotAvailableOnHttps',
  'youMayLikeThesePosts',
] as const;

export const messagesProperties: Record<string, BloggerProperty>
  = Object.fromEntries(
    messageNames.map((name) => {
      const msg = getSpecCatalog().getMessage(name);
      const isParam = msg?.direct_invocation === false || Boolean(msg?.parameters && msg.parameters.length > 0);
      return [
        name,
        {
          name,
          type: 'message',
          description: isParam
            ? `Blogger localized UI message: ${name}. [Requires <b:message> and <b:param>; direct invocation via <data:messages.${name}/> is prohibited.]`
            : `Blogger localized UI message: ${name}`,
          docUrl: 'https://bloggercode.orbiona.com/1979/12/Ressource-data-messages.html',
        },
      ];
    }),
  );

export const skinProperties: Record<string, BloggerProperty> = {
  override: {
    name: 'override',
    type: 'string',
    description: 'Custom CSS injected via Theme Designer ("Add CSS"). Empty if none added.',
    docUrl: 'https://bloggercode.orbiona.com/1972/12/data-skin.html',
  },
  vars: {
    name: 'vars',
    type: 'object',
    description: 'Theme Designer variables dictionary populated from <Variable> tags in <b:skin>.',
    docUrl: 'https://bloggercode.orbiona.com/1972/12/data-skin.html',
  },
};

export const viewProperties: Record<string, BloggerProperty> = {
  archive: {
    name: 'archive',
    type: 'object',
    description: 'Archive view metadata (rangeMessage, day, month, year).',
    docUrl: 'https://bloggercode.orbiona.com/1978/10/data-view-archive.html',
    children: {
      rangeMessage: {
        name: 'rangeMessage',
        type: 'string',
        description: 'Human readable date range message.',
      },
      day: {
        name: 'day',
        type: 'number',
        description: 'Archive day number.',
      },
      month: {
        name: 'month',
        type: 'number',
        description: 'Archive month number (1-12).',
      },
      year: {
        name: 'year',
        type: 'number',
        description: 'Archive year number.',
      },
    },
  },
  description: {
    name: 'description',
    type: 'string',
    description: 'View page description.',
    docUrl: 'https://bloggercode.orbiona.com/1978/05/data-view-description.html',
  },
  featuredImage: {
    name: 'featuredImage',
    type: 'image',
    description: 'Featured image URL for the current view.',
    docUrl: 'https://bloggercode.orbiona.com/1978/05/data-view-featuredImage.html',
  },
  isArchive: {
    name: 'isArchive',
    type: 'boolean',
    description: 'True when viewing an archive period.',
    docUrl: 'https://bloggercode.orbiona.com/1978/10/data-view-isArchive.html',
  },
  isError: {
    name: 'isError',
    type: 'boolean',
    description: 'True when viewing a 404 error page.',
    docUrl: 'https://bloggercode.orbiona.com/1978/10/data-view-isError.html',
  },
  isHomepage: {
    name: 'isHomepage',
    type: 'boolean',
    description: 'True when viewing the blog homepage.',
    docUrl: 'https://bloggercode.orbiona.com/1978/10/data-view-isHomepage.html',
  },
  isLabelSearch: {
    name: 'isLabelSearch',
    type: 'boolean',
    description: 'True when filtering by a specific label.',
    docUrl: 'https://bloggercode.orbiona.com/1978/10/data-view-isLabelSearch.html',
  },
  isLayoutMode: {
    name: 'isLayoutMode',
    type: 'boolean',
    description: 'True when rendered inside Blogger Layout editor.',
    docUrl: 'https://bloggercode.orbiona.com/1978/05/data-view-isLayoutMode.html',
  },
  isMultipleItems: {
    name: 'isMultipleItems',
    type: 'boolean',
    description: 'True on index, archive, or search views with multiple posts.',
    docUrl: 'https://bloggercode.orbiona.com/1978/10/data-view-isMultipleItems.html',
  },
  isPage: {
    name: 'isPage',
    type: 'boolean',
    description: 'True when viewing a static page.',
    docUrl: 'https://bloggercode.orbiona.com/1978/10/data-view-isPage.html',
  },
  isPost: {
    name: 'isPost',
    type: 'boolean',
    description: 'True when viewing a single post item.',
    docUrl: 'https://bloggercode.orbiona.com/1978/10/data-view-isPost.html',
  },
  isPreview: {
    name: 'isPreview',
    type: 'boolean',
    description: 'True when viewing template in designer preview mode.',
    docUrl: 'https://bloggercode.orbiona.com/1978/05/data-view-isPreview.html',
  },
  isSearch: {
    name: 'isSearch',
    type: 'boolean',
    description: 'True when viewing search results or label pages.',
    docUrl: 'https://bloggercode.orbiona.com/1978/10/data-view-isSearch.html',
  },
  isSingleItem: {
    name: 'isSingleItem',
    type: 'boolean',
    description: 'True on single item pages (post or static page).',
    docUrl: 'https://bloggercode.orbiona.com/1978/10/data-view-isSingleItem.html',
  },
  pageId: {
    name: 'pageId',
    type: 'number',
    description: 'Static page ID in current view.',
    docUrl: 'https://bloggercode.orbiona.com/1978/10/data-view-pageId.html',
  },
  postId: {
    name: 'postId',
    type: 'number',
    description: 'Post ID in current view.',
    docUrl: 'https://bloggercode.orbiona.com/1978/10/data-view-postId.html',
  },
  search: {
    name: 'search',
    type: 'object',
    description: 'Search view details (resultsMessageHtml, resultsMessage, query, label).',
    docUrl: 'https://bloggercode.orbiona.com/1978/10/data-view-search.html',
    children: {
      resultsMessageHtml: {
        name: 'resultsMessageHtml',
        type: 'string',
        description: 'HTML formatted results count message.',
      },
      resultsMessage: {
        name: 'resultsMessage',
        type: 'string',
        description: 'Plain text results count message.',
      },
      query: {
        name: 'query',
        type: 'string',
        description: 'Search term query string.',
      },
      label: {
        name: 'label',
        type: 'string',
        description: 'Label filter name.',
      },
    },
  },
  title: {
    name: 'title',
    type: 'string',
    description: 'View page title.',
    docUrl: 'https://bloggercode.orbiona.com/1978/05/data-view-title.html',
  },
  type: {
    name: 'type',
    type: 'string',
    description: 'Current view type identifier.',
    docUrl: 'https://bloggercode.orbiona.com/1978/10/data-view-type.html',
  },
  url: {
    name: 'url',
    type: 'url',
    description: 'Canonical URL for current view.',
    docUrl: 'https://bloggercode.orbiona.com/1978/10/data-view-url.html',
  },
};

export const widgetMetaProperties: Record<string, BloggerProperty> = {
  instanceId: {
    name: 'instanceId',
    type: 'string',
    description: 'Unique widget instance ID.',
    docUrl: 'https://bloggercode.orbiona.com/1978/12/data-widget-instanceId.html',
  },
  sectionId: {
    name: 'sectionId',
    type: 'string',
    description: 'Parent b:section ID containing this widget.',
    docUrl: 'https://bloggercode.orbiona.com/1978/12/data-widget-sectionId.html',
  },
  type: {
    name: 'type',
    type: 'string',
    description: 'Widget type (e.g. Blog, Header, HTML).',
    docUrl: 'https://bloggercode.orbiona.com/1978/12/data-widget-type.html',
  },
  version: {
    name: 'version',
    type: 'number',
    description: 'Widget syntax version (1 or 2).',
    docUrl: 'https://bloggercode.orbiona.com/1978/01/data-widget-version.html',
  },
};

function createWidgetCollectionEntry(
  name: string,
  description: string,
  docUrl?: string,
): BloggerProperty {
  const itemChildren = WIDGET_DESCRIPTORS_MAP[name] ?? baseWidgetDescriptorProperties;
  return {
    name,
    type: 'array',
    description,
    docUrl,
    itemChildren,
    children: createArrayProperties(itemChildren),
  };
}

export const widgetsMapProperties: Record<string, BloggerProperty> = {
  AdSense: createWidgetCollectionEntry('AdSense', 'Collection of visible AdSense gadget descriptors.', 'https://bloggercode.orbiona.com/1979/08/Ressource-AdSense.html'),
  Attribution: createWidgetCollectionEntry('Attribution', 'Collection of visible Attribution gadget descriptors.', 'https://bloggercode.orbiona.com/1979/08/Ressource-Attribution.html'),
  Blog: createWidgetCollectionEntry('Blog', 'Collection of visible Blog gadget descriptors.', 'https://bloggercode.orbiona.com/1979/07/Ressource-Blog.html'),
  BlogArchive: createWidgetCollectionEntry('BlogArchive', 'Collection of visible BlogArchive gadget descriptors.', 'https://bloggercode.orbiona.com/1979/07/Ressource-BlogArchive.html'),
  BloggerButton: createWidgetCollectionEntry('BloggerButton', 'Collection of visible BloggerButton gadget descriptors.', 'https://bloggercode.orbiona.com/1979/07/Ressource-BloggerButton.html'),
  BlogList: createWidgetCollectionEntry('BlogList', 'Collection of visible BlogList gadget descriptors.', 'https://bloggercode.orbiona.com/1979/07/Ressource-BlogList.html'),
  BlogSearch: createWidgetCollectionEntry('BlogSearch', 'Collection of visible BlogSearch gadget descriptors.', 'https://bloggercode.orbiona.com/1979/07/Ressources-CustomSearch.html'),
  ContactForm: createWidgetCollectionEntry('ContactForm', 'Collection of visible ContactForm gadget descriptors.', 'https://bloggercode.orbiona.com/1979/07/Ressource-ContactForm.html'),
  FeaturedPost: createWidgetCollectionEntry('FeaturedPost', 'Collection of visible FeaturedPost gadget descriptors.', 'https://bloggercode.orbiona.com/1979/07/Ressource-FeaturedPost.html'),
  Feed: createWidgetCollectionEntry('Feed', 'Collection of visible Feed gadget descriptors.', 'https://bloggercode.orbiona.com/1979/07/Ressources-Feed.html'),
  Followers: createWidgetCollectionEntry('Followers', 'Collection of visible Followers gadget descriptors.', 'https://bloggercode.orbiona.com/1979/07/Ressource-Followers.html'),
  Header: createWidgetCollectionEntry('Header', 'Collection of visible Header gadget descriptors.', 'https://bloggercode.orbiona.com/1979/07/Ressource-Header.html'),
  HTML: createWidgetCollectionEntry('HTML', 'Collection of visible HTML gadget descriptors.', 'https://bloggercode.orbiona.com/1979/08/Ressource-HTML-Text.html'),
  Image: createWidgetCollectionEntry('Image', 'Collection of visible Image gadget descriptors.', 'https://bloggercode.orbiona.com/1979/07/Ressource-Image.html'),
  Label: createWidgetCollectionEntry('Label', 'Collection of visible Label gadget descriptors.', 'https://bloggercode.orbiona.com/1979/07/Ressource-Label.html'),
  LinkList: createWidgetCollectionEntry('LinkList', 'Collection of visible LinkList gadget descriptors.', 'https://bloggercode.orbiona.com/1979/07/Ressource-LinkList.html'),
  PageList: createWidgetCollectionEntry('PageList', 'Collection of visible PageList gadget descriptors.', 'https://bloggercode.orbiona.com/1979/07/Ressource-PageList.html'),
  PopularPosts: createWidgetCollectionEntry('PopularPosts', 'Collection of visible PopularPosts gadget descriptors.', 'https://bloggercode.orbiona.com/1979/07/Ressource-PopularPosts.html'),
  Profile: createWidgetCollectionEntry('Profile', 'Collection of visible Profile gadget descriptors.', 'https://bloggercode.orbiona.com/1979/07/Ressource-Profile.html'),
  ReportAbuse: createWidgetCollectionEntry('ReportAbuse', 'Collection of visible ReportAbuse gadget descriptors.', 'https://bloggercode.orbiona.com/2019/04/widget-reportAbuse.html'),
  Stats: createWidgetCollectionEntry('Stats', 'Collection of visible Stats gadget descriptors.', 'https://bloggercode.orbiona.com/1979/07/Ressource-Stats.html'),
  Subscribe: createWidgetCollectionEntry('Subscribe', 'Collection of visible Subscribe gadget descriptors.', 'https://bloggercode.orbiona.com/1979/07/Ressource-Subscribe.html'),
  Text: createWidgetCollectionEntry('Text', 'Collection of visible Text gadget descriptors.', 'https://bloggercode.orbiona.com/1979/08/Ressource-HTML-Text.html'),
  TextList: createWidgetCollectionEntry('TextList', 'Collection of visible TextList gadget descriptors.', 'https://bloggercode.orbiona.com/1979/07/Ressource-TextList.html'),
  Translate: createWidgetCollectionEntry('Translate', 'Collection of visible Translate gadget descriptors.', 'https://bloggercode.orbiona.com/1979/07/Ressource-Translate.html'),
  Wikipedia: createWidgetCollectionEntry('Wikipedia', 'Collection of visible Wikipedia gadget descriptors.', 'https://bloggercode.orbiona.com/1979/07/Ressource-Wikipedia.html'),
};

export const templateProperties: Record<string, BloggerProperty> = {
  isAlternateRendering: {
    name: 'isAlternateRendering',
    type: 'boolean',
    description: 'Indicates alternate mobile or dynamic rendering mode.',
  },
  isCustom: {
    name: 'isCustom',
    type: 'boolean',
    description: 'True if theme XML was modified; false for unedited official themes.',
  },
  isResponsive: {
    name: 'isResponsive',
    type: 'boolean',
    description: 'True if the theme declares b:responsive=\'true\' on <html>.',
  },
  localizedName: {
    name: 'localizedName',
    type: 'string',
    description: 'Localized theme display name matching blog language.',
  },
  name: {
    name: 'name',
    type: 'string',
    description: 'Official Blogger base theme name (e.g. \'Notable\', \'Contempo\', \'Simple\', \'Custom\').',
  },
  variant: {
    name: 'variant',
    type: 'string',
    description: 'Theme colorway or style variant label (e.g. \'Light\', \'Dark\').',
  },
  variantId: {
    name: 'variantId',
    type: 'string',
    description: 'Programmatic identifier for variant (e.g. \'light\', \'dark\').',
  },
};

export const bloggerGlobalRoot: Record<string, BloggerProperty> = {
  blog: {
    name: 'blog',
    type: 'object',
    description: 'Global blog information and settings.',
    docUrl: 'https://bloggercode.orbiona.com/1979/12/Ressource-data-blog.html',
    children: blogProperties,
  },
  messages: {
    name: 'messages',
    type: 'object',
    description: 'Localized Blogger UI message dictionary.',
    docUrl: 'https://bloggercode.orbiona.com/1979/12/Ressource-data-messages.html',
    children: messagesProperties,
  },
  skin: {
    name: 'skin',
    type: 'object',
    description: 'Theme skin CSS variables.',
    docUrl: 'https://bloggercode.orbiona.com/1972/12/data-skin.html',
    children: skinProperties,
  },
  template: {
    name: 'template',
    type: 'object',
    description: 'Active theme package manifest and compiler version flags.',
    children: templateProperties,
  },
  view: {
    name: 'view',
    type: 'object',
    description: 'Current request view state and conditionals.',
    docUrl: 'https://bloggercode.orbiona.com/1979/12/Ressource-data-view.html',
    children: viewProperties,
  },
  widget: {
    name: 'widget',
    type: 'object',
    description: 'Current enclosing widget properties.',
    docUrl: 'https://bloggercode.orbiona.com/1979/12/Ressource-data-widget.html',
    children: widgetMetaProperties,
  },
  widgets: {
    name: 'widgets',
    type: 'array',
    description: 'Global cross-widget layout registry in Layouts v3. Exposes descriptor objects ({ id, sectionId, title, type }) for visible widgets; does NOT provide access to the full private widget data dictionaries.',
    docUrl: 'https://bloggercode.orbiona.com/1979/12/Ressource-data-widgets.html',
    itemChildren: baseWidgetDescriptorProperties,
    children: widgetsMapProperties,
  },
};
