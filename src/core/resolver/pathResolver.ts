import type {
  BloggerDataType,
  BloggerHoverResult,
  BloggerProperty,
  BloggerResolveResult,
  BloggerSuggestion,
} from '../models/types.js';
import { bloggerCommonAttributes, bloggerExprPrefixInfo } from '../data/attributesData.js';
import { bloggerDescriptions } from '../data/descriptions.js';
import { bloggerFunctionsCatalog, getGlobalFunctionSuggestions } from '../data/functionsData.js';
import { bloggerGlobalRoot } from '../data/globalData.js';
import { getHtmlTagSuggestions } from '../data/htmlTagsData.js';
import {
  getMessageParamSuggestions,
  getSystemMessageSuggestions,
  systemMessagesCatalog,
} from '../data/messagesCatalog.js';
import { bloggerOperatorsCatalog, getOperatorSuggestions } from '../data/operatorsData.js';
import {
  bloggerSkinVariableTags,
  bloggerSkinVariableTypeDetails,
  bloggerSkinVariableTypes,
} from '../data/skinVariablesData.js';
import { bloggerTags } from '../data/tagsData.js';
import { getPropertyMembers } from '../data/typeMembers.js';
import { getWidgetDescriptor } from '../data/widgetDescriptors.js';
import { blogWidgetProperties, singlePostProperties } from '../data/widgetsData.js';
import {
  getWidgetSettingsSuggestions,
  widgetSettingsCatalog,
} from '../data/widgetSettingsData.js';
import {
  bloggerDefaultMarkupTypeDetails,
  bloggerDefaultMarkupTypes,
  bloggerWidgetTypeDetails,
  bloggerWidgetTypes,
} from '../data/widgetTypes.js';
import {
  resolveLambdaContextAtCursor,
  resolveLambdaHoverAtPosition,
} from '../parser/exprParser.js';

