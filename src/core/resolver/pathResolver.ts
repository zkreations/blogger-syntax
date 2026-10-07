import type {
  BloggerHoverResult,
  BloggerProperty,
  BloggerResolveResult,
  BloggerSuggestion,
} from '../models/types.js';
import type { BloggerIncludablesInfo, BloggerResolverContext, LocalVariablesResolver } from './hoverCardResolver.js';
import type { TagAttributeContext } from './tagAttributeResolver.js';
import { bloggerGlobalRoot } from '../data/globalData.js';
import { getHtmlTagSuggestions } from '../data/htmlTagsData.js';
import {
  getMessageParamSuggestions,
  getSystemMessageSuggestions,
} from '../data/messagesCatalog.js';
import {
  bloggerOperatorsCatalog,
  getFunctionalOperatorSuggestions,
  getOperatorSuggestions,
} from '../data/operatorsData.js';
import { bloggerTags } from '../data/tagsData.js';
import { getPropertyMembers } from '../data/typeMembers.js';
import { getWidgetDescriptor } from '../data/widgetDescriptors.js';
import { blogWidgetProperties, singlePostProperties } from '../data/widgetsData.js';
import { getWidgetSettingsSuggestions } from '../data/widgetSettingsData.js';
import { resolveLambdaContextAtCursor } from '../parser/exprParser.js';
import {

  normalizeDocUrls,
  resolveHoverCardAtPosition,
  resolveLocalVariables,
} from './hoverCardResolver.js';
import {
  hasAttributeValueCompletions,
  isExpressionAttribute,
  parseTagAttributeContext,
  resolveBloggerTagSuggestions,
  resolveDefaultMarkupTypesSuggestions,
  resolveDescriptionsSuggestions,
  resolveSkinVariableTypesSuggestions,
  resolveTagAttributeSuggestions,
  resolveWidgetTypesSuggestions,

} from './tagAttributeResolver.js';

export {
  hasAttributeValueCompletions,
  isExpressionAttribute,
  normalizeDocUrls,
  parseTagAttributeContext,
};
export type {
  BloggerIncludablesInfo,
  BloggerResolverContext,
  LocalVariablesResolver,
  TagAttributeContext,
};

export interface PropertyNavigationResult {
  readonly target?: BloggerProperty | undefined;
  readonly children?: Record<string, BloggerProperty> | undefined;
}

