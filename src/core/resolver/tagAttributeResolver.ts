import type {
  BloggerDataType,
  BloggerSuggestion,
  BloggerTagAttribute,
  BloggerTagDefinition,
} from '../models/types.js';
import { getSpecCatalog } from 'blogger-spec/catalogs';
import { isStrictlySelfClosingTag } from 'blogger-spec/parser';

export const bloggerSkinVariableTypes = [
  'color',
  'font',
  'length',
  'background',
  'string',
  'url',
  'automatic',
] as const;

export type BloggerSkinVariableType = (typeof bloggerSkinVariableTypes)[number];

export interface BloggerSkinVariableTypeDetail {
  readonly type: BloggerSkinVariableType;
  readonly skinTypeLabel: string;
  readonly description: string;
  readonly example: string;
  readonly snippetBody: string;
  readonly attributes: Record<string, BloggerTagAttribute>;
}

export const bloggerSkinVariableTypeDetails: Record<BloggerSkinVariableType, BloggerSkinVariableTypeDetail> = {
  color: {
    type: 'color',
    skinTypeLabel: 'color(skin)',
    description: 'Defines a color skin variable for Blogger Template Designer CSS.',
    example: '<Variable name="text.color" description="Text Color" type="color" default="#333333" value="#333333" hideEditor="false"/>',
    snippetBody: 'Variable name="$1" description="$2" type="color" default="$3" value="$4"/>$0',
    attributes: {
      name: { name: 'name', type: 'string', required: true, description: 'Unique variable identifier name. Letters, numbers, and dots are allowed.' },
      description: { name: 'description', type: 'string', required: true, description: 'Variable label shown in Template Designer.' },
      type: { name: 'type', type: 'string', required: true, description: 'Variable type: color(skin).' },
      default: { name: 'default', type: 'string', required: true, description: 'Default color value (hex, rgb, rgba).' },
      value: { name: 'value', type: 'string', required: true, description: 'Current color value.' },
      hideEditor: { name: 'hideEditor', type: 'string', required: false, description: 'Hides the variable form in the design tool (true or false).' },
    },
  },
  font: {
    type: 'font',
    skinTypeLabel: 'font(skin)',
    description: 'Defines a font skin variable with font family, size, and styling options.',
    example: '<Variable name="body.font" description="Body Font" type="font" family="Arial, sans-serif" size="14px" default="normal normal 14px Arial, sans-serif" value="normal normal 14px Arial, sans-serif" hideEditor="false"/>',
    snippetBody: 'Variable name="$1" description="$2" type="font" default="$3" value="$4"/>$0',
    attributes: {
      name: { name: 'name', type: 'string', required: true, description: 'Unique variable identifier name. Letters, numbers, and dots are allowed.' },
      description: { name: 'description', type: 'string', required: true, description: 'Variable label shown in Template Designer.' },
      type: { name: 'type', type: 'string', required: true, description: 'Variable type: font(skin).' },
      family: { name: 'family', type: 'string', required: false, description: 'Specifies the font family (e.g. Arial, "Roboto", sans-serif).' },
      size: { name: 'size', type: 'string', required: false, description: 'Specifies the font size (e.g. 14px, 1rem).' },
      default: { name: 'default', type: 'string', required: true, description: 'Default font value.' },
      value: { name: 'value', type: 'string', required: true, description: 'Current font value.' },
      hideEditor: { name: 'hideEditor', type: 'string', required: false, description: 'Hides the variable form in the design tool (true or false).' },
    },
  },
  length: {
    type: 'length',
    skinTypeLabel: 'length(skin)',
    description: 'Defines a length / dimension skin variable with optional min and max boundaries.',
    example: '<Variable name="content.width" description="Content Width" type="length" min="600px" max="1200px" default="960px" value="960px" hideEditor="false"/>',
    snippetBody: 'Variable name="$1" description="$2" type="length" default="$3" value="$4"/>$0',
    attributes: {
      name: { name: 'name', type: 'string', required: true, description: 'Unique variable identifier name. Letters, numbers, and dots are allowed.' },
      description: { name: 'description', type: 'string', required: true, description: 'Variable label shown in Template Designer.' },
      type: { name: 'type', type: 'string', required: true, description: 'Variable type: length(skin).' },
      min: { name: 'min', type: 'string', required: false, description: 'Minimum value accepted by length(skin) variable.' },
      max: { name: 'max', type: 'string', required: false, description: 'Maximum value accepted by length(skin) variable.' },
      default: { name: 'default', type: 'string', required: true, description: 'Default length value (must be within min and max).' },
      value: { name: 'value', type: 'string', required: true, description: 'Current length value (must be within min and max).' },
      hideEditor: { name: 'hideEditor', type: 'string', required: false, description: 'Hides or forces display of variable form in design tool (true or false).' },
    },
  },
  background: {
    type: 'background',
    skinTypeLabel: 'background(skin)',
    description: 'Defines a background skin variable containing color, image url, alignment, or positioning.',
    example: '<Variable name="body.background" description="Body Background" type="background" color="#ffffff" default="$(color) url(https://...) repeat fixed top left" value="$(color) url(https://...) repeat fixed top left"/>',
    snippetBody: 'Variable name="$1" description="$2" type="background" default="$3" value="$4"/>$0',
    attributes: {
      name: { name: 'name', type: 'string', required: true, description: 'Unique variable identifier name. Letters, numbers, and dots are allowed.' },
      description: { name: 'description', type: 'string', required: true, description: 'Variable label shown in Template Designer.' },
      type: { name: 'type', type: 'string', required: true, description: 'Variable type: background(skin).' },
      color: { name: 'color', type: 'string', required: false, description: 'Background color code or $color variable reference.' },
      default: { name: 'default', type: 'string', required: true, description: 'Default background CSS value.' },
      value: { name: 'value', type: 'string', required: true, description: 'Current background CSS value.' },
      hideEditor: { name: 'hideEditor', type: 'string', required: false, description: 'Hides the variable form in the design tool (true or false).' },
    },
  },
  string: {
    type: 'string',
    skinTypeLabel: 'string(skin)',
    description: 'Defines a string skin variable for text or custom CSS values. Note: Distinct from runtime data:string.',
    example: '<Variable name="custom.text" description="Custom Text" type="string" default="Sample text" value="Sample text"/>',
    snippetBody: 'Variable name="$1" description="$2" type="string" default="$3" value="$4"/>$0',
    attributes: {
      name: { name: 'name', type: 'string', required: true, description: 'Unique variable identifier name. Letters, numbers, and dots are allowed.' },
      description: { name: 'description', type: 'string', required: true, description: 'Variable label shown in Template Designer.' },
      type: { name: 'type', type: 'string', required: true, description: 'Variable type: string(skin) (template skin variable, distinct from runtime data:string).' },
      default: { name: 'default', type: 'string', required: false, description: 'Default string value.' },
      value: { name: 'value', type: 'string', required: true, description: 'Current string value.' },
      hideEditor: { name: 'hideEditor', type: 'string', required: false, description: 'Hides the variable form in the design tool (true or false).' },
    },
  },
  url: {
    type: 'url',
    skinTypeLabel: 'url(skin)',
    description: 'Defines a URL skin variable containing an image or resource URL. Note: Distinct from runtime data:url.',
    example: '<Variable name="header.image" description="Header Image" type="url" default="url(https://...)" value="url(https://...)"/>',
    snippetBody: 'Variable name="$1" description="$2" type="url" default="$3" value="$4"/>$0',
    attributes: {
      name: { name: 'name', type: 'string', required: true, description: 'Unique variable identifier name. Letters, numbers, and dots are allowed.' },
      description: { name: 'description', type: 'string', required: true, description: 'Variable label shown in Template Designer.' },
      type: { name: 'type', type: 'string', required: true, description: 'Variable type: url(skin) (template skin variable, distinct from runtime data:url).' },
      default: { name: 'default', type: 'string', required: true, description: 'Default URL value (typically wrapped in url(...)).' },
      value: { name: 'value', type: 'string', required: true, description: 'Current URL value (typically wrapped in url(...)).' },
      hideEditor: { name: 'hideEditor', type: 'string', required: false, description: 'Hides the variable form in the design tool (true or false).' },
    },
  },
  automatic: {
    type: 'automatic',
    skinTypeLabel: 'automatic(skin)',
    description: 'Defines an automatic skin variable computed or generated automatically by the theme engine.',
    example: '<Variable name="body.rule" description="Body Rule" type="automatic" default="" value=""/>',
    snippetBody: 'Variable name="$1" description="$2" type="automatic" default="$3" value="$4"/>$0',
    attributes: {
      name: { name: 'name', type: 'string', required: true, description: 'Unique variable identifier name. Letters, numbers, and dots are allowed.' },
      description: { name: 'description', type: 'string', required: true, description: 'Variable label shown in Template Designer.' },
      type: { name: 'type', type: 'string', required: true, description: 'Variable type: automatic(skin).' },
      default: { name: 'default', type: 'string', required: false, description: 'Default automatic variable value.' },
      value: { name: 'value', type: 'string', required: true, description: 'Current automatic variable value.' },
      hideEditor: { name: 'hideEditor', type: 'string', required: false, description: 'Hides the variable form in the design tool (true or false).' },
    },
  },
};

