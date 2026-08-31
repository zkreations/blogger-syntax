import type { BloggerHoverResult, BloggerProperty, BloggerResolveResult, BloggerSuggestion } from '../models/types.js';
import { bloggerCommonAttributes, bloggerExprPrefixInfo } from '../data/attributesData.js';
import { bloggerDescriptions } from '../data/descriptions.js';
import { bloggerGlobalRoot } from '../data/globalData.js';
import { bloggerTags } from '../data/tagsData.js';
import { bloggerWidgetsSchema, singlePostProperties } from '../data/widgetsData.js';
import {
  bloggerDefaultMarkupTypeDetails,
  bloggerDefaultMarkupTypes,
  bloggerWidgetTypeDetails,
  bloggerWidgetTypes,
} from '../data/widgetTypes.js';

function normalizeDocUrls(docUrl?: string | readonly string[]): readonly string[] | undefined {
  if (!docUrl) {
    return undefined;
  }
  if (typeof docUrl === 'string') {
    return [docUrl];
  }
  return docUrl;
}

function createBloggerRootTree(): Record<string, BloggerProperty> {
  const tree: Record<string, BloggerProperty> = {
    ...bloggerGlobalRoot,
    posts: {
      name: 'posts',
      type: 'array',
      description: 'Collection of posts available in the current widget context.',
      docUrl: 'https://bloggercode.orbiona.com/1971/08/data-posts.html',
      children: singlePostProperties,
    },
    post: {
      name: 'post',
      type: 'object',
      description: 'Current post object context.',
      children: singlePostProperties,
    },
  };

  const widgetsProperty = tree.widgets;
  if (widgetsProperty && widgetsProperty.children) {
    tree.widgets = {
      ...widgetsProperty,
      children: {
        ...widgetsProperty.children,
        ...bloggerWidgetsSchema,
      },
    };
  }

  return tree;
}

const STATIC_ROOT_TREE = createBloggerRootTree();

export class BloggerPathResolver {
  private readonly rootTree: Record<string, BloggerProperty> = STATIC_ROOT_TREE;

  /**
   * Resolves a property from a sequence of path segments (e.g. ['blog', 'locale', 'country'])
   */
  public resolvePropertyFromPath(segments: readonly string[]): BloggerProperty | undefined {
    if (segments.length === 0) {
      return undefined;
    }

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

    return targetProperty;
  }

  /**
   * Resolves suggestions given a dot-separated data path (e.g. ['blog', 'locale'] or [] for root)
   */
  public resolveDataPath(segments: readonly string[]): BloggerSuggestion[] {
    if (segments.length === 0) {
      return Object.values(this.rootTree).map(prop => ({
        name: prop.name,
        type: prop.type,
        description: prop.description,
        example: prop.example ?? `data:${prop.name}`,
        deprecated: prop.deprecated,
        docUrl: prop.docUrl,
        kind: 'property',
      }));
    }

    let currentMap: Record<string, BloggerProperty> | undefined = this.rootTree;
    let targetProperty: BloggerProperty | undefined;

    for (const segment of segments) {
      if (!currentMap || !segment) {
        return [];
      }
      targetProperty = currentMap[segment];
      if (!targetProperty) {
        return [];
      }
      currentMap = targetProperty.children;
    }

    if (!currentMap) {
      return [];
    }

    const basePath = segments.join('.');
    return Object.values(currentMap).map(prop => ({
      name: prop.name,
      type: prop.type,
      description: prop.description,
      example: prop.example ?? `data:${basePath}.${prop.name}`,
      deprecated: prop.deprecated,
      docUrl: prop.docUrl,
      kind: 'property',
    }));
  }

  /**
   * Resolves suggestions for Blogger skin / designer descriptions
   */
  public resolveDescriptions(): BloggerSuggestion[] {
    return bloggerDescriptions.map(desc => ({
      name: desc,
      type: 'string',
      description: `Blogger Skin Variable / Group description: "${desc}"`,
      example: `<Variable name="myVar" description="${desc}" type="color" default="#000000" value="#000000"/>`,
      kind: 'enumMember',
    }));
  }

  /**
   * Resolves suggestions for Blogger b:widget type attribute
   */
  public resolveWidgetTypes(): BloggerSuggestion[] {
    return bloggerWidgetTypes.map((widgetType) => {
      const details = bloggerWidgetTypeDetails[widgetType];
      const docUrl = details?.docUrl ?? 'https://bloggercode.orbiona.com/2016/03/tag-b-widget.html';
      const description = details?.description ?? `Blogger ${widgetType} widget.`;

      return {
        name: widgetType,
        type: 'string',
        kind: 'enumMember',
        detail: '(Blogger Widget Type)',
        description,
        example: `<b:widget id="${widgetType}1" type="${widgetType}" version="2">\n\t<b:includable id="main">\n\t\t\n\t</b:includable>\n</b:widget>`,
        docUrl,
      };
    });
  }

