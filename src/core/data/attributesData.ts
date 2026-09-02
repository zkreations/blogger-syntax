import type { BloggerTagAttribute } from '../models/types.js';

export const bloggerCommonAttributes: Record<string, BloggerTagAttribute> = {
  cond: {
    name: 'cond',
    type: 'string',
    description: 'Conditional expression.',
    docUrl: 'https://bloggercode.orbiona.com/2018/02/attribute-cond.html',
  },
  data: {
    name: 'data',
    type: 'string',
    description: 'Define a dataset to be transmitted to the child nodes.',
    docUrl: 'https://bloggercode.orbiona.com/2018/02/attribute-data.html',
  },
  index: {
    name: 'index',
    type: 'string',
    description: 'Index variable name for the current iteration in a b:loop.',
    docUrl: 'https://bloggercode.orbiona.com/2021/10/attribute-index.html',
  },
  locked: {
    name: 'locked',
    type: 'string',
    description: 'Prevents the widget from being removed in the Layout editor.',
    docUrl: 'https://bloggercode.orbiona.com/2021/10/attribute-locked.html',
  },
  maxwidgets: {
    name: 'maxwidgets',
    type: 'number',
    description: 'Maximum number of widgets allowed in a b:section.',
    docUrl: 'https://bloggercode.orbiona.com/2021/11/attribute-maxwidgets.html',
  },
  var: {
    name: 'var',
    type: 'string',
    description: 'Variable name parameter for the loop, includable, or with scope.',
  },
  values: {
    name: 'values',
    type: 'string',
    description: 'Array data expression to iterate over in a b:loop.',
    docUrl: 'https://bloggercode.orbiona.com/2016/03/tag-b-loop.html',
  },
  value: {
    name: 'value',
    type: 'string',
    description: 'Value to assign to the attribute or compare against in b:case.',
  },
  name: {
    name: 'name',
    type: 'string',
    description: 'The name identifier for the tag, attribute, or message key.',
  },
  id: {
    name: 'id',
    type: 'string',
    description: 'Unique section, widget, or includable identifier ID.',
  },
  type: {
    name: 'type',
    type: 'string',
    description: 'Widget or markup type (e.g. Blog, Header, HTML).',
  },
  title: {
    name: 'title',
    type: 'string',
    description: 'Display title for widget component.',
  },
  version: {
    name: 'version',
    type: 'number',
    description: 'Widget syntax version (1 or 2).',
  },
  showaddelement: {
    name: 'showaddelement',
    type: 'string',
    description: 'Whether to show the Add a Gadget button in layout editor (yes / no).',
  },
  class: {
    name: 'class',
    type: 'string',
    description: 'CSS class names for the section or tag wrapper.',
  },
  default: {
    name: 'default',
    type: 'string',
    description: 'Default CSS value for the skin variable.',
  },
  description: {
    name: 'description',
    type: 'string',
    description: 'User-friendly label shown in the Blogger Template Designer.',
  },
  selector: {
    name: 'selector',
    type: 'string',
    description: 'CSS selector targeted by the variable group.',
  },
  family: {
    name: 'family',
    type: 'string',
    description: 'Specifies the font family for font(skin) variable.',
    docUrl: 'https://bloggercode.orbiona.com/2016/09/skin-type-font.html',
  },
  size: {
    name: 'size',
    type: 'string',
    description: 'Specifies the font size for font(skin) variable.',
    docUrl: 'https://bloggercode.orbiona.com/2016/09/skin-type-font.html',
  },
  min: {
    name: 'min',
    type: 'string',
    description: 'Minimum value accepted by a length(skin) variable.',
    docUrl: 'https://bloggercode.orbiona.com/2016/09/skin-type-length.html',
  },
  max: {
    name: 'max',
    type: 'string',
    description: 'Maximum value accepted by a length(skin) variable.',
    docUrl: 'https://bloggercode.orbiona.com/2016/09/skin-type-length.html',
  },
  color: {
    name: 'color',
    type: 'string',
    description: 'Color code or $color reference for background(skin) variable.',
    docUrl: 'https://bloggercode.orbiona.com/2016/09/skin-type-background.html',
  },
  hideEditor: {
    name: 'hideEditor',
    type: 'string',
    description: 'Hides or forces display of variable control in Template Designer (true or false).',
  },
  expr: {
    name: 'expr',
    type: 'string',
    description: 'Blogger expression evaluating to attribute value.',
    docUrl: [
      'https://support.google.com/blogger/answer/46995#zippy=%2Cattribute-expressions-expr',
      'https://bloggercode.orbiona.com/2016/03/prefix-expr.html',
    ],
  },
};

export const bloggerExprPrefixInfo = {
  name: 'expr:*',
  type: 'Attribute Prefix',
  description: 'Evaluates a Blogger expression and assigns the result to the attribute.',
  docUrl: [
    'https://support.google.com/blogger/answer/46995#zippy=%2Cattribute-expressions-expr',
    'https://bloggercode.orbiona.com/2016/03/prefix-expr.html',
  ],
} as const;