export const bloggerSkinVariableTags: readonly BloggerTagDefinition[] = Object.freeze(
  bloggerSkinVariableTypes.map((type) => {
    const detail = bloggerSkinVariableTypeDetails[type];
    return {
      name: `Variable (${type})`,
      description: detail.description,
      detail: detail.skinTypeLabel,
      snippetBody: detail.snippetBody,
      attributes: detail.attributes,
      example: detail.example,
    };
  }),
);

export interface TagAttributeContext {
  readonly tagName: string;
  readonly typedPrefix: string;
  readonly existingAttrs: ReadonlySet<string>;
}

const specCatalog = getSpecCatalog();

const catalogWidgets = Object.keys(specCatalog.getAllWidgets());
const bloggerDefaultMarkupTypes = ['All', 'Common', ...catalogWidgets];
const bloggerWidgetTypes = catalogWidgets;

export const bloggerCommonAttributes: Record<string, BloggerTagAttribute> = {
  cond: {
    name: 'cond',
    type: 'string',
    description: 'Conditional expression.',
  },
  data: {
    name: 'data',
    type: 'string',
    description: 'Define a dataset to be transmitted to the child nodes.',
  },
  index: {
    name: 'index',
    type: 'string',
    description: 'Index variable name for the current iteration in a b:loop.',
  },
  locked: {
    name: 'locked',
    type: 'string',
    description: 'Prevents the widget from being removed in the Layout editor.',
  },
  maxwidgets: {
    name: 'maxwidgets',
    type: 'number',
    description: 'Maximum number of widgets allowed in a b:section.',
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
    description: 'Type identifier for the widget or default markup.',
  },
  reverse: {
    name: 'reverse',
    type: 'string',
    description: 'Whether to iterate the collection in reverse order (true or false).',
  },
  render: {
    name: 'render',
    type: 'string',
    description: 'When true, renders content as an HTML comment in output instead of omitting it.',
  },
  expr: {
    name: 'expr',
    type: 'string',
    description: 'Blogger expression evaluating to attribute value.',
  },
};

