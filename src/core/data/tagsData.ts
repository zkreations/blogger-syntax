import type { BloggerTagDefinition } from '../models/types.js';
import { bloggerDefaultMarkupTypes, bloggerWidgetTypes } from './widgetTypes.js';

export const bloggerTags: Record<string, BloggerTagDefinition> = {
  'b:attr': {
    name: 'b:attr',
    description: 'Adds an attribute with its corresponding value to the parent node.',
    snippetBody: 'b:attr name="$1" value="$2"/>$0',
    docUrl: 'https://bloggercode.orbiona.com/2018/02/tag-b-attr.html',
    attributes: {
      name: { name: 'name', type: 'string', required: true, description: 'The name of the attribute to set on parent node.' },
      value: { name: 'value', type: 'string', required: true, description: 'The value to assign to the attribute.' },
      cond: { name: 'cond', type: 'string', required: false, description: 'Conditional expression governing attribute emission.' },
    },
  },
  'b:class': {
    name: 'b:class',
    description: 'Adds or appends CSS classes to the parent node.',
    snippetBody: 'b:class name="$1"/>$0',
    docUrl: 'https://bloggercode.orbiona.com/2018/01/tag-b-class.html',
    attributes: {
      name: { name: 'name', type: 'string', required: true, description: 'CSS class name or list of classes to append.' },
      cond: { name: 'cond', type: 'string', required: false, description: 'Conditional expression governing class emission.' },
    },
  },
  'b:comment': {
    name: 'b:comment',
    description: 'Creates comments that can be rendered or omitted in the client output.',
    snippetBody: 'b:comment>\n\t$0\n</b:comment>',
    docUrl: 'https://bloggercode.orbiona.com/2018/02/tag-b-comments.html',
    attributes: {
      render: { name: 'render', type: 'string', required: false, description: 'When true, renders content as an HTML comment in output instead of omitting it.', values: ['true', 'false'], docUrl: 'https://bloggercode.orbiona.com/2018/02/tag-b-comments.html' },
    },
  },
  'b:defaultmarkups': {
    name: 'b:defaultmarkups',
    description: 'Configures default markup includes for template widgets.',
    snippetBody: 'b:defaultmarkups>\n\t$0\n</b:defaultmarkups>',
    docUrl: 'https://bloggercode.orbiona.com/2017/05/tag-b-defaultmarkups.html',
  },
  'b:defaultmarkup': {
    name: 'b:defaultmarkup',
    description: 'Configures default template includes for a specific widget type.',
    snippetBody: 'b:defaultmarkup type="$1">\n\t$0\n</b:defaultmarkup>',
    docUrl: 'https://bloggercode.orbiona.com/2017/05/tag-b-defaultmarkups.html',
    attributes: {
      type: { name: 'type', type: 'string', required: true, description: 'Widget type to define default markup for.', values: bloggerDefaultMarkupTypes },
    },
  },
  'data:': {
    name: 'data:',
    description: 'Outputs a resolved Blogger data expression directly into output HTML.',
    snippetBody: 'data:${1}/>$0',
    docUrl: 'https://bloggercode.orbiona.com/2016/03/tag-data.html',
  },
  'b:eval': {
    name: 'b:eval',
    description: 'Evaluates a Blogger expression and explicitly outputs the result.',
    snippetBody: 'b:eval expr="$1"/>$0',
    docUrl: [
      'https://support.google.com/blogger/answer/46995#zippy=%2Cevaluated-expressions-beval',
      'https://bloggercode.orbiona.com/2016/03/tag-b-eval.html',
    ],
    attributes: {
      expr: { name: 'expr', type: 'string', required: true, description: 'Blogger expression to evaluate.' },
    },
  },
  'b:if': {
    name: 'b:if',
    description: 'Renders child content if the condition evaluates to true.',
    snippetBody: 'b:if cond="$1">\n\t$0\n</b:if>',
    docUrl: [
      'https://support.google.com/blogger/answer/46995#zippy=%2Cif-elseif-else-bif',
      'https://bloggercode.orbiona.com/2016/03/tag-b-if-b-else-b-elseif.html',
    ],
    attributes: {
      cond: { name: 'cond', type: 'string', required: true, description: 'Blogger boolean condition expression.', docUrl: 'https://bloggercode.orbiona.com/2018/02/attribute-cond.html' },
    },
  },
  'b:elseif': {
    name: 'b:elseif',
    description: 'Alternative condition branch inside a b:if block.',
    snippetBody: 'b:elseif cond="$1"/>$0',
    docUrl: [
      'https://support.google.com/blogger/answer/46995#zippy=%2Cif-elseif-else-bif',
      'https://bloggercode.orbiona.com/2016/03/tag-b-if-b-else-b-elseif.html',
    ],
    attributes: {
      cond: { name: 'cond', type: 'string', required: true, description: 'Blogger boolean condition expression.', docUrl: 'https://bloggercode.orbiona.com/2018/02/attribute-cond.html' },
    },
  },
  'b:else': {
    name: 'b:else',
    description: 'Fallback branch inside a b:if block.',
    snippetBody: 'b:else/>$0',
    docUrl: [
      'https://support.google.com/blogger/answer/46995#zippy=%2Cif-elseif-else-bif',
      'https://bloggercode.orbiona.com/2016/03/tag-b-if-b-else-b-elseif.html',
    ],
  },
  'b:includable': {
    name: 'b:includable',
    description: 'Defines a reusable template section / macro that can be called by b:include.',
    snippetBody: 'b:includable id="$1">\n\t$0\n</b:includable>',
    docUrl: [
      'https://support.google.com/blogger/answer/46995#zippy=%2Cincludes-binclude',
      'https://bloggercode.orbiona.com/2016/03/tag-b-includable-b-include.html',
    ],
    attributes: {
      id: { name: 'id', type: 'string', required: true, description: 'Unique identifier name for this includable section.' },
      var: { name: 'var', type: 'string', required: false, description: 'Variable parameter name passed to this includable.' },
    },
  },
  'b:include': {
    name: 'b:include',
    description: 'Executes and renders a b:includable section by name.',
    snippetBody: 'b:include name="$1"/>$0',
    docUrl: [
      'https://support.google.com/blogger/answer/46995#zippy=%2Cincludes-binclude',
      'https://bloggercode.orbiona.com/2016/03/tag-b-includable-b-include.html',
    ],
    attributes: {
      name: { name: 'name', type: 'string', required: true, description: 'ID of the b:includable section to call.' },
      data: { name: 'data', type: 'string', required: false, description: 'Data expression to pass into the includable var parameter.', docUrl: 'https://bloggercode.orbiona.com/2018/02/attribute-data.html' },
      cond: { name: 'cond', type: 'string', required: false, description: 'Conditional expression governing subroutine execution.' },
    },
  },
  'b:loop': {
    name: 'b:loop',
    description: 'Iterates through an array expression.',
    snippetBody: 'b:loop values="$1" var="$2">\n\t$0\n</b:loop>',
    docUrl: [
      'https://support.google.com/blogger/answer/46995#zippy=%2Cloops-bloop',
      'https://bloggercode.orbiona.com/2016/03/tag-b-loop.html',
    ],
    attributes: {
      values: { name: 'values', type: 'string', required: true, description: 'Array data expression to iterate over.' },
      var: { name: 'var', type: 'string', required: true, description: 'Variable name representing the current item in the loop.' },
      index: { name: 'index', type: 'string', required: false, description: 'Variable name for the zero-based iteration index.', docUrl: 'https://bloggercode.orbiona.com/2021/10/attribute-index.html' },
      reverse: { name: 'reverse', type: 'string', required: false, description: 'Whether to iterate the collection in reverse order (true / false).', values: ['true', 'false'], docUrl: 'https://bloggercode.orbiona.com/2016/03/tag-b-loop.html' },
    },
  },
  'b:message': {
    name: 'b:message',
    description: 'Renders a localized message from the Blogger message dictionary.',
    snippetBody: 'b:message name="$1"/>$0',
    docUrl: 'https://bloggercode.orbiona.com/2018/02/tag-b-message-b-param.html',
    attributes: {
      name: { name: 'name', type: 'string', required: true, description: 'Name key of the message to render.' },
    },
  },
  'b:param': {
    name: 'b:param',
    description: 'Passes a parameter value to a parent b:message tag.',
    snippetBody: 'b:param name="$1" value="$2"/>$0',
    docUrl: 'https://bloggercode.orbiona.com/2018/02/tag-b-message-b-param.html',
    attributes: {
      name: { name: 'name', type: 'string', required: true, description: 'Parameter name identifier matching the placeholder in the message.' },
      value: { name: 'value', type: 'string', required: true, description: 'Value to substitute for the parameter.' },
    },
  },
  'b:section': {
    name: 'b:section',
    description: 'Defines a layout section that can contain b:widget tags.',
    snippetBody: 'b:section id="$1">\n\t$0\n</b:section>',
    docUrl: [
      'https://support.google.com/blogger/answer/46888',
      'https://bloggercode.orbiona.com/2016/03/tag-b-section.html',
    ],
    attributes: {
      id: { name: 'id', type: 'string', required: true, description: 'Unique section container ID.' },
      class: { name: 'class', type: 'string', required: false, description: 'CSS class names for the section wrapper.' },
      tag: { name: 'tag', type: 'string', required: false, description: 'Semantic HTML5 container element to generate for the section (e.g. main, aside, header, footer).', values: ['main', 'section', 'article', 'aside', 'header', 'footer', 'nav', 'div'], docUrl: 'https://bloggercode.orbiona.com/2016/03/tag-b-section.html' },
      name: { name: 'name', type: 'string', required: false, description: 'Display label for the section in Blogger layout editor.' },
      showaddelement: { name: 'showaddelement', type: 'string', required: false, description: 'Whether to show the Add a Gadget button in layout editor (yes / no).', values: ['yes', 'no'] },
      preferred: { name: 'preferred', type: 'string', required: false, description: 'Designates this section as preferred target for new gadgets in layout editor (yes / no).', values: ['yes', 'no'] },
      cond: { name: 'cond', type: 'string', required: false, description: 'Conditional expression governing section rendering.' },
    },
  },
  'b:skin': {
    name: 'b:skin',
    description: 'Contains CSS styles and variables for the Blogger Template Designer.',
    snippetBody: 'b:skin>\n\t<![CDATA[\n\t\t$0\n\t]]>\n</b:skin>',
    docUrl: [
      'https://support.google.com/blogger/answer/46871',
      'https://bloggercode.orbiona.com/2014/06/tag-b-skin-b-template-skin.html',
    ],
  },
  'b:template-skin': {
    name: 'b:template-skin',
    description: 'Contains layout mode specific CSS styles.',
    snippetBody: 'b:template-skin>\n\t<![CDATA[\n\t\t$0\n\t]]>\n</b:template-skin>',
    docUrl: 'https://bloggercode.orbiona.com/2014/06/tag-b-skin-b-template-skin.html',
  },
  'b:template-script': {
    name: 'b:template-script',
    description: 'Declares and asynchronously initializes Blogger platform scripts in Layouts v3.',
    snippetBody: 'b:template-script name="$1"/>$0',
    docUrl: 'https://bloggercode.orbiona.com/2018/02/tag-b-template-script.html',
    attributes: {
      name: { name: 'name', type: 'string', required: true, description: 'Registered platform script identifier.' },
    },
  },
  'b:switch': {
    name: 'b:switch',
    description: 'Evaluates an expression and switches between b:case branches.',
    snippetBody: 'b:switch var="$1">\n\t$0\n</b:switch>',
    docUrl: [
      'https://support.google.com/blogger/answer/46995#zippy=%2Cswitches-bswitch',
      'https://bloggercode.orbiona.com/2016/03/tag-b-switch-b-case-b-default.html',
    ],
    attributes: {
      var: { name: 'var', type: 'string', required: true, description: 'Expression to evaluate against cases.' },
    },
  },
  'b:case': {
    name: 'b:case',
    description: 'Branch inside a b:switch statement matching a specific value.',
    snippetBody: 'b:case value="$1"/>$0',
    docUrl: [
      'https://support.google.com/blogger/answer/46995#zippy=%2Cswitches-bswitch',
      'https://bloggercode.orbiona.com/2016/03/tag-b-switch-b-case-b-default.html',
    ],
    attributes: {
      value: { name: 'value', type: 'string', required: true, description: 'Value to match.' },
    },
  },
  'b:default': {
    name: 'b:default',
    description: 'Default fallback branch inside a b:switch statement.',
    snippetBody: 'b:default/>$0',
    docUrl: [
      'https://support.google.com/blogger/answer/46995#zippy=%2Cswitches-bswitch',
      'https://bloggercode.orbiona.com/2016/03/tag-b-switch-b-case-b-default.html',
    ],
  },
  'b:tag': {
    name: 'b:tag',
    description: 'Dynamically generates any HTML tag by name.',
    snippetBody: 'b:tag name="$1">\n\t$0\n</b:tag>',
    docUrl: 'https://bloggercode.orbiona.com/2018/02/tags-b-tag.html',
    attributes: {
      name: { name: 'name', type: 'string', required: true, description: 'Name of HTML tag to generate.' },
      cond: { name: 'cond', type: 'string', required: false, description: 'Condition under which to emit the tag.', docUrl: 'https://bloggercode.orbiona.com/2018/02/attribute-cond.html' },
    },
  },
  'b:widget': {
    name: 'b:widget',
    description: 'Defines a Blogger widget component.',
    snippetBody: 'b:widget id="$1" type="$2" title="$3">\n\t$0\n</b:widget>',
    docUrl: [
      'https://support.google.com/blogger/answer/46888',
      'https://bloggercode.orbiona.com/2016/03/tag-b-widget.html',
    ],
    attributes: {
      id: { name: 'id', type: 'string', required: true, description: 'Unique widget ID (e.g. Blog1, Header1).' },
      type: { name: 'type', type: 'string', required: true, description: 'Widget type (e.g. Blog, Header, HTML).', values: bloggerWidgetTypes },
      title: { name: 'title', type: 'string', required: true, description: 'Widget display title.' },
      locked: { name: 'locked', type: 'string', required: false, description: 'Lock widget position in layout editor (true / false).', docUrl: 'https://bloggercode.orbiona.com/2021/10/attribute-locked.html', values: ['true', 'false'] },
      version: { name: 'version', type: 'string', required: false, description: 'Widget syntax version (1 or 2).', values: ['1', '2'] },
      cond: { name: 'cond', type: 'string', required: false, description: 'Conditional expression governing widget rendering.' },
      visible: { name: 'visible', type: 'string', required: false, description: 'Widget visibility in layout editor (true / false).', values: ['true', 'false'] },
    },
  },
  'b:widget-settings': {
    name: 'b:widget-settings',
    description: 'Configuration container for a widget settings list.',
    snippetBody: 'b:widget-settings>\n\t$0\n</b:widget-settings>',
    docUrl: 'https://bloggercode.orbiona.com/2018/02/tags-b-widget-settings.html',
  },
  'b:widget-setting': {
    name: 'b:widget-setting',
    description: 'Single setting key-value pair for a widget.',
    snippetBody: 'b:widget-setting name="$1">\n\t$0\n</b:widget-setting>',
    docUrl: 'https://bloggercode.orbiona.com/2018/02/tags-b-widget-settings.html',
    attributes: {
      name: { name: 'name', type: 'string', required: true, description: 'Setting name identifier.' },
    },
  },
  'b:with': {
    name: 'b:with',
    description: 'Assigns an expression value to a local alias variable scope.',
    snippetBody: 'b:with value="$1" var="$2">\n\t$0\n</b:with>',
    docUrl: [
      'https://support.google.com/blogger/answer/46995#zippy=%2Cvariable-alias-bwith',
      'https://bloggercode.orbiona.com/2016/03/tag-b-with.html',
    ],
    attributes: {
      value: { name: 'value', type: 'string', required: true, description: 'Expression value to bind.' },
      var: { name: 'var', type: 'string', required: true, description: 'Variable name to hold the bound value.' },
    },
  },
  'Group': {
    name: 'Group',
    description: 'Groups variables and creates a section in the Blogger Template Designer.',
    snippetBody: 'Group description="$1">\n\t$0\n</Group>',
    docUrl: 'https://bloggercode.orbiona.com/2014/06/tag-b-skin-b-template-skin.html',
    attributes: {
      description: { name: 'description', type: 'string', required: true, description: 'Variable group description in Template Designer.' },
      selector: { name: 'selector', type: 'string', required: false, description: 'CSS selector targeted by the variable group.' },
    },
  },
  'Variable': {
    name: 'Variable',
    description: 'Creates customization options for the Blogger Template Designer.',
    snippetBody: 'Variable name="$1" description="$2" type="$3" default="$4" value="$5"/>$0',
    docUrl: 'https://bloggercode.orbiona.com/2014/06/tag-b-skin-b-template-skin.html',
    attributes: {
      name: { name: 'name', type: 'string', required: true, description: 'Unique variable identifier name.' },
      description: { name: 'description', type: 'string', required: true, description: 'Variable label shown in Template Designer.' },
      type: { name: 'type', type: 'string', required: true, description: 'Variable type (color, font, length, background, string, url).' },
      default: { name: 'default', type: 'string', required: true, description: 'Default CSS value.' },
      value: { name: 'value', type: 'string', required: true, description: 'Current CSS value.' },
      color: { name: 'color', type: 'string', required: false, description: 'Base color code or $color reference for background variable.' },
      family: { name: 'family', type: 'string', required: false, description: 'Font family list for font variable.' },
      size: { name: 'size', type: 'string', required: false, description: 'Font size with CSS unit for font variable.' },
      min: { name: 'min', type: 'string', required: false, description: 'Minimum value boundary for length variable.' },
      max: { name: 'max', type: 'string', required: false, description: 'Maximum value boundary for length variable.' },
      hideEditor: { name: 'hideEditor', type: 'string', required: false, description: 'Whether to hide the control in Theme Designer UI (true / false).' },
    },
  },
};
