import type { BloggerDataType, BloggerProperty } from '../models/types.js';

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