export const bloggerExprPrefixInfo = {
  name: 'expr:*',
  type: 'Attribute Prefix',
  description: 'Evaluates a Blogger expression and assigns the result to the attribute.',
} as const;

export const bloggerTags: Record<string, BloggerTagDefinition> = {
  'b:attr': {
    name: 'b:attr',
    description: 'Adds an attribute with its corresponding value to the parent node.',
    snippetBody: 'b:attr name="$1" value="$2"/>$0',
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
    attributes: {
      name: { name: 'name', type: 'string', required: true, description: 'CSS class name or list of classes to append.' },
      cond: { name: 'cond', type: 'string', required: false, description: 'Conditional expression governing class emission.' },
    },
  },
  'b:comment': {
    name: 'b:comment',
    description: 'Creates comments that can be rendered or omitted in the client output.',
    snippetBody: 'b:comment>\n\t$0\n</b:comment>',
    attributes: {
      render: { name: 'render', type: 'string', required: false, description: 'When true, renders content as an HTML comment in output instead of omitting it.', values: ['true', 'false'] },
    },
  },
  'b:defaultmarkups': {
    name: 'b:defaultmarkups',
    description: 'Configures default markup includes for template widgets.',
    snippetBody: 'b:defaultmarkups>\n\t$0\n</b:defaultmarkups>',
  },
  'b:defaultmarkup': {
    name: 'b:defaultmarkup',
    description: 'Configures default template includes for a specific widget type.',
    snippetBody: 'b:defaultmarkup type="$1">\n\t$0\n</b:defaultmarkup>',
    attributes: {
      type: { name: 'type', type: 'string', required: true, description: 'Widget type to define default markup for.', values: bloggerDefaultMarkupTypes },
    },
  },
  'data:': {
    name: 'data:',
    description: 'Outputs a resolved Blogger data expression directly into output HTML.',
    snippetBody: 'data:${1}/>$0',
  },
  'CDATA': {
    name: 'CDATA',
    description: 'Character data block escaping XML parsing, used for scripts and CSS styles within <b:skin> or <b:template-skin>.',
    snippetBody: '<![CDATA[\n\t$0\n]]>',
  },
  'b:eval': {
    name: 'b:eval',
    description: 'Evaluates a Blogger expression and explicitly outputs the result.',
    snippetBody: 'b:eval expr="$1"/>$0',
    attributes: {
      expr: { name: 'expr', type: 'string', required: true, description: 'Blogger expression to evaluate.' },
    },
  },
  'b:if': {
    name: 'b:if',
    description: 'Renders child content if the condition evaluates to true.',
    snippetBody: 'b:if cond="$1">\n\t$0\n</b:if>',
    attributes: {
      cond: { name: 'cond', type: 'string', required: true, description: 'Blogger boolean condition expression.' },
    },
  },
  'b:elseif': {
    name: 'b:elseif',
    description: 'Alternative condition branch inside a b:if block.',
    snippetBody: 'b:elseif cond="$1"/>$0',
    attributes: {
      cond: { name: 'cond', type: 'string', required: true, description: 'Blogger boolean condition expression.' },
    },
  },
  'b:else': {
    name: 'b:else',
    description: 'Fallback branch inside a b:if block.',
    snippetBody: 'b:else/>$0',
  },
  'b:includable': {
    name: 'b:includable',
    description: 'Defines a reusable template section / macro that can be called by b:include.',
    snippetBody: 'b:includable id="$1">\n\t$0\n</b:includable>',
    attributes: {
      id: { name: 'id', type: 'string', required: true, description: 'Unique identifier name for this includable section.' },
      var: { name: 'var', type: 'string', required: false, description: 'Variable parameter name passed to this includable.' },
    },
  },
  'b:include': {
    name: 'b:include',
    description: 'Executes and renders a b:includable section by name.',
    snippetBody: 'b:include name="$1"/>$0',
    attributes: {
      name: { name: 'name', type: 'string', required: true, description: 'ID of the b:includable section to call.' },
      data: { name: 'data', type: 'string', required: false, description: 'Data expression to pass into the includable var parameter.' },
      cond: { name: 'cond', type: 'string', required: false, description: 'Conditional expression governing subroutine execution.' },
    },
  },
  'b:loop': {
    name: 'b:loop',
    description: 'Iterates through an array expression.',
    snippetBody: 'b:loop values="$1" var="$2">\n\t$0\n</b:loop>',
    attributes: {
      values: { name: 'values', type: 'string', required: true, description: 'Array data expression to iterate over.' },
      var: { name: 'var', type: 'string', required: true, description: 'Variable name representing the current item in the loop.' },
      index: { name: 'index', type: 'string', required: false, description: 'Variable name for the zero-based iteration index.' },
      reverse: { name: 'reverse', type: 'string', required: false, description: 'Whether to iterate the collection in reverse order (true / false).', values: ['true', 'false'] },
    },
  },
  'b:message': {
    name: 'b:message',
    description: 'Renders a localized message from the Blogger message dictionary.',
    snippetBody: 'b:message name="$1"/>$0',
    attributes: {
      name: { name: 'name', type: 'string', required: true, description: 'Name key of the message to render.' },
    },
  },
  'b:param': {
    name: 'b:param',
    description: 'Passes a parameter value to a parent b:message tag.',
    snippetBody: 'b:param name="$1" value="$2"/>$0',
    attributes: {
      name: { name: 'name', type: 'string', required: true, description: 'Parameter name identifier matching the placeholder in the message.' },
      value: { name: 'value', type: 'string', required: true, description: 'Value to substitute for the parameter.' },
    },
  },
  'b:section': {
    name: 'b:section',
    description: 'Defines a layout section that can contain b:widget tags.',
    snippetBody: 'b:section id="$1">\n\t$0\n</b:section>',
    attributes: {
      id: { name: 'id', type: 'string', required: true, description: 'Unique section container ID.' },
      class: { name: 'class', type: 'string', required: false, description: 'CSS class names for the section wrapper.' },
      tag: { name: 'tag', type: 'string', required: false, description: 'Semantic HTML5 container element to generate for the section (e.g. main, aside, header, footer).', values: ['main', 'section', 'article', 'aside', 'header', 'footer', 'nav', 'div'] },
      name: { name: 'name', type: 'string', required: false, description: 'Display label for the section in Blogger layout editor.' },
      showaddelement: { name: 'showaddelement', type: 'string', required: false, description: 'Whether to show the Add a Gadget button in layout editor (yes / no).', values: ['yes', 'no'] },
      preferred: { name: 'preferred', type: 'string', required: false, description: 'Designates this section as preferred target for new gadgets in layout editor (yes / no).', values: ['yes', 'no'] },
      cond: { name: 'cond', type: 'string', required: false, description: 'Conditional expression governing section rendering.' },
      ads: { name: 'ads', type: 'string', required: false, description: 'Designates whether the section is reserved exclusively for AdSense ads (true / false).', values: ['true', 'false'] },
    },
  },
  'b:skin': {
    name: 'b:skin',
    description: 'Contains CSS styles and variables for the Blogger Template Designer.',
    snippetBody: 'b:skin>\n\t<![CDATA[\n\t\t$0\n\t]]>\n</b:skin>',
  },
  'b:template-skin': {
    name: 'b:template-skin',
    description: 'Contains layout mode specific CSS styles.',
    snippetBody: 'b:template-skin>\n\t<![CDATA[\n\t\t$0\n\t]]>\n</b:template-skin>',
  },
  'b:template-script': {
    name: 'b:template-script',
    description: 'Declares and asynchronously initializes Blogger platform scripts in Layouts v3.',
    snippetBody: 'b:template-script name="$1"/>$0',
    attributes: {
      name: { name: 'name', type: 'string', required: true, description: 'Registered platform script identifier.' },
    },
  },
  'b:switch': {
    name: 'b:switch',
    description: 'Evaluates an expression and switches between b:case branches.',
    snippetBody: 'b:switch var="$1">\n\t$0\n</b:switch>',
    attributes: {
      var: { name: 'var', type: 'string', required: true, description: 'Expression to evaluate against cases.' },
    },
  },
  'b:case': {
    name: 'b:case',
    description: 'Branch inside a b:switch statement matching a specific value.',
    snippetBody: 'b:case value="$1"/>$0',
    attributes: {
      value: { name: 'value', type: 'string', required: true, description: 'Value to match.' },
    },
  },
  'b:default': {
    name: 'b:default',
    description: 'Default fallback branch inside a b:switch statement.',
    snippetBody: 'b:default/>$0',
  },
  'b:tag': {
    name: 'b:tag',
    description: 'Dynamically generates any HTML tag by name.',
    snippetBody: 'b:tag name="$1">\n\t$0\n</b:tag>',
    attributes: {
      name: { name: 'name', type: 'string', required: true, description: 'Name of HTML tag to generate.' },
      cond: { name: 'cond', type: 'string', required: false, description: 'Condition under which to emit the tag.' },
    },
  },
  'b:widget': {
    name: 'b:widget',
    description: 'Defines a Blogger widget component.',
    snippetBody: 'b:widget id="$1" type="$2" title="$3">\n\t$0\n</b:widget>',
    attributes: {
      id: { name: 'id', type: 'string', required: true, description: 'Unique widget ID (e.g. Blog1, Header1).' },
      type: { name: 'type', type: 'string', required: true, description: 'Widget type (e.g. Blog, Header, HTML).', values: bloggerWidgetTypes },
      title: { name: 'title', type: 'string', required: true, description: 'Widget display title.' },
      locked: { name: 'locked', type: 'string', required: false, description: 'Lock widget position in layout editor (true / false).', values: ['true', 'false'] },
      version: { name: 'version', type: 'string', required: false, description: 'Widget syntax version (1 or 2).', values: ['1', '2'] },
      cond: { name: 'cond', type: 'string', required: false, description: 'Conditional expression governing widget rendering.' },
      visible: { name: 'visible', type: 'string', required: false, description: 'Widget visibility in layout editor (true / false).', values: ['true', 'false'] },
    },
  },
  'b:widget-settings': {
    name: 'b:widget-settings',
    description: 'Configuration container for a widget settings list.',
    snippetBody: 'b:widget-settings>\n\t$0\n</b:widget-settings>',
  },
  'b:widget-setting': {
    name: 'b:widget-setting',
    description: 'Single setting key-value pair for a widget.',
    snippetBody: 'b:widget-setting name="$1">\n\t$0\n</b:widget-setting>',
    attributes: {
      name: { name: 'name', type: 'string', required: true, description: 'Setting name identifier.' },
    },
  },
  'b:with': {
    name: 'b:with',
    description: 'Assigns an expression value to a local alias variable scope.',
    snippetBody: 'b:with value="$1" var="$2">\n\t$0\n</b:with>',
    attributes: {
      value: { name: 'value', type: 'string', required: true, description: 'Expression value to bind.' },
      var: { name: 'var', type: 'string', required: true, description: 'Variable name to hold the bound value.' },
    },
  },
  'Group': {
    name: 'Group',
    description: 'Groups variables and creates a section in the Blogger Template Designer.',
    snippetBody: 'Group description="$1">\n\t$0\n</Group>',
    attributes: {
      description: { name: 'description', type: 'string', required: true, description: 'Variable group description in Template Designer.' },
      selector: { name: 'selector', type: 'string', required: false, description: 'CSS selector targeted by the variable group.' },
    },
  },
  'Variable': {
    name: 'Variable',
    description: 'Creates customization options for the Blogger Template Designer.',
    snippetBody: 'Variable name="$1" description="$2" type="$3" default="$4" value="$5"/>$0',
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
      red: { name: 'red', type: 'string', required: false, description: 'Red color channel value (0-255).' },
      green: { name: 'green', type: 'string', required: false, description: 'Green color channel value (0-255).' },
      blue: { name: 'blue', type: 'string', required: false, description: 'Blue color channel value (0-255).' },
      alpha: { name: 'alpha', type: 'string', required: false, description: 'Alpha opacity channel value (0-1).' },
    },
  },
};

