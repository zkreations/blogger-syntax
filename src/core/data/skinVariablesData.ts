import type { BloggerTagAttribute, BloggerTagDefinition } from '../models/types.js';
import { bloggerDescriptions } from './descriptions.js';

const descriptionsChoices = bloggerDescriptions.join(',');

export const bloggerSkinVariableTypes = [
  'color',
  'font',
  'length',
  'background',
  'string',
  'url',
] as const;

export type BloggerSkinVariableType = (typeof bloggerSkinVariableTypes)[number];

export interface BloggerSkinVariableTypeDetail {
  readonly type: BloggerSkinVariableType;
  readonly skinTypeLabel: string;
  readonly description: string;
  readonly docUrl: string;
  readonly example: string;
  readonly snippetBody: string;
  readonly attributes: Record<string, BloggerTagAttribute>;
}

export const bloggerSkinVariableTypeDetails: Record<BloggerSkinVariableType, BloggerSkinVariableTypeDetail> = {
  color: {
    type: 'color',
    skinTypeLabel: 'color(skin)',
    description: 'Defines a color skin variable for Blogger Template Designer CSS.',
    docUrl: 'https://bloggercode.orbiona.com/2016/09/skin-type-color.html',
    example: '<Variable name="text.color" description="Text Color" type="color" default="#333333" value="#333333" hideEditor="false"/>',
    snippetBody: `Variable name="\${1:name}" description="\${2|${descriptionsChoices}|}" type="color" default="\${3:#000000}" value="\${4:#000000}" hideEditor="\${5|false,true|}"/>$0`,
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
    docUrl: 'https://bloggercode.orbiona.com/2016/09/skin-type-font.html',
    example: '<Variable name="body.font" description="Body Font" type="font" family="Arial, sans-serif" size="14px" default="normal normal 14px Arial, sans-serif" value="normal normal 14px Arial, sans-serif" hideEditor="false"/>',
    snippetBody: `Variable name="\${1:name}" description="\${2|${descriptionsChoices}|}" type="font" family="\${3:Arial, sans-serif}" size="\${4:14px}" default="\${5:default}" value="\${6:value}" hideEditor="\${7|false,true|}"/>$0`,
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
    docUrl: 'https://bloggercode.orbiona.com/2016/09/skin-type-length.html',
    example: '<Variable name="content.width" description="Content Width" type="length" min="600px" max="1200px" default="960px" value="960px" hideEditor="false"/>',
    snippetBody: `Variable name="\${1:name}" description="\${2|${descriptionsChoices}|}" type="length" min="\${3:10px}" max="\${4:100px}" default="\${5:20px}" value="\${6:20px}" hideEditor="\${7|false,true|}"/>$0`,
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
    docUrl: 'https://bloggercode.orbiona.com/2016/09/skin-type-background.html',
    example: '<Variable name="body.background" description="Body Background" type="background" color="#ffffff" default="$(color) url(https://...) repeat fixed top left" value="$(color) url(https://...) repeat fixed top left"/>',
    snippetBody: `Variable name="\${1:name}" description="\${2|${descriptionsChoices}|}" type="background" color="\${3:#ffffff}" default="\${4:value}" value="\${5:value}"/>$0`,
    attributes: {
      name: { name: 'name', type: 'string', required: true, description: 'Unique variable identifier name. Letters, numbers, and dots are allowed.' },
      description: { name: 'description', type: 'string', required: true, description: 'Variable label shown in Template Designer.' },
      type: { name: 'type', type: 'string', required: true, description: 'Variable type: background(skin).' },
      color: { name: 'color', type: 'string', required: false, description: 'Background color code or $color variable reference.' },
      default: { name: 'default', type: 'string', required: true, description: 'Default background CSS value.' },
      value: { name: 'value', type: 'string', required: true, description: 'Current background CSS value.' },
    },
  },
  string: {
    type: 'string',
    skinTypeLabel: 'string(skin)',
    description: 'Defines a string skin variable for text or custom CSS values. Note: Distinct from runtime data:string.',
    docUrl: 'https://bloggercode.orbiona.com/2016/09/skin-type-string.html',
    example: '<Variable name="custom.text" description="Custom Text" type="string" default="Sample text" value="Sample text"/>',
    snippetBody: `Variable name="\${1:name}" description="\${2|${descriptionsChoices}|}" type="string" default="\${3:default}" value="\${4:value}"/>$0`,
    attributes: {
      name: { name: 'name', type: 'string', required: true, description: 'Unique variable identifier name. Letters, numbers, and dots are allowed.' },
      description: { name: 'description', type: 'string', required: true, description: 'Variable label shown in Template Designer.' },
      type: { name: 'type', type: 'string', required: true, description: 'Variable type: string(skin) (template skin variable, distinct from runtime data:string).' },
      default: { name: 'default', type: 'string', required: true, description: 'Default string value.' },
      value: { name: 'value', type: 'string', required: true, description: 'Current string value.' },
    },
  },
  url: {
    type: 'url',
    skinTypeLabel: 'url(skin)',
    description: 'Defines a URL skin variable containing an image or resource URL. Note: Distinct from runtime data:url.',
    docUrl: 'https://bloggercode.orbiona.com/2016/09/skin-type-url.html',
    example: '<Variable name="header.image" description="Header Image" type="url" default="url(https://...)" value="url(https://...)"/>',
    snippetBody: `Variable name="\${1:name}" description="\${2|${descriptionsChoices}|}" type="url" default="\${3:url(https://...)}" value="\${4:url(https://...)}"/>$0`,
    attributes: {
      name: { name: 'name', type: 'string', required: true, description: 'Unique variable identifier name. Letters, numbers, and dots are allowed.' },
      description: { name: 'description', type: 'string', required: true, description: 'Variable label shown in Template Designer.' },
      type: { name: 'type', type: 'string', required: true, description: 'Variable type: url(skin) (template skin variable, distinct from runtime data:url).' },
      default: { name: 'default', type: 'string', required: true, description: 'Default URL value (typically wrapped in url(...)).' },
      value: { name: 'value', type: 'string', required: true, description: 'Current URL value (typically wrapped in url(...)).' },
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
      docUrl: detail.docUrl,
    };
  }),
);