const ATTR_VALUE_REGEX = /\b([\w:-]+)\s*=\s*["']([^"']*)$/;
const TAG_CONTEXT_REGEX = /<([\w:-]+)(?:\s[^>]*)?$/;
const DATA_PREFIX_REGEX = /(?:^|[^\w:.])(data:[[\]\w.]*)$/;
const TAG_PREFIX_REGEX = /(?:^|[^\w:])(?:(<\/|<)([\w:-]*)|(b:[\w-]*|data:?|Variable\w*|Group\w*))$/i;
const HOVER_DATA_REGEX = /(?:^|[^\w:.])(data:[[\]\w.]*)/g;
const HOVER_TAG_REGEX = /(<\/?)(b:[\w-]+|Variable|Group)/g;
const HOVER_EXPR_REGEX = /\b(expr:[\w-]*)/g;
const HOVER_ATTR_REGEX = /\b([\w-]+)\s*=/g;
const HOVER_ATTR_VAL_REGEX = /\b([\w:-]+)\s*=\s*(["'])([^"']*)\2/g;
const OPERATOR_TRIGGER_REGEX = /(?:data:[\w.[\]]+|[a-zA-Z_]\w*(?:\.\w+)*|[)"'\d])\s+([a-zA-Z_]\w*)?$/;
const FUNCTION_TRIGGER_REGEX = /(?:^|[=?:,(]|\band\b|\bor\b|\bnot\b)\s*([a-zA-Z_]\w*)?$/;

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
  const baseTags = Object.values(bloggerTags);
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

function normalizeDocUrls(docUrl?: string | readonly string[]): readonly string[] | undefined {
  if (!docUrl) {
    return undefined;
  }
  return typeof docUrl === 'string' ? [docUrl] : docUrl;
}

export interface PropertyNavigationResult {
  readonly target?: BloggerProperty | undefined;
  readonly children?: Record<string, BloggerProperty> | undefined;
}

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

export function navigatePropertyPath(
  segments: readonly string[],
  localVariables?: Record<string, BloggerProperty>,
  rootTree: Record<string, BloggerProperty> = bloggerGlobalRoot,
): PropertyNavigationResult | undefined {
  if (segments.length === 0) {
    return undefined;
  }

  const normalizedSegments = segments.flatMap(s =>
    s.replace(/\[/g, '.').replace(/\]/g, '').split('.').filter(Boolean),
  );

  if (normalizedSegments.length === 0) {
    return undefined;
  }

  const [firstSegment, ...restSegments] = normalizedSegments;
  if (!firstSegment) {
    return undefined;
  }

  let targetProperty: BloggerProperty | undefined
    = localVariables?.[firstSegment] ?? rootTree[firstSegment];

  if (!targetProperty) {
    if (firstSegment === 'post') {
      targetProperty = {
        name: 'post',
        type: 'object',
        description: 'Current post object context.',
        children: singlePostProperties,
      };
    }
    else if (firstSegment === 'posts') {
      targetProperty = blogWidgetProperties.posts;
    }
    else if (firstSegment === 'feedLinks') {
      targetProperty = blogWidgetProperties.feedLinks;
    }
    else {
      return undefined;
    }
  }

  if (!targetProperty) {
    return undefined;
  }

  let currentMap: Record<string, BloggerProperty> | undefined = getPropertyMembers(targetProperty);

  for (const segment of restSegments) {
    if (!segment || !currentMap) {
      return undefined;
    }

    let nextProp = currentMap[segment];

    // Handle array indexing (e.g. 0, [0], i)
    if (!nextProp && targetProperty.type === 'array' && targetProperty.itemChildren) {
      const isIndex = /^\d+$/.test(segment) || /^\[\d+\]$/.test(segment) || segment === '[i]' || segment === 'i';
      if (isIndex) {
        nextProp = {
          name: `${targetProperty.name}[item]`,
          type: 'object',
          description: `Item of ${targetProperty.name} collection.`,
          children: targetProperty.itemChildren,
        };
      }
    }

    // Handle widget ID lookup on data:widgets (e.g. data:widgets.Blog1 or data:widgets.Header1)
    if (!nextProp && targetProperty.name === 'widgets') {
      const cleanSegment = segment.replace(/^\[['"]?/, '').replace(/['"]?\]$/, '');
      const descriptorProps = getWidgetDescriptor(cleanSegment);
      nextProp = {
        name: cleanSegment,
        type: 'object',
        description: `Layout descriptor object for widget "${cleanSegment}".`,
        children: descriptorProps,
      };
    }

    if (!nextProp) {
      return undefined;
    }

    targetProperty = nextProp;
    currentMap = getPropertyMembers(targetProperty);
  }

  return { target: targetProperty, children: currentMap };
}

export type LocalVariablesResolver = Record<string, BloggerProperty> | (() => Record<string, BloggerProperty>);

export interface BloggerIncludablesInfo {
  readonly local?: readonly string[];
  readonly defaultMarkups?: readonly string[];
}

export interface BloggerResolverContext {
  readonly localVariables?: LocalVariablesResolver | undefined;
  readonly widgetType?: string | undefined;
  readonly includables?: BloggerIncludablesInfo | undefined;
  readonly enclosingMessageName?: string | undefined;
}

function resolveLocalVariables(resolver?: LocalVariablesResolver): Record<string, BloggerProperty> | undefined {
  return typeof resolver === 'function' ? resolver() : resolver;
}

export class BloggerPathResolver {
  private readonly rootTree: Record<string, BloggerProperty> = bloggerGlobalRoot;

  private mapPropertyToSuggestion(prop: BloggerProperty, basePath?: string): BloggerSuggestion {
    return {
      name: prop.name,
      type: prop.type,
      description: prop.description,
      example: prop.example ?? (basePath ? `data:${basePath}.${prop.name}` : `data:${prop.name}`),
      deprecated: prop.deprecated,
      docUrl: prop.docUrl,
      kind: 'property',
    };
  }

  private navigatePath(
    segments: readonly string[],
    localVariables?: Record<string, BloggerProperty>,
  ): PropertyNavigationResult | undefined {
    return navigatePropertyPath(segments, localVariables, this.rootTree);
  }

  public resolvePropertyFromPath(
    segments: readonly string[],
    localVariables?: Record<string, BloggerProperty>,
  ): BloggerProperty | undefined {
    if (segments.length === 0) {
      return undefined;
    }
    return this.navigatePath(segments, localVariables)?.target;
  }

  public resolveDataPath(
    segments: readonly string[],
    localVariables?: Record<string, BloggerProperty>,
  ): readonly BloggerSuggestion[] {
    if (segments.length === 0) {
      const mergedRoots: Record<string, BloggerProperty> = { ...this.rootTree, ...localVariables };
      return Object.values(mergedRoots).map(prop => this.mapPropertyToSuggestion(prop));
    }

    const node = this.navigatePath(segments, localVariables);
    if (!node?.children) {
      return [];
    }

    const basePath = segments.join('.');
    return Object.values(node.children).map(prop => this.mapPropertyToSuggestion(prop, basePath));
  }

  public resolveDescriptions(): readonly BloggerSuggestion[] {
    return STATIC_DESCRIPTIONS_SUGGESTIONS;
  }

  public resolveWidgetTypes(): readonly BloggerSuggestion[] {
    return STATIC_WIDGET_TYPES_SUGGESTIONS;
  }

  public resolveDefaultMarkupTypes(): readonly BloggerSuggestion[] {
    return STATIC_DEFAULT_MARKUP_SUGGESTIONS;
  }

  public resolveSkinVariableTypes(): readonly BloggerSuggestion[] {
    return STATIC_SKIN_VARIABLE_TYPES_SUGGESTIONS;
  }

  public resolveBloggerTags(hasOpenBracket: boolean, isClosingTag: boolean = false): readonly BloggerSuggestion[] {
    if (isClosingTag) {
      return STATIC_TAG_SUGGESTIONS_CLOSE;
    }
    return hasOpenBracket ? STATIC_TAG_SUGGESTIONS_OPEN : STATIC_TAG_SUGGESTIONS_BARE;
  }

  public resolveFromLinePrefix(
    linePrefix: string,
    options?: BloggerResolverContext,
  ): BloggerResolveResult | undefined {
    const attrMatch = ATTR_VALUE_REGEX.exec(linePrefix);
    if (attrMatch && attrMatch[1] && attrMatch[2] !== undefined) {
      const attrName = attrMatch[1];
      const typedText = attrMatch[2];
      const beforeAttr = linePrefix.slice(0, attrMatch.index);
      const tagMatch = TAG_CONTEXT_REGEX.exec(beforeAttr)
        || /(?:^|\s)([\w:-]+)(?:\s[^>]*)?$/.exec(beforeAttr);
      const tagName = tagMatch?.[1];

      if (attrName === 'name') {
        if (tagName === 'b:include') {
          const suggestions: BloggerSuggestion[] = [];
          if (options?.includables?.local) {
            for (const inc of options.includables.local) {
              if (inc.startsWith('super.')) {
                continue;
              }
              suggestions.push({
                name: inc,
                type: 'string',
                kind: 'property',
                detail: '(Includable Subroutine)',
                description: 'Template subroutine defined in current widget or template.',
                example: `<b:include name="${inc}"/>`,
              });
            }
          }
          if (options?.includables?.defaultMarkups) {
            for (const inc of options.includables.defaultMarkups) {
              if (inc.startsWith('super.')) {
                continue;
              }
              if (!suggestions.some(s => s.name === inc)) {
                suggestions.push({
                  name: inc,
                  type: 'string',
                  kind: 'property',
                  detail: '(Default Markup Subroutine)',
                  description: 'Template subroutine defined in default markup.',
                  example: `<b:include name="${inc}"/>`,
                });
              }
            }
          }
          return {
            suggestions,
            replacementLength: typedText.length,
          };
        }

        if (tagName === 'b:message') {
          return {
            suggestions: getSystemMessageSuggestions(),
            replacementLength: typedText.length,
          };
        }

        if (tagName === 'b:param') {
          return {
            suggestions: getMessageParamSuggestions(options?.enclosingMessageName),
            replacementLength: typedText.length,
          };
        }

        if (tagName === 'b:widget-setting') {
          return {
            suggestions: getWidgetSettingsSuggestions(options?.widgetType),
            replacementLength: typedText.length,
          };
        }

        if (tagName === 'b:tag') {
          return {
            suggestions: getHtmlTagSuggestions(),
            replacementLength: typedText.length,
          };
        }
      }

      if (attrName === 'description') {
        const isSkinTag = tagName === 'Variable' || tagName === 'Group';
        if (isSkinTag) {
          return {
            suggestions: this.resolveDescriptions(),
            replacementLength: typedText.length,
          };
        }
      }

      if (attrName === 'type') {
        if (tagName === 'Variable') {
          return {
            suggestions: this.resolveSkinVariableTypes(),
            replacementLength: typedText.length,
          };
        }

        if (tagName === 'b:widget') {
          return {
            suggestions: this.resolveWidgetTypes(),
            replacementLength: typedText.length,
          };
        }

        if (tagName === 'b:defaultmarkup') {
          return {
            suggestions: this.resolveDefaultMarkupTypes(),
            replacementLength: typedText.length,
          };
        }
      }

      // Check if attribute has declared enumerated values (e.g. tag, reverse, render, locked, visible, version, showaddelement)
      if (tagName && bloggerTags[tagName]?.attributes?.[attrName]?.values) {
        const values = bloggerTags[tagName].attributes![attrName].values!;
        return {
          suggestions: values.map(val => ({
            name: val,
            type: 'string',
            kind: 'enumMember' as const,
            description: `Value "${val}" for attribute ${attrName}.`,
          })),
          replacementLength: typedText.length,
        };
      }

      const isExpressionAttr
        = attrName.startsWith('expr:')
          || attrName === 'cond'
          || attrName === 'values'
          || (attrName === 'value' && ['b:with', 'b:eval', 'b:param'].includes(tagName ?? ''))
          || (attrName === 'expr' && tagName === 'b:eval');

      if (isExpressionAttr) {
        const localVariables = resolveLocalVariables(options?.localVariables);
        const lambdaContext = resolveLambdaContextAtCursor(typedText, typedText.length, localVariables);
        if (lambdaContext) {
          if (lambdaContext.isNavigatingMember && lambdaContext.targetProperty?.children) {
            const suggestions: BloggerSuggestion[] = Object.values(lambdaContext.targetProperty.children).map(prop => ({
              name: prop.name,
              type: prop.type,
              description: prop.description,
              example: `${lambdaContext.activeParam}.${prop.name}`,
              kind: 'property' as const,
              deprecated: prop.deprecated,
              docUrl: prop.docUrl,
            }));
            return {
              suggestions,
              replacementLength: lambdaContext.currentToken.length,
            };
          }
          if (!lambdaContext.isNavigatingMember && lambdaContext.currentToken) {
            const suggestions: BloggerSuggestion[] = Object.entries(lambdaContext.activeScopes).map(([pName, prop]) => ({
              name: pName,
              type: prop.type,
              kind: 'variable' as const,
              description: prop.description ?? `Lambda parameter \`${pName}\`.`,
              example: pName,
            }));
            return {
              suggestions,
              replacementLength: lambdaContext.currentToken.length,
            };
          }
        }

        const opMatch = OPERATOR_TRIGGER_REGEX.exec(typedText);
        if (opMatch) {
          const fullOpMatch = opMatch[0];
          const typedOp = opMatch[1] ?? '';
          const operand = fullOpMatch.slice(0, fullOpMatch.length - typedOp.length).trim();

          const isCol
            = /\b(?:posts|labels|comments|feedLinks|links)\b/i.test(operand)
              || operand.endsWith(')')
              || operand.endsWith(']');

          const allOps = getOperatorSuggestions(false);
          const sorted = isCol
            ? [...allOps].sort((a, b) => {
                const aCol = bloggerOperatorsCatalog[a.name]?.isCollectionOperator ? 0 : 1;
                const bCol = bloggerOperatorsCatalog[b.name]?.isCollectionOperator ? 0 : 1;
                return aCol - bCol;
              })
            : allOps;

          return {
            suggestions: sorted,
            replacementLength: typedOp.length,
          };
        }

        const fnMatch = FUNCTION_TRIGGER_REGEX.exec(typedText);
        if (fnMatch) {
          const typedFn = fnMatch[1] ?? '';
          if (!typedFn || Object.keys(bloggerFunctionsCatalog).some(k => k.startsWith(typedFn))) {
            return {
              suggestions: getGlobalFunctionSuggestions(),
              replacementLength: typedFn.length,
            };
          }
        }
      }
    }

    const tagAttrContext = parseTagAttributeContext(linePrefix);
    if (tagAttrContext) {
      const { tagName, typedPrefix, existingAttrs } = tagAttrContext;
      const tagDef = bloggerTags[tagName];
      if (tagDef?.attributes) {
        const suggestions: BloggerSuggestion[] = [];
        for (const attr of Object.values(tagDef.attributes)) {
          if ((attr as any).deprecated) {
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

        if (suggestions.length > 0) {
          return {
            suggestions,
            replacementLength: typedPrefix.length,
          };
        }
      }
    }

    const localVars = resolveLocalVariables(options?.localVariables);
    const bareLambdaContext = resolveLambdaContextAtCursor(linePrefix, linePrefix.length, localVars);
    if (bareLambdaContext) {
      if (bareLambdaContext.isNavigatingMember && bareLambdaContext.targetProperty?.children) {
        const suggestions: BloggerSuggestion[] = Object.values(bareLambdaContext.targetProperty.children).map(prop => ({
          name: prop.name,
          type: prop.type,
          description: prop.description,
          example: `${bareLambdaContext.activeParam}.${prop.name}`,
          kind: 'property' as const,
          deprecated: prop.deprecated,
          docUrl: prop.docUrl,
        }));
        return {
          suggestions,
          replacementLength: bareLambdaContext.currentToken.length,
        };
      }
      if (!bareLambdaContext.isNavigatingMember && bareLambdaContext.currentToken) {
        const suggestions: BloggerSuggestion[] = Object.entries(bareLambdaContext.activeScopes).map(([pName, prop]) => ({
          name: pName,
          type: prop.type,
          kind: 'variable' as const,
          description: prop.description ?? `Lambda parameter \`${pName}\`.`,
          example: pName,
        }));
        return {
          suggestions,
          replacementLength: bareLambdaContext.currentToken.length,
        };
      }
    }

    const dataMatch = DATA_PREFIX_REGEX.exec(linePrefix);
    if (dataMatch && dataMatch[1] !== undefined) {
      const localVariables = resolveLocalVariables(options?.localVariables);
      const fullExpression = dataMatch[1];
      const rawPath = fullExpression.slice('data:'.length);

      if (rawPath === '') {
        return {
          suggestions: this.resolveDataPath([], localVariables),
          replacementLength: 0,
        };
      }

      if (rawPath.endsWith('.')) {
        const normalized = rawPath.slice(0, -1).replace(/\[/g, '.').replace(/\]/g, '');
        const segments = normalized.split('.').filter(Boolean);
        return {
          suggestions: this.resolveDataPath(segments, localVariables),
          replacementLength: 0,
        };
      }

      const normalized = rawPath.replace(/\[/g, '.').replace(/\]/g, '');
      const segments = normalized.split('.').filter(Boolean);
      const lastSegment = segments.pop() ?? '';
      return {
        suggestions: this.resolveDataPath(segments, localVariables),
        replacementLength: lastSegment.length,
      };
    }

    const tagMatch = TAG_PREFIX_REGEX.exec(linePrefix);
    if (tagMatch) {
      const bracketPrefix = tagMatch[1];
      const isClosingTag = bracketPrefix === '</';
      const hasOpenBracket = bracketPrefix === '<';
      const typedTag = tagMatch[2] ?? tagMatch[3] ?? '';
      return {
        suggestions: this.resolveBloggerTags(hasOpenBracket, isClosingTag),
        replacementLength: typedTag.length,
      };
    }

    return undefined;
  }

  public resolveHoverAtPosition(
    lineText: string,
    character: number,
    precedingContext?: string | (() => string | undefined),
    options?: BloggerResolverContext,
  ): BloggerHoverResult | undefined {
    if (character < 0 || character > lineText.length) {
      return undefined;
    }

    for (const match of lineText.matchAll(HOVER_DATA_REGEX)) {
      const token = match[1];
      if (!token || token === 'data:' || match.index === undefined) {
        continue;
      }
      const tokenStart = match.index + (match[0].length - token.length);
      const tokenEnd = tokenStart + token.length;

      if (character >= tokenStart && character <= tokenEnd) {
        const localVariables = resolveLocalVariables(options?.localVariables);
        const rawPath = token.slice('data:'.length);
        const segments = rawPath.replace(/\[/g, '.').replace(/\]/g, '').split('.').filter(Boolean);
        const resolved = this.resolvePropertyFromPath(segments, localVariables);
        if (resolved) {
          return {
            hover: {
              title: token,
              category: 'data',
              type: resolved.type,
              description: resolved.description,
              example: resolved.example ?? token,
              docUrls: normalizeDocUrls(resolved.docUrl),
            },
            range: { start: tokenStart, end: tokenEnd },
          };
        }
      }
    }

    const localVars = resolveLocalVariables(options?.localVariables);
    const lambdaHover = resolveLambdaHoverAtPosition(lineText, character, localVars);
    if (lambdaHover) {
      return {
        hover: {
          title: lambdaHover.title,
          category: lambdaHover.category,
          type: lambdaHover.type,
          description: lambdaHover.description,
          example: lambdaHover.example,
          docUrls: lambdaHover.docUrls,
        },
        range: lambdaHover.range,
      };
    }

    for (const match of lineText.matchAll(/\b(filter|where|map|select|count|first|last|any|all|none|take|limit|skip|offset|to|in|contains|format|params|appendParams|path|fragment|and|or|not)\b/g)) {
      const opName = match[1];
      if (!opName || match.index === undefined) {
        continue;
      }
      const tokenStart = match.index;
      const tokenEnd = tokenStart + opName.length;

      if (character >= tokenStart && character <= tokenEnd) {
        if (tokenStart > 0 && lineText[tokenStart - 1] === '.') {
          continue;
        }
        const op = bloggerOperatorsCatalog[opName];
        if (op) {
          return {
            hover: {
              title: `Operator: ${op.name}`,
              category: 'operator',
              type: (op.returnType === 'same' || op.returnType === 'element') ? 'object' : op.returnType,
              description: `${op.description}\n\n**Syntax:** \`${op.signature}\``,
              example: op.example,
              docUrls: normalizeDocUrls(op.docUrl),
            },
            range: { start: tokenStart, end: tokenEnd },
          };
        }
      }
    }

    for (const match of lineText.matchAll(/\b(snippet|resizeImage|sourceSet)\b/g)) {
      const fnName = match[1];
      if (!fnName || match.index === undefined) {
        continue;
      }
      const tokenStart = match.index;
      const tokenEnd = tokenStart + fnName.length;

      if (character >= tokenStart && character <= tokenEnd) {
        if (tokenStart > 0 && lineText[tokenStart - 1] === '.') {
          continue;
        }
        const fn = bloggerFunctionsCatalog[fnName];
        if (fn) {
          return {
            hover: {
              title: `Function: ${fn.name}`,
              category: 'function',
              type: fn.returnType,
              description: `${fn.description}\n\n**Signature:** \`${fn.signature}\``,
              example: fn.example,
              docUrls: normalizeDocUrls(fn.docUrl),
            },
            range: { start: tokenStart, end: tokenEnd },
          };
        }
      }
    }

    for (const match of lineText.matchAll(HOVER_TAG_REGEX)) {
      const fullTagName = match[2];
      if (!fullTagName || match.index === undefined) {
        continue;
      }
      const tokenStart = match.index;
      const tokenEnd = tokenStart + match[0].length;

      if (character >= tokenStart && character <= tokenEnd) {
        const tagDef = bloggerTags[fullTagName];
        if (tagDef) {
          return {
            hover: {
              title: `<${fullTagName}>`,
              category: 'tag',
              description: tagDef.description,
              example: tagDef.snippetBody,
              docUrls: normalizeDocUrls(tagDef.docUrl),
            },
            range: { start: tokenStart, end: tokenEnd },
          };
        }
      }
    }

    for (const match of lineText.matchAll(HOVER_EXPR_REGEX)) {
      if (match.index === undefined) {
        continue;
      }
      const tokenStart = match.index;
      const tokenEnd = tokenStart + match[0].length;

      if (character >= tokenStart && character <= tokenEnd) {
        return {
          hover: {
            title: `${match[0]} (Expression Attribute)`,
            category: 'prefix',
            type: 'attribute-prefix',
            description: bloggerExprPrefixInfo.description,
            docUrls: normalizeDocUrls(bloggerExprPrefixInfo.docUrl),
          },
          range: { start: tokenStart, end: tokenEnd },
        };
      }
    }

    for (const match of lineText.matchAll(HOVER_ATTR_REGEX)) {
      const attrName = match[1];
      if (!attrName || attrName.startsWith('expr:') || match.index === undefined) {
        continue;
      }
      const tokenStart = match.index;
      const tokenEnd = tokenStart + attrName.length;

      if (character >= tokenStart && character <= tokenEnd) {
        const beforeAttr = lineText.slice(0, tokenStart);
        const resolvedContext = typeof precedingContext === 'function' ? precedingContext() : precedingContext;
        const fullContext = resolvedContext ? `${resolvedContext}\n${beforeAttr}` : beforeAttr;
        const tagMatch = TAG_CONTEXT_REGEX.exec(fullContext);
        const tagName = tagMatch?.[1];

        const isBloggerTag = tagName && (tagName.startsWith('b:') || tagName === 'Variable' || tagName === 'Group');
        if (!isBloggerTag) {
          continue;
        }

        const tagDef = tagName ? bloggerTags[tagName] : undefined;
        const tagAttr = tagDef?.attributes?.[attrName];
        const commonAttr = bloggerCommonAttributes[attrName];
        const attrDef = tagAttr ?? commonAttr;
        if (attrDef) {
          const docUrl = tagAttr?.docUrl ?? commonAttr?.docUrl;
          return {
            hover: {
              title: attrName,
              category: 'attribute',
              type: attrDef.type,
              description: attrDef.description,
              docUrls: normalizeDocUrls(docUrl),
            },
            range: { start: tokenStart, end: tokenEnd },
          };
        }
      }
    }

    for (const match of lineText.matchAll(HOVER_ATTR_VAL_REGEX)) {
      const attrName = match[1];
      const val = match[3];
      if (!attrName || !val || match.index === undefined) {
        continue;
      }
      const valStart = match.index + match[0].indexOf(val);
      const valEnd = valStart + val.length;

      if (character >= valStart && character <= valEnd) {
        const beforeAttr = lineText.slice(0, match.index);
        const resolvedContext = typeof precedingContext === 'function' ? precedingContext() : precedingContext;
        const fullContext = resolvedContext ? `${resolvedContext}\n${beforeAttr}` : beforeAttr;
        const tagMatch = TAG_CONTEXT_REGEX.exec(fullContext);
        const tagName = tagMatch?.[1];

        if (tagName === 'b:widget-setting' && attrName === 'name') {
          const widgetType = options?.widgetType;
          let setting = widgetType ? widgetSettingsCatalog[widgetType]?.[val] : undefined;
          if (!setting) {
            for (const dict of Object.values(widgetSettingsCatalog)) {
              if (dict[val]) {
                setting = dict[val];
                break;
              }
            }
          }
          if (setting) {
            return {
              hover: {
                title: `${val} (${widgetType ? `${widgetType} Setting` : 'Widget Setting'})`,
                category: 'setting',
                description: setting.description,
                example: `<b:widget-setting name="${val}">${setting.default ?? ''}</b:widget-setting>`,
                docUrls: ['https://bloggercode.orbiona.com/2018/02/tags-b-widget-settings.html'],
              },
              range: { start: valStart, end: valEnd },
            };
          }
        }

        if (tagName === 'b:message' && attrName === 'name') {
          const cleanKey = val.replace(/^messages\./, '');
          const msg = systemMessagesCatalog[cleanKey];
          if (msg) {
            return {
              hover: {
                title: `${msg.canonicalName} (${msg.isParameterized ? 'Parameterized Message' : 'System Message'})`,
                category: 'message',
                description: msg.isParameterized
                  ? `${msg.description} Requires child <b:param> tags; direct <data:messages...> output is prohibited.`
                  : msg.description,
                example: msg.isParameterized
                  ? `<b:message name="${msg.canonicalName}">\n  <b:param name="${msg.params?.[0]?.name ?? 'param'}" value="..."/>\n</b:message>`
                  : `<b:message name="${msg.canonicalName}"/>`,
                docUrls: ['https://bloggercode.orbiona.com/2018/02/data-messages.html'],
              },
              range: { start: valStart, end: valEnd },
            };
          }
        }

        if (tagName === 'b:param' && attrName === 'name') {
          const encMsg = options?.enclosingMessageName;
          const cleanKey = encMsg ? encMsg.replace(/^messages\./, '') : undefined;
          const msg = cleanKey ? systemMessagesCatalog[cleanKey] : undefined;
          let param = msg?.params?.find(p => p.name === val);
          if (!param) {
            for (const m of Object.values(systemMessagesCatalog)) {
              const found = m.params?.find(p => p.name === val);
              if (found) {
                param = found;
                break;
              }
            }
          }
          if (param) {
            return {
              hover: {
                title: `${val} (Parameter Pos ${param.position})`,
                category: 'param',
                description: `${param.description} (Positional substitution order: ${param.position}).`,
                example: `<b:param name="${val}" value="${param.exampleValue}"/>`,
                docUrls: ['https://bloggercode.orbiona.com/2018/02/tag-b-message-b-param.html'],
              },
              range: { start: valStart, end: valEnd },
            };
          }
        }
      }
    }

    return undefined;
  }
}