const STATIC_DESCRIPTIONS_SUGGESTIONS: readonly BloggerSuggestion[] = Object.freeze(
  specCatalog.getThemeDesignerDescriptions().map(desc => ({
    name: desc,
    type: 'string' as BloggerDataType,
    description: `Blogger Skin Variable / Group description: "${desc}"`,
    example: `<Variable name="myVar" description="${desc}" type="color" default="#000000" value="#000000"/>`,
    kind: 'enumMember' as const,
  })),
);

const STATIC_WIDGET_TYPES_SUGGESTIONS: readonly BloggerSuggestion[] = Object.freeze(
  Object.entries(specCatalog.getAllWidgets()).map(([widgetType, details]) => ({
    name: widgetType,
    type: 'string' as BloggerDataType,
    kind: 'enumMember' as const,
    detail: '(Blogger Widget Type)',
    description: details?.description ?? `Blogger ${widgetType} widget.`,
    example: `<b:widget id="${widgetType}1" type="${widgetType}" version="2">\n\t<b:includable id="main">\n\t\t\n\t</b:includable>\n</b:widget>`,
  })),
);

const DEFAULT_MARKUP_EXTRA: Record<string, string> = {
  All: 'Default template markup applied globally to all widgets.',
  Common: 'Default template markup applied across common widget layouts.',
};

