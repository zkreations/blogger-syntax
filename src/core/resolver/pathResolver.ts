import type { BloggerProperty, BloggerResolveResult, BloggerSuggestion } from '../models/types.js';
import { bloggerDescriptions } from '../data/descriptions.js';
import { bloggerGlobalRoot } from '../data/globalData.js';
import { bloggerTags } from '../data/tagsData.js';
import { bloggerWidgetsSchema, singlePostProperties } from '../data/widgetsData.js';

export class BloggerPathResolver {
  private readonly rootTree: Record<string, BloggerProperty>;

  constructor() {
    this.rootTree = {
      ...bloggerGlobalRoot,
      // Alias 'post' directly to singlePostProperties for expressions like data:post.title
      post: {
        name: 'post',
        type: 'object',
        description: 'Current post object context.',
        children: singlePostProperties,
      },
    };

    // Link widgets schema (e.g. data:widgets.Blog.*)
    const widgetsProperty = this.rootTree.widgets;
    if (widgetsProperty && widgetsProperty.children) {
      this.rootTree.widgets = {
        ...widgetsProperty,
        children: {
          ...widgetsProperty.children,
          ...bloggerWidgetsSchema,
        },
      };
    }
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

    return Object.values(currentMap).map(prop => ({
      name: prop.name,
      type: prop.type,
      description: prop.description,
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
      kind: 'enumMember',
    }));
  }

  /**
   * Resolves suggestions for Blogger b:* tags
   */
  public resolveBloggerTags(hasOpenBracket: boolean): BloggerSuggestion[] {
    return Object.values(bloggerTags).map(tag => ({
      name: tag.name,
      type: 'string',
      description: tag.description,
      insertText: hasOpenBracket ? tag.snippetBody : `<${tag.snippetBody}`,
      isSnippet: true,
      kind: 'snippet',
    }));
  }

  /**
   * Analyzes the text preceding the cursor and returns appropriate suggestions and replacement length.
   */
  public resolveFromLinePrefix(linePrefix: string): BloggerResolveResult | undefined {
    // 1. Check for description attribute: description="..." or description='...'
    const descMatch = /\bdescription=["']([^"']*)$/.exec(linePrefix);
    if (descMatch) {
      const typedText = descMatch[1] ?? '';
      return {
        suggestions: this.resolveDescriptions(),
        replacementLength: typedText.length,
      };
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

    // 3. Check for Blogger tags: <b: or b:
    const tagMatch = /(?:^|[^\w:])(<)?(b:[\w-]*)$/.exec(linePrefix);
    if (tagMatch && tagMatch[2] !== undefined) {
      const hasOpenBracket = Boolean(tagMatch[1]);
      const typedTag = tagMatch[2]; // e.g. "b:", "b:i", "b:if"
      return {
        suggestions: this.resolveBloggerTags(hasOpenBracket),
        replacementLength: typedTag.length,
      };
    }

    return undefined;
  }
}
