import type {
  BloggerDataType,
  BloggerSuggestion,
} from '../models/types.js';
import { bloggerDescriptions } from '../data/descriptions.js';
import {
  bloggerSkinVariableTags,
  bloggerSkinVariableTypeDetails,
  bloggerSkinVariableTypes,
} from '../data/skinVariablesData.js';
import { bloggerTags } from '../data/tagsData.js';
import {
  bloggerDefaultMarkupTypeDetails,
  bloggerDefaultMarkupTypes,
  bloggerWidgetTypeDetails,
  bloggerWidgetTypes,
} from '../data/widgetTypes.js';
import { isStrictlySelfClosingTag } from '../parser/tagTreeTracker.js';

export interface TagAttributeContext {
  readonly tagName: string;
  readonly typedPrefix: string;
  readonly existingAttrs: ReadonlySet<string>;
}

const STATIC_DESCRIPTIONS_SUGGESTIONS: readonly BloggerSuggestion[] = Object.freeze(
  bloggerDescriptions.map(desc => ({
    name: desc,
    type: 'string' as BloggerDataType,
    description: `Blogger Skin Variable / Group description: "${desc}"`,
    example: `<Variable name="myVar" description="${desc}" type="color" default="#000000" value="#000000"/>`,
    kind: 'enumMember' as const,
  })),
);

const STATIC_WIDGET_TYPES_SUGGESTIONS: readonly BloggerSuggestion[] = Object.freeze(
  bloggerWidgetTypes.map((widgetType) => {
    const details = bloggerWidgetTypeDetails[widgetType];
    return {
      name: widgetType,
      type: 'string' as BloggerDataType,
      kind: 'enumMember' as const,
      detail: '(Blogger Widget Type)',
      description: details?.description ?? `Blogger ${widgetType} widget.`,
      example: `<b:widget id="${widgetType}1" type="${widgetType}" version="2">\n\t<b:includable id="main">\n\t\t\n\t</b:includable>\n</b:widget>`,
      docUrl: details?.docUrl ?? 'https://bloggercode.orbiona.com/2016/03/tag-b-widget.html',
    };
  }),
);

const STATIC_DEFAULT_MARKUP_SUGGESTIONS: readonly BloggerSuggestion[] = Object.freeze(
  bloggerDefaultMarkupTypes.map((markupType) => {
    const details = bloggerDefaultMarkupTypeDetails[markupType] ?? bloggerWidgetTypeDetails[markupType];
    return {
      name: markupType,
      type: 'string' as BloggerDataType,
      kind: 'enumMember' as const,
      detail: '(Blogger Default Markup Type)',
      description: details?.description ?? `Default template markup for ${markupType} widget type.`,
      example: `<b:defaultmarkup type="${markupType}">\n\t<b:includable id="main">\n\t\t\n\t</b:includable>\n</b:defaultmarkup>`,
      docUrl: details?.docUrl ?? 'https://bloggercode.orbiona.com/2017/05/tag-b-defaultmarkups.html',
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
      docUrl: details.docUrl,
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
        docUrl: tag.docUrl,
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

export function resolveDefaultMarkupTypesSuggestions(): readonly BloggerSuggestion[] {
  return STATIC_DEFAULT_MARKUP_SUGGESTIONS;
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
      docUrl: attr.docUrl,
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