const STATIC_DEFAULT_MARKUP_SUGGESTIONS: readonly BloggerSuggestion[] = Object.freeze(
  ['All', 'Common', ...Object.keys(specCatalog.getAllWidgets())].map((markupType) => {
    const widgetDef = specCatalog.getWidget(markupType);
    return {
      name: markupType,
      type: 'string' as BloggerDataType,
      kind: 'enumMember' as const,
      detail: '(Blogger Default Markup Type)',
      description: DEFAULT_MARKUP_EXTRA[markupType] ?? widgetDef?.description ?? `Default template markup for ${markupType} widget type.`,
      example: `<b:defaultmarkup type="${markupType}">\n\t<b:includable id="main">\n\t\t\n\t</b:includable>\n</b:defaultmarkup>`,
    };
  }),
);

const STATIC_SKIN_VARIABLE_TYPES_SUGGESTIONS: readonly BloggerSuggestion[] = Object.freeze(
  bloggerSkinVariableTypes.map((skinType) => {
    const details = bloggerSkinVariableTypeDetails[skinType];
    return {
      name: skinType,
      type: 'string' as BloggerDataType,
      kind: 'enumMember' as const,
      detail: details.skinTypeLabel,
      description: details.description,
      example: details.example,
    };
  }),
);

function createTagSuggestions(hasOpenBracket: boolean, isClosingTag: boolean): readonly BloggerSuggestion[] {
  const baseTags = isClosingTag
    ? Object.values(bloggerTags).filter(tag => !isStrictlySelfClosingTag(tag.name))
    : Object.values(bloggerTags);
  const tagsToMap = isClosingTag
    ? baseTags
    : [...baseTags, ...bloggerSkinVariableTags];

  return Object.freeze(
    tagsToMap.map((tag) => {
      let insertText: string;
      let isSnippet = true;

      if (isClosingTag) {
        insertText = `${tag.name}>`;
        isSnippet = false;
      }
      else if (hasOpenBracket) {
        insertText = tag.snippetBody;
      }
      else {
        insertText = `<${tag.snippetBody}`;
      }

      let categoryBadge = 'Config';
      let sortPriority = 30;
      if (['b:includable', 'b:include', 'b:widget', 'b:section'].includes(tag.name)) {
        categoryBadge = 'Structure';
        sortPriority = 0;
      }
      else if (['b:if', 'b:elseif', 'b:else', 'b:switch', 'b:case', 'b:default', 'b:loop', 'b:with', 'b:eval'].includes(tag.name)) {
        categoryBadge = 'Control Flow';
        sortPriority = 10;
      }
      else if (['b:tag', 'b:attr', 'b:class'].includes(tag.name)) {
        categoryBadge = 'DOM';
        sortPriority = 20;
      }

      return {
        name: tag.name,
        type: 'string' as BloggerDataType,
        description: tag.description,
        detail: tag.detail,
        insertText,
        isSnippet,
        kind: 'snippet' as const,
        example: tag.example,
        attributes: tag.attributes,
        categoryBadge,
        sortPriority,
      };
    }),
  );
}

