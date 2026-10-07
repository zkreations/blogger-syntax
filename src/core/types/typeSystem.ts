import type { BloggerDataType, BloggerProperty } from '../models/types.js';
import {
  createArrayProperties,
  DATE_MEMBERS,
  IMAGE_MEMBERS,
  LOCALE_MEMBERS,
  STRING_MEMBERS,
  URL_MEMBERS,
} from '../data/typeMembers.js';

export const SUBTYPE_PARENT_MAP: Readonly<Partial<Record<BloggerDataType, BloggerDataType>>> = Object.freeze({
  image: 'url',
  url: 'string',
  date: 'string',
  locale: 'string',
  message: 'string',
});

/**
 * Checks if source type is assignable to target type taking into account subtype hierarchy.
 */
export function isTypeAssignable(source: BloggerDataType, target: BloggerDataType): boolean {
  if (source === target || target === 'unknown') {
    return true;
  }
  let current: BloggerDataType | undefined = source;
  while (current && SUBTYPE_PARENT_MAP[current]) {
    current = SUBTYPE_PARENT_MAP[current];
    if (current === target) {
      return true;
    }
  }
  return false;
}

/**
 * Resolves standard property/parameter modifiers bound to a data type according to Horatio.
 */
export function getTypeModifiers(
  type: BloggerDataType,
  itemChildren?: Record<string, BloggerProperty>,
): Record<string, BloggerProperty> | undefined {
  switch (type) {
    case 'string':
      return STRING_MEMBERS;
    case 'url':
      return { ...STRING_MEMBERS, ...URL_MEMBERS };
    case 'image':
      return { ...STRING_MEMBERS, ...URL_MEMBERS, ...IMAGE_MEMBERS };
    case 'date':
      return { ...STRING_MEMBERS, ...DATE_MEMBERS };
    case 'locale':
      return { ...STRING_MEMBERS, ...LOCALE_MEMBERS };
    case 'message':
      return STRING_MEMBERS;
    case 'array':
      return createArrayProperties(itemChildren, 'object');
    case 'number':
    case 'boolean':
    case 'object':
    case 'unknown':
    default:
      return undefined;
  }
}

const COMMON_EQUALITY_OPS = Object.freeze(['==', '!=', 'eq', 'neq', '?:', '? :']);
const COMMON_ORDER_OPS = Object.freeze(['<', '>', '<=', '>=', 'lt', 'gt', 'lte', 'gte']);

/**
 * Map of valid infix operators per data type according to the Horatio specification.
 */
const TYPE_INFIX_OPERATORS_MAP: Record<BloggerDataType, readonly string[]> = Object.freeze({
  boolean: Object.freeze([
    'and',
    'or',
    ...COMMON_EQUALITY_OPS,
  ]),

  number: Object.freeze([
    '+',
    '-',
    '*',
    '/',
    '%',
    ...COMMON_ORDER_OPS,
    ...COMMON_EQUALITY_OPS,
    'in',
  ]),

  string: Object.freeze([
    '+',
    'contains',
    'in',
    'snippet',
    ...COMMON_ORDER_OPS,
    ...COMMON_EQUALITY_OPS,
  ]),

  url: Object.freeze([
    '+',
    'contains',
    'in',
    'snippet',
    'path',
    'params',
    'appendParams',
    'fragment',
    ...COMMON_ORDER_OPS,
    ...COMMON_EQUALITY_OPS,
  ]),

  image: Object.freeze([
    '+',
    'contains',
    'in',
    'snippet',
    'path',
    'params',
    'appendParams',
    'fragment',
    'resizeImage',
    'sourceSet',
    ...COMMON_ORDER_OPS,
    ...COMMON_EQUALITY_OPS,
  ]),

  date: Object.freeze([
    '+',
    'format',
    ...COMMON_ORDER_OPS,
    ...COMMON_EQUALITY_OPS,
  ]),

  locale: Object.freeze([
    '+',
    'contains',
    'in',
    ...COMMON_ORDER_OPS,
    ...COMMON_EQUALITY_OPS,
  ]),

  message: Object.freeze([
    '+',
    'contains',
    'in',
    'snippet',
    ...COMMON_ORDER_OPS,
    ...COMMON_EQUALITY_OPS,
  ]),

  array: Object.freeze([
    'filter',
    'where',
    'map',
    'select',
    'count',
    'first',
    'any',
    'all',
    'none',
    'take',
    'limit',
    'skip',
    'offset',
    'contains',
    ...COMMON_EQUALITY_OPS,
  ]),

  object: Object.freeze([
    ...COMMON_EQUALITY_OPS,
  ]),

  unknown: Object.freeze([
    '+',
    'and',
    'or',
    'contains',
    'in',
    ...COMMON_ORDER_OPS,
    ...COMMON_EQUALITY_OPS,
  ]),
});

/**
 * Returns the set of compatible infix operator names for a given left operand type.
 */
export function getCompatibleOperatorNames(
  leftType: BloggerDataType,
  isLoopContext: boolean = false,
): Set<string> {
  const baseOps = TYPE_INFIX_OPERATORS_MAP[leftType] ?? TYPE_INFIX_OPERATORS_MAP.unknown;
  const result = new Set<string>(baseOps);

  if (isLoopContext && leftType === 'number') {
    result.add('to');
  }

  return result;
}

/**
 * Determines the resulting data type after applying an operator to a left operand.
 */
export function computeOperatorReturnType(
  operatorName: string,
  leftType: BloggerDataType = 'unknown',
  rightType?: BloggerDataType,
): BloggerDataType {
  const normOp = operatorName.toLowerCase();

  switch (normOp) {
    case 'filter':
    case 'where':
    case 'take':
    case 'limit':
    case 'skip':
    case 'offset':
      return leftType === 'unknown' ? 'array' : leftType;

    case 'map':
    case 'select':
      return 'array';

    case 'count':
      return 'number';

    case 'first':
      return 'unknown';

    case 'any':
    case 'all':
    case 'none':
    case 'in':
    case 'contains':
    case 'and':
    case 'or':
    case 'not':
    case '==':
    case '!=':
    case 'eq':
    case 'neq':
    case '<':
    case '>':
    case '<=':
    case '>=':
    case 'lt':
    case 'gt':
    case 'lte':
    case 'gte':
      return 'boolean';

    case 'to':
      return 'array';

    case '-':
    case '*':
    case '/':
    case '%':
      return 'number';

    case '+':
      if (leftType === 'number' && (rightType === undefined || rightType === 'number')) {
        return 'number';
      }
      return 'string';

    case 'snippet':
    case 'format':
    case 'sourceset':
      return 'string';

    case 'resizeimage':
      return 'image';

    case 'path':
    case 'params':
    case 'appendparams':
    case 'fragment':
      return 'url';

    case '?:':
    case '? :':
      return leftType !== 'unknown' ? leftType : (rightType ?? 'unknown');

    default:
      return 'unknown';
  }
}
