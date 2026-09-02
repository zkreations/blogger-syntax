import type { BloggerDataType, BloggerProperty } from '../models/types.js';

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
  isResizable: {
    name: 'isResizable',
    type: 'boolean',
    description: 'Indicates whether the image is resizable via Blogger image service.',
    docUrl: 'https://bloggercode.orbiona.com/2016/04/data-parameters-isResizable.html',
  },
  originalWidth: {
    name: 'originalWidth',
    type: 'number',
    description: 'Original unscaled width of the image.',
    docUrl: 'https://bloggercode.orbiona.com/2018/02/data-parameters-width-height.html',
  },
  originalHeight: {
    name: 'originalHeight',
    type: 'number',
    description: 'Original unscaled height of the image.',
    docUrl: 'https://bloggercode.orbiona.com/2018/02/data-parameters-width-height.html',
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
    if (property.children && Object.keys(property.children).length > 0) {
      return property.children;
    }
    return createArrayProperties(property.itemChildren, 'object');
  }

  if (property.type === 'string') {
    return STRING_MEMBERS;
  }

  if (property.type === 'image') {
    return IMAGE_MEMBERS;
  }

  if (property.type === 'locale') {
    return property.children ? { ...LOCALE_MEMBERS, ...property.children } : LOCALE_MEMBERS;
  }

  if (property.type === 'date') {
    return DATE_MEMBERS;
  }

  if (property.type === 'url') {
    return URL_MEMBERS;
  }

  return property.children;
}
