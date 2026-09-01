import type {
  BloggerDataType,
  BloggerHoverResult,
  BloggerProperty,
  BloggerResolveResult,
  BloggerSuggestion,
} from '../models/types.js';
import { bloggerCommonAttributes, bloggerExprPrefixInfo } from '../data/attributesData.js';
import { bloggerDescriptions } from '../data/descriptions.js';
import { bloggerGlobalRoot } from '../data/globalData.js';
import { bloggerTags } from '../data/tagsData.js';
import {
  bloggerDefaultMarkupTypeDetails,
  bloggerDefaultMarkupTypes,
  bloggerWidgetTypeDetails,
  bloggerWidgetTypes,
} from '../data/widgetTypes.js';

const ATTR_VALUE_REGEX = /\b([\w:-]+)\s*=\s*["']([^"']*)$/;
const TAG_CONTEXT_REGEX = /<([\w:-]+)(?:\s[^>]*)?$/;
const DATA_PREFIX_REGEX = /(?:^|[^\w:.])(data:[\w.]*)$/;
const TAG_PREFIX_REGEX = /(?:^|[^\w:])(?:(<\/|<)(b:[\w-]*|Var\w*|Gro\w*)?|(b:[\w-]*|Variable\w*|Group\w*))$/i;
const HOVER_DATA_REGEX = /(?:^|[^\w:.])(data:[\w.]*)/g;
const HOVER_TAG_REGEX = /(<\/?)(b:[\w-]+|Variable|Group)/g;
const HOVER_EXPR_REGEX = /\b(expr:[\w-]*)/g;
const HOVER_ATTR_REGEX = /\b([\w-]+)\s*=/g;

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

function createTagSuggestions(hasOpenBracket: boolean, isClosingTag: boolean): readonly BloggerSuggestion[] {
  return Object.freeze(
    Object.values(bloggerTags).map((tag) => {
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

  private navigatePath(segments: readonly string[]): { target?: BloggerProperty | undefined; children?: Record<string, BloggerProperty> | undefined } | undefined {
    let currentMap: Record<string, BloggerProperty> | undefined = this.rootTree;
    let targetProperty: BloggerProperty | undefined;

    for (const segment of segments) {
      if (!currentMap || !segment) {
        return undefined;
      }
      targetProperty = currentMap[segment];
      if (!targetProperty) {
        return undefined;
      }
      currentMap = targetProperty.children;
    }

    return { target: targetProperty, children: currentMap };
  }

  public resolvePropertyFromPath(segments: readonly string[]): BloggerProperty | undefined {
    if (segments.length === 0) {
      return undefined;
    }
    return this.navigatePath(segments)?.target;
  }

  public resolveDataPath(segments: readonly string[]): readonly BloggerSuggestion[] {
    if (segments.length === 0) {
      return Object.values(this.rootTree).map(prop => this.mapPropertyToSuggestion(prop));
    }

    const node = this.navigatePath(segments);
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

  public resolveBloggerTags(hasOpenBracket: boolean, isClosingTag: boolean = false): readonly BloggerSuggestion[] {
    if (isClosingTag) {
      return STATIC_TAG_SUGGESTIONS_CLOSE;
    }
    return hasOpenBracket ? STATIC_TAG_SUGGESTIONS_OPEN : STATIC_TAG_SUGGESTIONS_BARE;
  }

  public resolveFromLinePrefix(linePrefix: string): BloggerResolveResult | undefined {
    const attrMatch = ATTR_VALUE_REGEX.exec(linePrefix);
    if (attrMatch && attrMatch[1] && attrMatch[2] !== undefined) {
      const attrName = attrMatch[1];
      const typedText = attrMatch[2];
      const beforeAttr = linePrefix.slice(0, attrMatch.index);
      const tagMatch = TAG_CONTEXT_REGEX.exec(beforeAttr)
        || /(?:^|\s)([\w:-]+)(?:\s[^>]*)?$/.exec(beforeAttr);
      const tagName = tagMatch?.[1];

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
    }

    const dataMatch = DATA_PREFIX_REGEX.exec(linePrefix);
    if (dataMatch && dataMatch[1] !== undefined) {
      const fullExpression = dataMatch[1];
      const rawPath = fullExpression.slice('data:'.length);

      if (rawPath === '') {
        return {
          suggestions: this.resolveDataPath([]),
          replacementLength: 0,
        };
      }

      if (rawPath.endsWith('.')) {
        const segments = rawPath.slice(0, -1).split('.').filter(Boolean);
        return {
          suggestions: this.resolveDataPath(segments),
          replacementLength: 0,
        };
      }

      const segments = rawPath.split('.').filter(Boolean);
      const lastSegment = segments.pop() ?? '';
      return {
        suggestions: this.resolveDataPath(segments),
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
        const rawPath = token.slice('data:'.length);
        const segments = rawPath.split('.').filter(Boolean);
        const resolved = this.resolvePropertyFromPath(segments);
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

        const attrDef = bloggerCommonAttributes[attrName];
        if (attrDef) {
          return {
            hover: {
              title: attrName,
              category: 'attribute',
              type: attrDef.type,
              description: attrDef.description,
              docUrls: normalizeDocUrls(attrDef.docUrl),
            },
            range: { start: tokenStart, end: tokenEnd },
          };
        }
      }
    }

    return undefined;
  }
}
