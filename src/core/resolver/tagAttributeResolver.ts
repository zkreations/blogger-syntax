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

function buildSkinVariableTypeDetails(): Record<BloggerSkinVariableType, BloggerSkinVariableTypeDetail> {
  const directive = getSpecCatalog().getDirective('Variable');
  const dirAttrs = directive?.attributes ?? {};
  const typeAttrs = directive?.type_attributes ?? {};

  const typeDescriptions: Record<BloggerSkinVariableType, { desc: string; example: string }> = {
    color: {
      desc: 'Defines a color skin variable for Blogger Template Designer CSS.',
      example: '<Variable name="text.color" description="Text Color" type="color" default="#333333" value="#333333" hideEditor="false"/>',
    },
    font: {
      desc: 'Defines a font skin variable with font family, size, and styling options.',
      example: '<Variable name="body.font" description="Body Font" type="font" family="Arial, sans-serif" size="14px" default="normal normal 14px Arial, sans-serif" value="normal normal 14px Arial, sans-serif" hideEditor="false"/>',
    },
    length: {
      desc: 'Defines a length / dimension skin variable with optional min and max boundaries.',
      example: '<Variable name="content.width" description="Content Width" type="length" min="600px" max="1200px" default="960px" value="960px" hideEditor="false"/>',
    },
    background: {
      desc: 'Defines a background skin variable containing color, image url, alignment, or positioning.',
      example: '<Variable name="body.background" description="Body Background" type="background" color="#ffffff" default="$(color) url(https://...) repeat fixed top left" value="$(color) url(https://...) repeat fixed top left"/>',
    },
    string: {
      desc: 'Defines a string skin variable for text or custom CSS values. Note: Distinct from runtime data:string.',
      example: '<Variable name="custom.text" description="Custom Text" type="string" default="Sample text" value="Sample text"/>',
    },
    url: {
      desc: 'Defines a URL skin variable containing an image or resource URL. Note: Distinct from runtime data:url.',
      example: '<Variable name="header.image" description="Header Image" type="url" default="url(https://...)" value="url(https://...)"/>',
    },
    automatic: {
      desc: 'Defines an automatic skin variable computed or generated automatically by the theme engine.',
      example: '<Variable name="body.rule" description="Body Rule" type="automatic" default="" value=""/>',
    },
  };

  const result: Partial<Record<BloggerSkinVariableType, BloggerSkinVariableTypeDetail>> = {};

  for (const type of bloggerSkinVariableTypes) {
    const typeConfig = typeAttrs[type];
    const allowed = typeConfig?.allowed ?? Object.keys(dirAttrs);
    const required = typeConfig?.required ?? ['name', 'description', 'type'];

    const attributes: Record<string, BloggerTagAttribute> = {};
    for (const attrName of allowed) {
      const def = dirAttrs[attrName];
      if (def) {
        let attrDesc = def.description ?? '';
        if (attrName === 'type') {
          attrDesc = `Variable type: ${type}(skin).${type === 'string' || type === 'url' ? ` (template skin variable, distinct from runtime data:${type}).` : ''}`;
        }
        attributes[attrName] = {
          name: attrName,
          type: def.type ?? 'string',
          required: required.includes(attrName),
          description: attrDesc,
        };
      }
    }

    const info = typeDescriptions[type];
    result[type] = {
      type,
      skinTypeLabel: `${type}(skin)`,
      description: info.desc,
      example: info.example,
      snippetBody: `Variable name="$1" description="$2" type="${type}" default="$3" value="$4"/>$0`,
      attributes,
    };
  }

  return result as Record<BloggerSkinVariableType, BloggerSkinVariableTypeDetail>;
}

export const bloggerSkinVariableTypeDetails: Record<BloggerSkinVariableType, BloggerSkinVariableTypeDetail> = buildSkinVariableTypeDetails();

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
  readonly variableType?: string | undefined;
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