const STATIC_TAG_SUGGESTIONS_OPEN = createTagSuggestions(true, false);
const STATIC_TAG_SUGGESTIONS_BARE = createTagSuggestions(false, false);
const STATIC_TAG_SUGGESTIONS_CLOSE = createTagSuggestions(false, true);

export function parseTagAttributeContext(text: string): {
  tagName: string;
  typedPrefix: string;
  existingAttrs: Set<string>;
} | undefined {
  let inQuote: '"' | '\'' | null = null;
  let lastOpenIndex = -1;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (inQuote) {
      if (char === inQuote) {
        inQuote = null;
      }
    }
    else {
      if (char === '"' || char === '\'') {
        inQuote = char;
      }
      else if (char === '<') {
        lastOpenIndex = i;
      }
      else if (char === '>') {
        lastOpenIndex = -1;
      }
    }
  }

  if (inQuote !== null || lastOpenIndex === -1) {
    return undefined;
  }

  const tagContent = text.slice(lastOpenIndex + 1);
  if (tagContent.startsWith('/') || tagContent.startsWith('!')) {
    return undefined;
  }

  const tagMatch = /^([\w:-]+)(\s[\s\S]*)$/.exec(tagContent);
  if (!tagMatch || !tagMatch[1] || !tagMatch[2]) {
    return undefined;
  }

  const tagName = tagMatch[1];
  const afterTagName = tagMatch[2];

  const typedMatch = /\s+([\w:-]*)$/.exec(afterTagName);
  if (!typedMatch) {
    return undefined;
  }

  const typedPrefix = typedMatch[1] ?? '';

  const existingAttrs = new Set<string>();
  const attrRegex = /\b([\w:-]+)\s*=/g;
  for (const match of afterTagName.matchAll(attrRegex)) {
    if (match[1]) {
      existingAttrs.add(match[1]);
    }
  }

  return { tagName, typedPrefix, existingAttrs };
}

