import { describe, expect, it } from 'vitest';
import { skinProperties, widgetsMapProperties } from '../../src/core/data/globalData.js';
import { bloggerTags } from '../../src/core/data/tagsData.js';
import { BloggerPathResolver } from '../../src/core/resolver/pathResolver.js';

describe('plan 1: Data Model Integrity & Canonical Specifications', () => {
  const resolver = new BloggerPathResolver();

  describe('data:skin model correction', () => {
    it('should type skin.override as string and skin.vars as object', () => {
      expect(skinProperties.override?.type).toBe('string');
      expect(skinProperties.vars?.type).toBe('object');
    });

    it('should suggest string members for data:skin.override', () => {
      const suggestions = resolver.resolveDataPath(['skin', 'override']).map(s => s.name);
      expect(suggestions).toContain('escaped');
      expect(suggestions).toContain('length');
      expect(suggestions).toContain('size');
    });
  });

  describe('data:widgets collection typing and linkage', () => {
    it('should model data:widgets.Blog as an array of Blog widgets', () => {
      const blogEntry = widgetsMapProperties.Blog;
      expect(blogEntry?.type).toBe('array');
      expect(blogEntry?.itemChildren).toBeDefined();

      const arraySuggestions = resolver.resolveDataPath(['widgets', 'Blog']).map(s => s.name);
      expect(arraySuggestions).toContain('first');
      expect(arraySuggestions).toContain('last');
      expect(arraySuggestions).toContain('size');
      expect(arraySuggestions).not.toContain('title');

      const itemSuggestions = resolver.resolveDataPath(['widgets', 'Blog', 'first']).map(s => s.name);
      expect(itemSuggestions).toContain('title');
      expect(itemSuggestions).toContain('posts');
    });

    it('should strictly expose base layout descriptors on standard gadgets under data:widgets without leaking private data', () => {
      const headerItemProps = resolver.resolveDataPath(['widgets', 'Header', 'first']).map(s => s.name);
      expect(headerItemProps).toEqual(['id', 'sectionId', 'title', 'type']);
      expect(headerItemProps).not.toContain('description');

      const labelItemProps = resolver.resolveDataPath(['widgets', 'Label', 'first']).map(s => s.name);
      expect(labelItemProps).toEqual(['id', 'sectionId', 'title', 'type']);
      expect(labelItemProps).not.toContain('labels');
      expect(labelItemProps).not.toContain('display');

      const popularPostsProps = resolver.resolveDataPath(['widgets', 'PopularPosts', 'first']).map(s => s.name);
      expect(popularPostsProps).toContain('id');
      expect(popularPostsProps).toContain('sectionId');
      expect(popularPostsProps).toContain('title');
      expect(popularPostsProps).toContain('type');
      expect(popularPostsProps).toContain('posts');
      expect(popularPostsProps).not.toContain('description');

      const featuredPostProps = resolver.resolveDataPath(['widgets', 'FeaturedPost', 'first']).map(s => s.name);
      expect(featuredPostProps).toEqual(['id', 'sectionId', 'title', 'type', 'postId']);
    });

    it('should support direct ID, array modifier, and array indexing access patterns on data:widgets', () => {
      // 1. Direct ID access
      const blog1Props = resolver.resolveDataPath(['widgets', 'Blog1']).map(s => s.name);
      expect(blog1Props).toContain('title');
      expect(blog1Props).toContain('posts');
      expect(blog1Props).toContain('headerByline');
      expect(blog1Props).not.toContain('numPosts');

      const header1Props = resolver.resolveDataPath(['widgets', 'Header1']).map(s => s.name);
      expect(header1Props).toEqual(['id', 'sectionId', 'title', 'type']);

      // 2. Array modifier (.first)
      const blogFirstProps = resolver.resolveDataPath(['widgets', 'Blog', 'first']).map(s => s.name);
      expect(blogFirstProps).toContain('posts');

      // 3. Array indexing on data:widgets and data:widgets.Blog
      const indexedWidgetProps = resolver.resolveDataPath(['widgets[0]']).map(s => s.name);
      expect(indexedWidgetProps).toEqual(['id', 'sectionId', 'title', 'type']);

      const indexedBlogProps = resolver.resolveDataPath(['widgets', 'Blog[0]']).map(s => s.name);
      expect(indexedBlogProps).toContain('posts');
    });
  });

  describe('array property isolation (no item property leakage)', () => {
    it('should not leak post properties onto data:posts array', () => {
      const postsProps = resolver.resolveDataPath(['posts']).map(s => s.name);
      expect(postsProps).not.toContain('title');
      expect(postsProps).not.toContain('body');
      expect(postsProps).not.toContain('author');
      expect(postsProps).toContain('size');
      expect(postsProps).toContain('first');
    });

    it('should expose item properties on .first and .last', () => {
      const firstProps = resolver.resolveDataPath(['posts', 'first']).map(s => s.name);
      expect(firstProps).toContain('title');
      expect(firstProps).toContain('body');
      expect(firstProps).toContain('author');
    });
  });

  describe('blogger tags and canonical attribute specifications', () => {
    it('should include b:template-script tag with name attribute', () => {
      const scriptTag = bloggerTags['b:template-script'];
      expect(scriptTag).toBeDefined();
      expect(scriptTag?.attributes?.name).toBeDefined();
      expect(scriptTag?.attributes?.name?.required).toBe(true);
    });

    it('should include v3 attributes and clean snippet for b:section, excluding deprecated ones', () => {
      const section = bloggerTags['b:section'];
      expect(section).toBeDefined();
      expect(section?.snippetBody).toContain('tag=');
      expect(section?.snippetBody).not.toContain('maxwidgets=');

      const attrs = section?.attributes ?? {};
      expect(attrs.tag).toBeDefined();
      expect(attrs.name).toBeDefined();
      expect(attrs.cond).toBeDefined();
      expect(attrs.maxwidgets).toBeUndefined();
      expect(attrs.growth).toBeUndefined();
      expect(attrs.preferred).toBeDefined();
      expect(attrs.preferred?.values).toEqual(['yes', 'no']);
    });

    it('should enforce title as required on b:widget and support cond and visible', () => {
      const widget = bloggerTags['b:widget'];
      expect(widget).toBeDefined();
      expect(widget?.attributes?.title?.required).toBe(true);
      expect(widget?.attributes?.cond).toBeDefined();
      expect(widget?.attributes?.visible).toBeDefined();
      expect(widget?.attributes?.mobile).toBeUndefined();
    });

    it('should support cond on b:include, b:attr and b:class', () => {
      expect(bloggerTags['b:include']?.attributes?.cond).toBeDefined();
      expect(bloggerTags['b:attr']?.attributes?.cond).toBeDefined();
      expect(bloggerTags['b:class']?.attributes?.cond).toBeDefined();
    });

    it('should support reverse on b:loop and render on b:comment', () => {
      expect(bloggerTags['b:loop']?.attributes?.reverse).toBeDefined();
      expect(bloggerTags['b:comment']?.attributes?.render).toBeDefined();
    });

    it('should support Theme Designer CSS attributes on Variable tag', () => {
      const vAttrs = bloggerTags.Variable?.attributes ?? {};
      expect(vAttrs.color).toBeDefined();
      expect(vAttrs.family).toBeDefined();
      expect(vAttrs.size).toBeDefined();
      expect(vAttrs.min).toBeDefined();
      expect(vAttrs.max).toBeDefined();
      expect(vAttrs.hideEditor).toBeDefined();
    });
  });
});
