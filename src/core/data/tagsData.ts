import type { BloggerTagDefinition } from '../models/types.js';

export const bloggerTags: Record<string, BloggerTagDefinition> = {
  'b:attr': {
    name: 'b:attr',
    description: 'Adds an attribute with its corresponding value to the parent node.',
    selfClosing: true,
    snippetBody: 'b:attr name="${1:name}" value="${2:value}"/>$0',
    attributes: {
      name: { name: 'name', type: 'string', required: true, description: 'The name of the attribute to set on parent node.' },
      value: { name: 'value', type: 'string', required: true, description: 'The value to assign to the attribute.' },
      expr: { name: 'expr', type: 'string', required: false, description: 'Blogger expression evaluating to attribute value.' },
    },
  },
  'b:class': {
    name: 'b:class',
    description: 'Adds or appends CSS classes to the parent node.',
    selfClosing: true,
    snippetBody: 'b:class name="${1:className}"/>$0',
    attributes: {
      name: { name: 'name', type: 'string', required: true, description: 'CSS class name or list of classes to append.' },
    },
  },
  'b:comment': {
    name: 'b:comment',
    description: 'Creates comments that can be rendered or omitted in the client output.',
    selfClosing: false,
    snippetBody: 'b:comment>\n\t$0\n</b:comment>',
  },
  'b:defaultmarkups': {
    name: 'b:defaultmarkups',
    description: 'Configures default markup includes for template widgets.',
    selfClosing: false,
    snippetBody: 'b:defaultmarkups>\n\t<b:defaultmarkup type="${1:Blog}">\n\t\t$0\n\t</b:defaultmarkup>\n</b:defaultmarkups>',
  },
  'b:defaultmarkup': {
    name: 'b:defaultmarkup',
    description: 'Configures default template includes for a specific widget type.',
    selfClosing: false,
    snippetBody: 'b:defaultmarkup type="${1:Blog}">\n\t$0\n</b:defaultmarkup>',
    attributes: {
      type: { name: 'type', type: 'string', required: true, description: 'Widget type to define default markup for.' },
    },
  },
  'b:eval': {
    name: 'b:eval',
    description: 'Evaluates a Blogger expression and explicitly outputs the result.',
    selfClosing: true,
    snippetBody: 'b:eval expr="${1:expression}"/>$0',
    attributes: {
      expr: { name: 'expr', type: 'string', required: true, description: 'Blogger expression to evaluate.' },
    },
  },
  'b:if': {
    name: 'b:if',
    description: 'Renders child content if the condition evaluates to true.',
    selfClosing: false,
    snippetBody: 'b:if cond="${1:condition}">\n\t$0\n</b:if>',
    attributes: {
      cond: { name: 'cond', type: 'string', required: true, description: 'Blogger boolean condition expression.' },
    },
  },
  'b:elseif': {
    name: 'b:elseif',
    description: 'Alternative condition branch inside a b:if block.',
    selfClosing: true,
    snippetBody: 'b:elseif cond="${1:condition}"/>$0',
    attributes: {
      cond: { name: 'cond', type: 'string', required: true, description: 'Blogger boolean condition expression.' },
    },
  },
  'b:else': {
    name: 'b:else',
    description: 'Fallback branch inside a b:if block.',
    selfClosing: true,
    snippetBody: 'b:else/>$0',
  },
  'b:includable': {
    name: 'b:includable',
    description: 'Defines a reusable template section / macro that can be called by b:include.',
    selfClosing: false,
    snippetBody: 'b:includable id="${1:main}" var="${2:this}">\n\t$0\n</b:includable>',
    attributes: {
      id: { name: 'id', type: 'string', required: true, description: 'Unique identifier name for this includable section.' },
      var: { name: 'var', type: 'string', required: false, description: 'Variable parameter name passed to this includable.' },
    },
  },
  'b:include': {
    name: 'b:include',
    description: 'Executes and renders a b:includable section by name.',
    selfClosing: true,
    snippetBody: 'b:include name="${1:main}" data="${2:data}"/>$0',
    attributes: {
      name: { name: 'name', type: 'string', required: true, description: 'ID of the b:includable section to call.' },
      data: { name: 'data', type: 'string', required: false, description: 'Data expression to pass into the includable var parameter.' },
    },
  },
  'b:loop': {
    name: 'b:loop',
    description: 'Iterates through an array expression.',
    selfClosing: false,
    snippetBody: 'b:loop values="${1:data:posts}" var="${2:post}">\n\t$0\n</b:loop>',
    attributes: {
      values: { name: 'values', type: 'string', required: true, description: 'Array data expression to iterate over.' },
      var: { name: 'var', type: 'string', required: true, description: 'Variable name representing the current item in the loop.' },
      index: { name: 'index', type: 'string', required: false, description: 'Variable name for the zero-based iteration index.' },
    },
  },
  'b:message': {
    name: 'b:message',
    description: 'Renders a localized message from the Blogger message dictionary.',
    selfClosing: false,
    snippetBody: 'b:message name="${1:messages.readMore}">\n\t<b:param name="${2:name}" value="${3:value}"/>\n</b:message>$0',
    attributes: {
      name: { name: 'name', type: 'string', required: true, description: 'Name key of the message to render.' },
    },
  },
  'b:section': {
    name: 'b:section',
    description: 'Defines a layout section that can contain b:widget tags.',
    selfClosing: false,
    snippetBody: 'b:section id="${1:main}" maxwidgets="${2:1}">\n\t$0\n</b:section>',
    attributes: {
      id: { name: 'id', type: 'string', required: true, description: 'Unique section container ID.' },
      class: { name: 'class', type: 'string', required: false, description: 'CSS class names for the section wrapper.' },
      maxwidgets: { name: 'maxwidgets', type: 'number', required: false, description: 'Maximum number of widgets allowed in this section.' },
      showaddelement: { name: 'showaddelement', type: 'string', required: false, description: 'Whether to show the Add a Gadget button in layout editor (yes / no).' },
    },
  },
  'b:skin': {
    name: 'b:skin',
    description: 'Contains CSS styles and variables for the Blogger Template Designer.',
    selfClosing: false,
    snippetBody: 'b:skin>\n\t<![CDATA[\n\t\t$0\n\t]]>\n</b:skin>',
  },
  'b:template-skin': {
    name: 'b:template-skin',
    description: 'Contains layout mode specific CSS styles.',
    selfClosing: false,
    snippetBody: 'b:template-skin>\n\t<![CDATA[\n\t\t$0\n\t]]>\n</b:template-skin>',
  },
  'b:switch': {
    name: 'b:switch',
    description: 'Evaluates an expression and switches between b:case branches.',
    selfClosing: false,
    snippetBody: 'b:switch var="${1:data:blog.pageType}">\n\t<b:case value="${2:item}"/>\n\t\t$0\n\t<b:default/>\n</b:switch>',
    attributes: {
      var: { name: 'var', type: 'string', required: true, description: 'Expression to evaluate against cases.' },
    },
  },
  'b:case': {
    name: 'b:case',
    description: 'Branch inside a b:switch statement matching a specific value.',
    selfClosing: true,
    snippetBody: 'b:case value="${1:value}"/>$0',
    attributes: {
      value: { name: 'value', type: 'string', required: true, description: 'Value to match.' },
    },
  },
  'b:default': {
    name: 'b:default',
    description: 'Default fallback branch inside a b:switch statement.',
    selfClosing: true,
    snippetBody: 'b:default/>$0',
  },
  'b:tag': {
    name: 'b:tag',
    description: 'Dynamically generates any HTML tag by name.',
    selfClosing: false,
    snippetBody: 'b:tag name="${1:div}">\n\t$0\n</b:tag>',
    attributes: {
      name: { name: 'name', type: 'string', required: true, description: 'Name of HTML tag to generate.' },
      cond: { name: 'cond', type: 'string', required: false, description: 'Condition under which to emit the tag.' },
    },
  },
  'b:widget': {
    name: 'b:widget',
    description: 'Defines a Blogger widget component.',
    selfClosing: false,
    snippetBody: 'b:widget id="${1:Blog1}" type="${2:Blog}" title="${3:Blog Posts}" locked="${4:false}" version="2">\n\t$0\n</b:widget>',
    attributes: {
      id: { name: 'id', type: 'string', required: true, description: 'Unique widget ID (e.g. Blog1, Header1).' },
      type: { name: 'type', type: 'string', required: true, description: 'Widget type (e.g. Blog, Header, HTML).' },
      title: { name: 'title', type: 'string', required: false, description: 'Widget display title.' },
      locked: { name: 'locked', type: 'string', required: false, description: 'Lock widget position in layout editor (true / false).' },
      version: { name: 'version', type: 'string', required: false, description: 'Widget version number (1 or 2).' },
    },
  },
  'b:widget-settings': {
    name: 'b:widget-settings',
    description: 'Configuration container for a widget settings list.',
    selfClosing: false,
    snippetBody: 'b:widget-settings>\n\t<b:widget-setting name="${1:name}">\n\t\t$0\n\t</b:widget-setting>\n</b:widget-settings>',
  },
  'b:widget-setting': {
    name: 'b:widget-setting',
    description: 'Single setting key-value pair for a widget.',
    selfClosing: false,
    snippetBody: 'b:widget-setting name="${1:name}">\n\t$0\n</b:widget-setting>',
    attributes: {
      name: { name: 'name', type: 'string', required: true, description: 'Setting name identifier.' },
    },
  },
  'b:with': {
    name: 'b:with',
    description: 'Assigns an expression value to a local alias variable scope.',
    selfClosing: false,
    snippetBody: 'b:with value="${1:expression}" var="${2:alias}">\n\t$0\n</b:with>',
    attributes: {
      value: { name: 'value', type: 'string', required: true, description: 'Expression value to bind.' },
      var: { name: 'var', type: 'string', required: true, description: 'Variable name to hold the bound value.' },
    },
  },
};