export function hasAttributeValueCompletions(tagName: string, attrName: string): boolean {
  if (attrName === 'name') {
    return (
      tagName === 'b:include'
      || tagName === 'b:message'
      || tagName === 'b:param'
      || tagName === 'b:widget-setting'
      || tagName === 'b:tag'
    );
  }

  if (attrName === 'description') {
    return tagName === 'Variable' || tagName === 'Group';
  }

  if (attrName === 'type') {
    return tagName === 'Variable' || tagName === 'b:widget' || tagName === 'b:defaultmarkup';
  }

  const tagDef = bloggerTags[tagName];
  return Boolean(tagDef?.attributes?.[attrName]?.values && tagDef.attributes[attrName].values.length > 0);
}

export function isExpressionAttribute(attrName: string, tagName?: string): boolean {
  return (
    attrName.startsWith('expr:')
    || attrName === 'cond'
    || attrName === 'values'
    || (attrName === 'value' && ['b:with', 'b:eval', 'b:param', 'b:case'].includes(tagName ?? ''))
    || (attrName === 'expr' && tagName === 'b:eval')
    || (attrName === 'var' && tagName === 'b:switch')
  );
}

export function resolveDescriptionsSuggestions(): readonly BloggerSuggestion[] {
  return STATIC_DESCRIPTIONS_SUGGESTIONS;
}