  /**
   * Resolves suggestions for Blogger b:defaultmarkup type attribute
   */
  public resolveDefaultMarkupTypes(): BloggerSuggestion[] {
    return bloggerDefaultMarkupTypes.map((markupType) => {
      const details = bloggerDefaultMarkupTypeDetails[markupType] ?? bloggerWidgetTypeDetails[markupType];
      const docUrl = details?.docUrl ?? 'https://bloggercode.orbiona.com/2017/05/tag-b-defaultmarkups.html';
      const description = details?.description ?? `Default template markup for ${markupType} widget type.`;

      return {
        name: markupType,
        type: 'string',
        kind: 'enumMember',
        detail: '(Blogger Default Markup Type)',
        description,
        example: `<b:defaultmarkup type="${markupType}">\n\t<b:includable id="main">\n\t\t\n\t</b:includable>\n</b:defaultmarkup>`,
        docUrl,
      };
    });
  }

  /**
   * Resolves suggestions for Blogger b:* tags
   */
  public resolveBloggerTags(hasOpenBracket: boolean, isClosingTag: boolean = false): BloggerSuggestion[] {
    return Object.values(bloggerTags).map((tag) => {
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
        type: 'string',
        description: tag.description,
        insertText,
        isSnippet,
        kind: 'snippet',
        example: tag.example,
        attributes: tag.attributes,
        docUrl: tag.docUrl,
      };
    });
  }

  /**
   * Analyzes the text preceding the cursor and returns appropriate suggestions and replacement length.
   */
  public resolveFromLinePrefix(linePrefix: string): BloggerResolveResult | undefined {
    // 1. Check for attribute value completions (e.g. description="...", b:widget type="...", b:defaultmarkup type="...")
    const attrMatch = /\b([\w:-]+)\s*=\s*["']([^"']*)$/.exec(linePrefix);
    if (attrMatch && attrMatch[1] && attrMatch[2] !== undefined) {
      const attrName = attrMatch[1];
      const typedText = attrMatch[2];
      const beforeAttr = linePrefix.slice(0, attrMatch.index);

      if (attrName === 'description') {
        return {
          suggestions: this.resolveDescriptions(),
          replacementLength: typedText.length,
        };
      }

      if (attrName === 'type') {
        const tagMatch = /<([\w:-]+)(?:\s[^>]*)?$/.exec(beforeAttr)
          || /(?:^|\s)([\w:-]+)(?:\s[^>]*)?$/.exec(beforeAttr);
        const tagName = tagMatch?.[1];

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

    // 2. Check for data: expression
    const dataMatch = /(?:^|[^\w:.])(data:[\w.]*)$/.exec(linePrefix);
    if (dataMatch && dataMatch[1] !== undefined) {
      const fullExpression = dataMatch[1]; // e.g. "data:", "data:blog.", "data:blog.loc"
      const rawPath = fullExpression.slice('data:'.length); // e.g. "", "blog.", "blog.loc"

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

    // 3. Check for Blogger tags: </b: or <b: or b:
    const tagMatch = /(?:^|[^\w:])(<\/|<)?(b:[\w-]*)$/.exec(linePrefix);
    if (tagMatch && tagMatch[2] !== undefined) {
      const bracketPrefix = tagMatch[1];
      const isClosingTag = bracketPrefix === '</';
      const hasOpenBracket = bracketPrefix === '<';
      const typedTag = tagMatch[2]; // e.g. "b:", "b:i", "b:if"
      return {
        suggestions: this.resolveBloggerTags(hasOpenBracket, isClosingTag),
        replacementLength: typedTag.length,
      };
    }

    return undefined;
  }

  /**
   * Resolves hover information at a specific character offset in a line of code.
   */
  public resolveHoverAtPosition(lineText: string, character: number): BloggerHoverResult | undefined {
    if (character < 0 || character > lineText.length) {
      return undefined;
    }

    // 1. Check data: expressions (e.g. data:blog.title, data:posts, data:view.isHomepage)
    const dataRegex = /(?:^|[^\w:.])(data:[\w.]*)/g;
    for (const match of lineText.matchAll(dataRegex)) {
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

    // 2. Check Blogger tags (e.g. <b:if>, </b:loop>, b:section)
    const tagRegex = /(<\/?)b:([\w-]+)/g;
    for (const match of lineText.matchAll(tagRegex)) {
      const tagBase = match[2];
      if (!tagBase || match.index === undefined) {
        continue;
      }
      const fullTagName = `b:${tagBase}`;
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

    // 3. Check expr: prefix attributes (e.g. expr:class, expr:title, expr:href)
    const exprRegex = /\b(expr:[\w-]*)/g;
    for (const match of lineText.matchAll(exprRegex)) {
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

    // 4. Check known Blogger tag attributes (e.g. cond=, maxwidgets=, locked=, values=)
    const attrRegex = /\b([\w-]+)\s*=/g;
    for (const match of lineText.matchAll(attrRegex)) {
      const attrName = match[1];
      if (!attrName || attrName.startsWith('expr:') || match.index === undefined) {
        continue;
      }
      const tokenStart = match.index;
      const tokenEnd = tokenStart + attrName.length;

      if (character >= tokenStart && character <= tokenEnd) {
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