function buildBloggerTagsCatalog(): Record<string, BloggerTagDefinition> {
  const directives = specCatalog.getAllDirectives();
  const result: Record<string, BloggerTagDefinition> = {};

  for (const [name, def] of Object.entries(directives)) {
    const rawAttrs = specCatalog.getDirectiveAttributes(name) ?? {};
    const deprecatedAttrs = new Set(
      specCatalog.validateDirectiveAttributes(name, Object.keys(rawAttrs)).deprecated.map(d => d.name),
    );

    const attributes: Record<string, BloggerTagAttribute> = {};
    for (const [attrName, attr] of Object.entries(rawAttrs)) {
      let values: readonly string[] | undefined;
      if (name === 'b:defaultmarkup' && attrName === 'type') {
        values = bloggerDefaultMarkupTypes;
      }
      else if (name === 'b:widget' && attrName === 'type') {
        values = bloggerWidgetTypes;
      }
      else if (name === 'b:widget' && attrName === 'version') {
        values = ['1', '2'];
      }
      else if (attr.allowed_values && attr.allowed_values.length > 0) {
        values = [...attr.allowed_values];
      }

      attributes[attrName] = {
        name: attrName,
        type: attr.type,
        required: Boolean(attr.required),
        description: attr.description,
        values,
        deprecated: deprecatedAttrs.has(attrName) ? true : undefined,
      };
    }

    const rawSnippet = specCatalog.getDirectiveSnippet(name, { quote: '\'' });
    let snippetBody: string;
    if (name === 'CDATA') {
      snippetBody = '<![CDATA[\n\t$0\n]]>';
    }
    else if (name === 'data:*') {
      snippetBody = 'data:${1}/>$0';
    }
    else {
      snippetBody = rawSnippet.startsWith('<') ? rawSnippet.slice(1) : rawSnippet;
    }

    result[name] = {
      name,
      description: def.description,
      snippetBody,
      attributes: Object.keys(attributes).length > 0 ? attributes : undefined,
      example: rawSnippet,
    };
  }

  if (result['data:*'] && !result['data:']) {
    result['data:'] = {
      ...result['data:*'],
      name: 'data:',
    };
  }

  return result;
}

export const bloggerTags: Record<string, BloggerTagDefinition> = buildBloggerTagsCatalog();

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

export function parseTagAttributeContext(text: string): TagAttributeContext | undefined {
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

  let variableType: string | undefined;
  if (tagName === 'Variable') {
    const typeMatch = /\btype\s*=\s*["']([^"']+)["']/.exec(afterTagName);
    if (typeMatch?.[1]) {
      variableType = typeMatch[1];
    }
  }

  return { tagName, typedPrefix, existingAttrs, variableType };
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

  if (tagName === 'b:loop' && attrName === 'reverse') {
    return true;
  }

  const tagDef = bloggerTags[tagName];
  return Boolean(tagDef?.attributes?.[attrName]?.values && tagDef.attributes[attrName].values.length > 0);
}

export function isExpressionAttribute(attrName: string, tagName?: string): boolean {
  if (attrName.startsWith('expr:')) {
    return true;
  }
  if (tagName && specCatalog.isDirectiveExpressionAttribute(tagName, attrName)) {
    return true;
  }
  return attrName === 'cond' || attrName === 'values';
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

export function resolveTagAttributeSuggestions(tagAttrContext: TagAttributeContext): { suggestions: BloggerSuggestion[]; replacementLength: number } | undefined {
  const { tagName, typedPrefix, existingAttrs, variableType } = tagAttrContext;
  const tagDef = bloggerTags[tagName];
  if (!tagDef?.attributes) {
    return undefined;
  }

  let allowedAttrs: Set<string> | undefined;
  if (tagName === 'Variable' && variableType) {
    const typeAttrs = specCatalog.getVariableTypeAttributes(variableType);
    if (typeAttrs?.allowed) {
      allowedAttrs = new Set(typeAttrs.allowed);
    }
  }

  const suggestions: BloggerSuggestion[] = [];
  for (const attr of Object.values(tagDef.attributes)) {
    if ((attr as { deprecated?: boolean }).deprecated) {
      continue;
    }
    if (existingAttrs.has(attr.name)) {
      continue;
    }
    if (allowedAttrs && !allowedAttrs.has(attr.name)) {
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
