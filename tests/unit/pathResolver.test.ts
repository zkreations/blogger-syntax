import { describe, expect, it } from 'vitest';
import { bloggerDescriptions } from '../../src/core/data/descriptions.js';
import { BloggerPathResolver } from '../../src/core/resolver/pathResolver.js';

describe('bloggerPathResolver', () => {
  const resolver = new BloggerPathResolver();

  describe('resolveDataPath', () => {
    it('should resolve root properties for empty path', () => {
      const suggestions = resolver.resolveDataPath([]);
      const names = suggestions.map(s => s.name);

      expect(names).toContain('blog');
      expect(names).toContain('messages');
      expect(names).toContain('skin');
      expect(names).toContain('view');
      expect(names).toContain('widget');
      expect(names).toContain('widgets');
      expect(names).toContain('post');
    });

    it('should resolve blog properties for ["blog"]', () => {
      const suggestions = resolver.resolveDataPath(['blog']);
      const names = suggestions.map(s => s.name);

      expect(names).toContain('title');
      expect(names).toContain('url');
      expect(names).toContain('homepageUrl');
      expect(names).toContain('locale');
      expect(names).toContain('pageType');
    });

    it('should resolve nested blog locale properties for ["blog", "locale"]', () => {
      const suggestions = resolver.resolveDataPath(['blog', 'locale']);
      const names = suggestions.map(s => s.name);

      expect(names).toEqual(['country', 'language', 'languageAlignment', 'languageDirection', 'name']);
    });

    it('should resolve view archive properties for ["view", "archive"]', () => {
      const suggestions = resolver.resolveDataPath(['view', 'archive']);
      const names = suggestions.map(s => s.name);

      expect(names).toEqual(['rangeMessage', 'day', 'month', 'year']);
    });

    it('should resolve view search properties for ["view", "search"]', () => {
      const suggestions = resolver.resolveDataPath(['view', 'search']);
      const names = suggestions.map(s => s.name);

      expect(names).toEqual(['resultsMessageHtml', 'resultsMessage', 'query', 'label']);
    });

    it('should resolve widgets list for ["widgets"]', () => {
      const suggestions = resolver.resolveDataPath(['widgets']);
      const names = suggestions.map(s => s.name);

      expect(names).toContain('AdSense');
      expect(names).toContain('Blog');
      expect(names).toContain('Header');
      expect(names).toContain('HTML');
    });

    it('should resolve Blog widget properties for ["widgets", "Blog"]', () => {
      const suggestions = resolver.resolveDataPath(['widgets', 'Blog']);
      const names = suggestions.map(s => s.name);

      expect(names).toContain('title');
      expect(names).toContain('numPosts');
      expect(names).toContain('posts');
      expect(names).toContain('messages');
    });

    it('should resolve post properties for ["post"]', () => {
      const suggestions = resolver.resolveDataPath(['post']);
      const names = suggestions.map(s => s.name);

      expect(names).toContain('id');
      expect(names).toContain('title');
      expect(names).toContain('body');
      expect(names).toContain('snippets');
      expect(names).toContain('author');
      expect(names).toContain('location');
    });

    it('should resolve post author properties for ["post", "author"]', () => {
      const suggestions = resolver.resolveDataPath(['post', 'author']);
      const names = suggestions.map(s => s.name);

      expect(names).toContain('name');
      expect(names).toContain('profileUrl');
      expect(names).toContain('authorPhoto');
      expect(names).toContain('aboutMe');
    });

    it('should resolve post author photo properties for ["post", "author", "authorPhoto"]', () => {
      const suggestions = resolver.resolveDataPath(['post', 'author', 'authorPhoto']);
      const names = suggestions.map(s => s.name);

      expect(names).toEqual(['image', 'width', 'height', 'alt']);
    });

    it('should resolve post snippet properties for ["post", "snippets"]', () => {
      const suggestions = resolver.resolveDataPath(['post', 'snippets']);
      const names = suggestions.map(s => s.name);

      expect(names).toEqual(['short', 'long']);
    });

    it('should resolve post location properties for ["post", "location"]', () => {
      const suggestions = resolver.resolveDataPath(['post', 'location']);
      const names = suggestions.map(s => s.name);

      expect(names).toEqual(['mapsUrl', 'name']);
    });

    it('should return empty array for invalid path', () => {
      const suggestions = resolver.resolveDataPath(['nonexistent', 'path']);
      expect(suggestions).toEqual([]);
    });

    it('should include contextual data path examples on suggestions', () => {
      const suggestions = resolver.resolveDataPath(['blog', 'locale']);
      const countrySuggestion = suggestions.find(s => s.name === 'country');
      expect(countrySuggestion).toBeDefined();
      expect(countrySuggestion!.example).toBe('data:blog.locale.country');
    });
  });

  describe('resolveDescriptions', () => {
    it('should return all descriptions with variable examples', () => {
      const suggestions = resolver.resolveDescriptions();
      expect(suggestions.length).toBe(bloggerDescriptions.length);
      expect(suggestions.every(s => s.kind === 'enumMember')).toBe(true);
      expect(suggestions.some(s => s.name === 'Blog Title')).toBe(true);
      expect(suggestions.some(s => s.name === 'Background Color')).toBe(true);
      const titleDesc = suggestions.find(s => s.name === 'Blog Title');
      expect(titleDesc!.example).toContain('<Variable name="myVar" description="Blog Title"');
    });
  });

  describe('resolveBloggerTags', () => {
    it('should propagate attributes and snippet body for tags', () => {
      const suggestions = resolver.resolveBloggerTags(true);
      const ifTag = suggestions.find(s => s.name === 'b:if');
      expect(ifTag).toBeDefined();
      expect(ifTag!.attributes).toBeDefined();
      expect(ifTag!.attributes!.cond).toBeDefined();
      expect(ifTag!.insertText).toBeDefined();
    });
  });

  describe('resolveFromLinePrefix', () => {
    it('should resolve root for line ending in "data:"', () => {
      const result = resolver.resolveFromLinePrefix('<div><data:');
      expect(result).toBeDefined();
      expect(result!.replacementLength).toBe(0);
      const names = result!.suggestions.map(s => s.name);
      expect(names).toContain('blog');
      expect(names).toContain('post');
    });

    it('should resolve blog for line ending in "data:blog."', () => {
      const result = resolver.resolveFromLinePrefix('expr:title=\'data:blog.');
      expect(result).toBeDefined();
      expect(result!.replacementLength).toBe(0);
      const names = result!.suggestions.map(s => s.name);
      expect(names).toContain('title');
      expect(names).toContain('homepageUrl');
    });

    it('should resolve parent suggestions when typing mid-word (data:blog.loc)', () => {
      const result = resolver.resolveFromLinePrefix('<span expr:text="data:blog.loc');
      expect(result).toBeDefined();
      expect(result!.replacementLength).toBe(3); // "loc".length
      const names = result!.suggestions.map(s => s.name);
      expect(names).toContain('locale');
      expect(names).toContain('title');
    });

    it('should resolve Blogger tags for "<b:"', () => {
      const result = resolver.resolveFromLinePrefix('<b:');
      expect(result).toBeDefined();
      expect(result!.replacementLength).toBe(2); // "b:".length
      const names = result!.suggestions.map(s => s.name);
      expect(names).toContain('b:if');
      expect(names).toContain('b:loop');
      expect(names).toContain('b:widget');
    });

    it('should resolve Blogger tags for "b:"', () => {
      const result = resolver.resolveFromLinePrefix('b:');
      expect(result).toBeDefined();
      expect(result!.replacementLength).toBe(2);
      const names = result!.suggestions.map(s => s.name);
      expect(names).toContain('b:if');
      expect(names).toContain('b:include');
    });

    it('should resolve skin descriptions for description="', () => {
      const result = resolver.resolveFromLinePrefix('<Variable name="test" description="');
      expect(result).toBeDefined();
      expect(result!.replacementLength).toBe(0);
      expect(result!.suggestions.length).toBe(bloggerDescriptions.length);
    });

    it('should resolve skin descriptions for description=\'Foo', () => {
      const result = resolver.resolveFromLinePrefix('<Group description=\'Foo');
      expect(result).toBeDefined();
      expect(result!.replacementLength).toBe(3);
      expect(result!.suggestions.length).toBe(bloggerDescriptions.length);
    });

    it('should resolve Blogger tags for "</b:" as closing tags', () => {
      const result = resolver.resolveFromLinePrefix('</b:');
      expect(result).toBeDefined();
      expect(result!.replacementLength).toBe(2); // "b:".length
      const ifTag = result!.suggestions.find(s => s.name === 'b:if');
      expect(ifTag).toBeDefined();
      expect(ifTag!.insertText).toBe('b:if>');
      expect(ifTag!.isSnippet).toBe(false);
    });

    it('should resolve Blogger tags for "</b:lo" with correct replacement length', () => {
      const result = resolver.resolveFromLinePrefix('<div>\n  </b:lo');
      expect(result).toBeDefined();
      expect(result!.replacementLength).toBe(4); // "b:lo".length
      const loopTag = result!.suggestions.find(s => s.name === 'b:loop');
      expect(loopTag).toBeDefined();
      expect(loopTag!.insertText).toBe('b:loop>');
      expect(loopTag!.isSnippet).toBe(false);
    });

    it('should return undefined for non-matching lines', () => {
      const result = resolver.resolveFromLinePrefix('<div class="container">');
      expect(result).toBeUndefined();
    });
  });
});