export function resolveWidgetTypesSuggestions(): readonly BloggerSuggestion[] {
  return STATIC_WIDGET_TYPES_SUGGESTIONS;
}

export function resolveDefaultMarkupTypesSuggestions(excludedTypes?: readonly string[]): readonly BloggerSuggestion[] {
  if (!excludedTypes || excludedTypes.length === 0) {
    return STATIC_DEFAULT_MARKUP_SUGGESTIONS;
  }
  const excludedSet = new Set(excludedTypes.map(t => t.trim().toLowerCase()));
  return STATIC_DEFAULT_MARKUP_SUGGESTIONS.filter(s => !excludedSet.has(s.name.toLowerCase()));
}

export function resolveSkinVariableTypesSuggestions(): readonly BloggerSuggestion[] {
  return STATIC_SKIN_VARIABLE_TYPES_SUGGESTIONS;
}

export function resolveBloggerTagSuggestions(
  hasOpenBracket: boolean,
  isClosingTag: boolean = false,
  targetTag?: string,
): readonly BloggerSuggestion[] {
  if (isClosingTag) {
    if (targetTag) {
      const lower = targetTag.toLowerCase();
      const match = STATIC_TAG_SUGGESTIONS_CLOSE.find(s => s.name.toLowerCase() === lower);
      return match ? [match] : [];
    }
    return STATIC_TAG_SUGGESTIONS_CLOSE;
  }
  return hasOpenBracket ? STATIC_TAG_SUGGESTIONS_OPEN : STATIC_TAG_SUGGESTIONS_BARE;
}

export function resolveTagAttributeSuggestions(tagAttrContext: {
  tagName: string;
  typedPrefix: string;
  existingAttrs: ReadonlySet<string>;
}): { suggestions: BloggerSuggestion[]; replacementLength: number } | undefined {
  const { tagName, typedPrefix, existingAttrs } = tagAttrContext;
  const tagDef = bloggerTags[tagName];
  if (!tagDef?.attributes) {
    return undefined;
  }

  const suggestions: BloggerSuggestion[] = [];
  for (const attr of Object.values(tagDef.attributes)) {
    if ((attr as { deprecated?: boolean }).deprecated) {
      continue;
    }
    if (existingAttrs.has(attr.name)) {
      continue;
    }
    suggestions.push({
      name: attr.name,
      type: 'string',
      kind: 'property',
      detail: '(Blogger Attribute)',
      description: attr.description,
      insertText: `${attr.name}="$1"`,
      isSnippet: true,
    });
  }

  if (suggestions.length === 0) {
    return undefined;
  }

  return {
    suggestions,
    replacementLength: typedPrefix.length,
  };
}