const ATTR_VALUE_REGEX = /\b([\w:-]+)\s*=\s*["']([^"']*)$/;
const TAG_CONTEXT_REGEX = /<([\w:-]+)(?:\s[^>]*)?$/;
const DATA_PREFIX_REGEX = /(?:^|[^\w:.])(data:[[\]\w.]*)$/;
const TAG_PREFIX_REGEX = /(?:^|[^\w:])(?:(<\/|<)([\w:-]*)|(b:[\w-]*|data:?|Variable\w*|Group\w*))$/i;
const OPERATOR_TRIGGER_REGEX = /(?:data:[\w.[\]]*[\w\]]|[a-zA-Z_]\w*(?:\.\w+)*|\d+(?:\.\d+)?|"[^"]*"|'[^']*'|[)\]}])\s+([a-zA-Z_!=+\-*/?:%]*)$/;
const OPERAND_START_TRIGGER_REGEX = /(?:^|[=?:,(+\-*/%]|\b(?:and|or|not|eq|neq|lt|lte|gt|gte|to|in|contains)\b)\s*([a-zA-Z_!=]*)$/;

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
    return resolveDescriptionsSuggestions();
  }

  public resolveWidgetTypes(): readonly BloggerSuggestion[] {
    return resolveWidgetTypesSuggestions();
  }

  public resolveDefaultMarkupTypes(): readonly BloggerSuggestion[] {
    return resolveDefaultMarkupTypesSuggestions();
  }

  public resolveSkinVariableTypes(): readonly BloggerSuggestion[] {
    return resolveSkinVariableTypesSuggestions();
  }

  public resolveBloggerTags(hasOpenBracket: boolean, isClosingTag: boolean = false): readonly BloggerSuggestion[] {
    return resolveBloggerTagSuggestions(hasOpenBracket, isClosingTag);
  }

  public resolveExpressionContext(
    expressionText: string,
    localVariables?: Record<string, BloggerProperty>,
  ): BloggerResolveResult | undefined {
    // 1. Data path context (data: or data:path. or data:path.partial)
    const dataMatch = DATA_PREFIX_REGEX.exec(expressionText);
    if (dataMatch && dataMatch[1] !== undefined) {
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

    // 2. Lambda context (p => p.member or p => p)
    const lambdaContext = resolveLambdaContextAtCursor(expressionText, expressionText.length, localVariables);
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

    // 3. Bare local variable member navigation (e.g. post.title, item.author.)
    const bareMemberMatch = /(?:^|[^\w:.])([a-z_]\w*(?:\.\w+)*)\.(\w*)$/i.exec(expressionText);
    if (bareMemberMatch && bareMemberMatch[1]) {
      const rawChain = bareMemberMatch[1];
      const typedMember = bareMemberMatch[2] ?? '';
      const segments = rawChain.split('.').filter(Boolean);
      const resolved = this.resolvePropertyFromPath(segments, localVariables);
      if (resolved?.children) {
        const suggestions: BloggerSuggestion[] = Object.values(resolved.children).map(prop => ({
          name: prop.name,
          type: prop.type,
          description: prop.description,
          example: `${rawChain}.${prop.name}`,
          kind: 'property' as const,
          deprecated: prop.deprecated,
          docUrl: prop.docUrl,
        }));
        return {
          suggestions,
          replacementLength: typedMember.length,
        };
      }
      if (resolved) {
        return undefined;
      }
    }

    // 4. Infix operator position (<operand> <space> [partialOp])
    const opMatch = OPERATOR_TRIGGER_REGEX.exec(expressionText);
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

      const filtered = typedOp ? sorted.filter(op => op.name.startsWith(typedOp)) : sorted;
      if (filtered.length > 0) {
        return {
          suggestions: filtered,
          replacementLength: typedOp.length,
        };
      }
    }

    // 5. Operand start / Functional operator position
    const operandStartMatch = OPERAND_START_TRIGGER_REGEX.exec(expressionText);
    if (operandStartMatch) {
      const typedPrefix = operandStartMatch[1] ?? '';
      const functionalOps = getFunctionalOperatorSuggestions();

      const varSuggestions: BloggerSuggestion[] = localVariables
        ? Object.entries(localVariables)
            .filter(([name]) => !typedPrefix || name.startsWith(typedPrefix))
            .map(([name, prop]) => ({
              name,
              type: prop.type,
              kind: 'variable' as const,
              description: prop.description ?? `Local variable \`${name}\`.`,
              example: name,
            }))
        : [];

      const filteredOps = typedPrefix
        ? functionalOps.filter(k => k.name.startsWith(typedPrefix))
        : functionalOps;

      const dataPrefixSuggestions: BloggerSuggestion[] = [];
      if (!typedPrefix || 'data:'.startsWith(typedPrefix)) {
        dataPrefixSuggestions.push({
          name: 'data:',
          type: 'object',
          kind: 'property',
          detail: '(Blogger Data Prefix)',
          description: 'Blogger data expression prefix.',
          example: 'data:blog.title',
        });
      }

      const combined = [...dataPrefixSuggestions, ...varSuggestions, ...filteredOps];
      if (combined.length > 0) {
        return {
          suggestions: combined,
          replacementLength: typedPrefix.length,
        };
      }
    }

    return undefined;
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

      if (isExpressionAttribute(attrName, tagName)) {
        const localVariables = resolveLocalVariables(options?.localVariables);
        return this.resolveExpressionContext(typedText, localVariables);
      }
    }

    const tagAttrContext = parseTagAttributeContext(linePrefix);
    if (tagAttrContext) {
      const tagAttrSuggestions = resolveTagAttributeSuggestions(tagAttrContext);
      if (tagAttrSuggestions) {
        return tagAttrSuggestions;
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
    return resolveHoverCardAtPosition(
      (segments, localVars) => this.resolvePropertyFromPath(segments, localVars),
      lineText,
      character,
      precedingContext,
      options,
    );
  }
}
