import { describe, expect, it } from 'vitest';
import { blogWidgetProperties, labelWidgetProperties, singlePostProperties } from '../../src/core/data/widgetsData.js';
import { BloggerPathResolver, parseTagAttributeContext } from '../../src/core/resolver/pathResolver.js';

describe('tag attribute completion & canonical data:widgets descriptors', () => {
  const resolver = new BloggerPathResolver();
  const blogContext = {
    localVariables: {
      post: {
        name: 'post',
        type: 'object' as const,
        children: singlePostProperties,
      },
      ...blogWidgetProperties,
    },
    widgetType: 'Blog',
  };

  describe('parseTagAttributeContext parser', () => {
    it('should detect open tag when cursor is after tag name space', () => {
      const ctx = parseTagAttributeContext('<b:section ');
      expect(ctx).toBeDefined();
      expect(ctx?.tagName).toBe('b:section');
      expect(ctx?.typedPrefix).toBe('');
      expect(ctx?.existingAttrs.size).toBe(0);
    });

    it('should detect typed attribute prefix', () => {
      const ctx = parseTagAttributeContext('<b:section id="main" ta');
      expect(ctx).toBeDefined();
      expect(ctx?.tagName).toBe('b:section');
      expect(ctx?.typedPrefix).toBe('ta');
      expect(ctx?.existingAttrs.has('id')).toBe(true);
    });

    it('should return undefined when cursor is inside attribute value quotes', () => {
      const ctx = parseTagAttributeContext('<b:section id="main');
      expect(ctx).toBeUndefined();
    });

    it('should return undefined when tag is closed', () => {
      const ctx = parseTagAttributeContext('<b:section id="main">');
      expect(ctx).toBeUndefined();
    });

    it('should work across newlines for multi-line tags', () => {
      const multiline = '<b:section\n  id="main"\n  ';
      const ctx = parseTagAttributeContext(multiline);
      expect(ctx).toBeDefined();
      expect(ctx?.tagName).toBe('b:section');
      expect(ctx?.typedPrefix).toBe('');
      expect(ctx?.existingAttrs.has('id')).toBe(true);
    });
  });

  describe('attribute autocompletion via resolveFromLinePrefix', () => {
    it('should suggest attributes for <b:section and exclude deprecated ones', () => {
      const result = resolver.resolveFromLinePrefix('<b:section ');
      expect(result).toBeDefined();
      const names = result!.suggestions.map(s => s.name);
      expect(names).toContain('id');
      expect(names).toContain('class');
      expect(names).toContain('tag');
      expect(names).toContain('name');
      expect(names).toContain('showaddelement');
      expect(names).toContain('preferred');
      expect(names).toContain('cond');

      // Never suggest deprecated attributes
      expect(names).not.toContain('growth');
      expect(names).not.toContain('mobile');
      expect(names).not.toContain('maxwidgets');

      const tagAttr = result!.suggestions.find(s => s.name === 'tag');
      expect(tagAttr?.insertText).toBe('tag="$1"');
      expect(tagAttr?.isSnippet).toBe(true);
    });

    it('should exclude already defined attributes', () => {
      const result = resolver.resolveFromLinePrefix('<b:section id="main" tag="main" ');
      expect(result).toBeDefined();
      const names = result!.suggestions.map(s => s.name);
      expect(names).not.toContain('id');
      expect(names).not.toContain('tag');
      expect(names).toContain('class');
      expect(names).toContain('name');
      expect(names).toContain('showaddelement');
      expect(names).toContain('cond');
    });

    it('should calculate correct replacementLength when typing an attribute prefix', () => {
      const result = resolver.resolveFromLinePrefix('<b:section id="main" ta');
      expect(result).toBeDefined();
      expect(result?.replacementLength).toBe(2);
      const names = result!.suggestions.map(s => s.name);
      expect(names).toContain('tag');
    });

    it('should suggest reverse attribute for <b:loop', () => {
      const result = resolver.resolveFromLinePrefix('<b:loop values="data:posts" var="post" ');
      expect(result).toBeDefined();
      const names = result!.suggestions.map(s => s.name);
      expect(names).toContain('reverse');
      expect(names).toContain('index');
      expect(names).not.toContain('values');
      expect(names).not.toContain('var');
    });

    it('should suggest render attribute for <b:comment', () => {
      const result = resolver.resolveFromLinePrefix('<b:comment ');
      expect(result).toBeDefined();
      const names = result!.suggestions.map(s => s.name);
      expect(names).toContain('render');
    });

    it('should suggest skin variable attributes for <Variable', () => {
      const result = resolver.resolveFromLinePrefix('<Variable ');
      expect(result).toBeDefined();
      const names = result!.suggestions.map(s => s.name);
      expect(names).toContain('name');
      expect(names).toContain('description');
      expect(names).toContain('type');
      expect(names).toContain('default');
      expect(names).toContain('value');
      expect(names).toContain('color');
      expect(names).toContain('family');
      expect(names).toContain('size');
      expect(names).toContain('min');
      expect(names).toContain('max');
      expect(names).toContain('hideEditor');
    });

    it('should suggest skin group attributes for <Group', () => {
      const result = resolver.resolveFromLinePrefix('<Group ');
      expect(result).toBeDefined();
      const names = result!.suggestions.map(s => s.name);
      expect(names).toContain('description');
      expect(names).toContain('selector');
    });
  });

  describe('attribute values autocompletion', () => {
    it('should suggest semantic HTML tags for <b:section tag="', () => {
      const result = resolver.resolveFromLinePrefix('<b:section tag="');
      expect(result).toBeDefined();
      const values = result!.suggestions.map(s => s.name);
      expect(values).toContain('main');
      expect(values).toContain('section');
      expect(values).toContain('header');
      expect(values).toContain('footer');
      expect(values).toContain('aside');
      expect(values).toContain('nav');
    });

    it('should suggest boolean values for <b:loop reverse="', () => {
      const result = resolver.resolveFromLinePrefix('<b:loop reverse="');
      expect(result).toBeDefined();
      const values = result!.suggestions.map(s => s.name);
      expect(values).toEqual(['true', 'false']);
    });

    it('should suggest boolean values for <b:comment render="', () => {
      const result = resolver.resolveFromLinePrefix('<b:comment render="');
      expect(result).toBeDefined();
      const values = result!.suggestions.map(s => s.name);
      expect(values).toEqual(['true', 'false']);
    });

    it('should suggest yes/no for <b:section showaddelement="', () => {
      const result = resolver.resolveFromLinePrefix('<b:section showaddelement="');
      expect(result).toBeDefined();
      const values = result!.suggestions.map(s => s.name);
      expect(values).toEqual(['yes', 'no']);
    });
  });

  describe('canonical data:widgets schema & access patterns', () => {
    it('should provide descriptor properties for direct ID access data:widgets.Blog1', () => {
      const result = resolver.resolveFromLinePrefix('data:widgets.Blog1.');
      expect(result).toBeDefined();
      const names = result!.suggestions.map(s => s.name);
      expect(names).toContain('id');
      expect(names).toContain('sectionId');
      expect(names).toContain('title');
      expect(names).toContain('type');
      expect(names).toContain('posts');
      expect(names).toContain('headerByline');
      expect(names).toContain('footerBylines');
      expect(names).toContain('allBylineItems');

      // CRITICAL: Ensure private Blog data does NOT leak into descriptor!
      expect(names).not.toContain('numPosts');
      expect(names).not.toContain('messages');
      expect(names).not.toContain('feedLinks');
      expect(names).not.toContain('olderPageUrl');
    });

    it('should resolve posts summary in data:widgets.Blog1.posts.first', () => {
      const result = resolver.resolveFromLinePrefix('data:widgets.Blog1.posts.first.');
      expect(result).toBeDefined();
      const names = result!.suggestions.map(s => s.name);
      expect(names).toEqual(['id', 'title', 'featuredImage', 'showInlineAds']);
      expect(names).not.toContain('body');
      expect(names).not.toContain('author');
      expect(names).not.toContain('comments');
    });

    it('should support array modifier data:widgets.Blog.first', () => {
      const result = resolver.resolveFromLinePrefix('data:widgets.Blog.first.');
      expect(result).toBeDefined();
      const names = result!.suggestions.map(s => s.name);
      expect(names).toContain('posts');
      expect(names).toContain('title');
      expect(names).not.toContain('numPosts');
    });

    it('should support array indexing data:widgets.Blog[0]', () => {
      const result = resolver.resolveFromLinePrefix('data:widgets.Blog[0].');
      expect(result).toBeDefined();
      const names = result!.suggestions.map(s => s.name);
      expect(names).toContain('posts');
      expect(names).toContain('title');
      expect(names).not.toContain('numPosts');
    });

    it('should support array indexing on root collection data:widgets[0]', () => {
      const result = resolver.resolveFromLinePrefix('data:widgets[0].');
      expect(result).toBeDefined();
      const names = result!.suggestions.map(s => s.name);
      expect(names).toEqual(['id', 'sectionId', 'title', 'type']);
    });

    it('should support direct ID on non-extended gadget data:widgets.Header1 with strictly base descriptor', () => {
      const result = resolver.resolveFromLinePrefix('data:widgets.Header1.');
      expect(result).toBeDefined();
      const names = result!.suggestions.map(s => s.name);
      expect(names).toEqual(['id', 'sectionId', 'title', 'type']);
      expect(names).not.toContain('description');
      expect(names).not.toContain('sourceUrl');
    });

    it('should support FeaturedPost descriptor with postId', () => {
      const result = resolver.resolveFromLinePrefix('data:widgets.FeaturedPost1.');
      expect(result).toBeDefined();
      const names = result!.suggestions.map(s => s.name);
      expect(names).toEqual(['id', 'sectionId', 'title', 'type', 'postId']);
    });

    it('should support PopularPosts descriptor with summary posts', () => {
      const result = resolver.resolveFromLinePrefix('data:widgets.PopularPosts1.');
      expect(result).toBeDefined();
      const names = result!.suggestions.map(s => s.name);
      expect(names).toEqual(['id', 'sectionId', 'title', 'type', 'posts']);

      const postItems = resolver.resolveFromLinePrefix('data:widgets.PopularPosts1.posts.first.');
      expect(postItems).toBeDefined();
      expect(postItems!.suggestions.map(s => s.name)).toEqual(['id', 'title']);
    });

    it('should support ReportAbuse descriptor with base properties', () => {
      const result = resolver.resolveFromLinePrefix('data:widgets.ReportAbuse1.');
      expect(result).toBeDefined();
      const names = result!.suggestions.map(s => s.name);
      expect(names).toEqual(['id', 'sectionId', 'title', 'type']);
    });
  });

  describe('hover cards for tag, reverse, render', () => {
    it('should show hover card for tag in <b:section tag="main">', () => {
      const line = '<b:section id="main" tag="main">';
      const hover = resolver.resolveHoverAtPosition(line, line.indexOf('tag'));
      expect(hover).toBeDefined();
      expect(hover?.hover.title).toBe('tag');
      expect(hover?.hover.category).toBe('attribute');
      expect(hover?.hover.description).toContain('Semantic HTML5 container element');
      expect(hover?.hover.docUrls).toContain('https://bloggercode.orbiona.com/2016/03/tag-b-section.html');
    });

    it('should show hover card for reverse in <b:loop reverse="true">', () => {
      const line = '<b:loop values="data:posts" reverse="true">';
      const hover = resolver.resolveHoverAtPosition(line, line.indexOf('reverse'));
      expect(hover).toBeDefined();
      expect(hover?.hover.title).toBe('reverse');
      expect(hover?.hover.category).toBe('attribute');
      expect(hover?.hover.description).toContain('reverse order');
      expect(hover?.hover.docUrls).toContain('https://bloggercode.orbiona.com/2016/03/tag-b-loop.html');
    });

    it('should show hover card for render in <b:comment render="true">', () => {
      const line = '<b:comment render="true">';
      const hover = resolver.resolveHoverAtPosition(line, line.indexOf('render'));
      expect(hover).toBeDefined();
      expect(hover?.hover.title).toBe('render');
      expect(hover?.hover.category).toBe('attribute');
      expect(hover?.hover.description).toContain('HTML comment');
      expect(hover?.hover.docUrls).toContain('https://bloggercode.orbiona.com/2018/02/tag-b-comments.html');
    });
  });

  describe('post labels schema', () => {
    it('should strictly suggest name and url for post.labels.first. and not count or cssSize', () => {
      const result = resolver.resolveFromLinePrefix('<data:post.labels.first.', blogContext);
      expect(result).toBeDefined();
      const names = result!.suggestions.map(s => s.name);
      expect(names).toEqual(['name', 'url']);
      expect(names).not.toContain('count');
      expect(names).not.toContain('cssSize');
    });

    it('should strictly suggest name and url for posts.first.labels[0]. and not count or cssSize', () => {
      const result = resolver.resolveFromLinePrefix('data:posts.first.labels[0].', blogContext);
      expect(result).toBeDefined();
      const names = result!.suggestions.map(s => s.name);
      expect(names).toEqual(['name', 'url']);
      expect(names).not.toContain('count');
      expect(names).not.toContain('cssSize');
    });

    it('should maintain count and cssSize for Label widget data:labels.first.', () => {
      const result = resolver.resolveDataPath(['labels', 'first'], labelWidgetProperties);
      expect(result).toBeDefined();
      const names = result.map(s => s.name);
      expect(names).toContain('name');
      expect(names).toContain('count');
      expect(names).toContain('url');
      expect(names).toContain('cssSize');
    });
  });
});
