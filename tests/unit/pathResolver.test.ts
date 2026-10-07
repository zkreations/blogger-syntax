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
      expect(names).toContain('template');
      expect(names).not.toContain('post');
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

    it('should resolve template properties for ["template"]', () => {
      const suggestions = resolver.resolveDataPath(['template']);
      const names = suggestions.map(s => s.name);

      expect(names).toContain('isResponsive');
      expect(names).toContain('isCustom');
      expect(names).toContain('isAlternateRendering');
      expect(names).toContain('name');
      expect(names).toContain('variant');
    });

    it('should resolve nested blog locale properties for ["blog", "locale"]', () => {
      const suggestions = resolver.resolveDataPath(['blog', 'locale']);
      const names = suggestions.map(s => s.name);

      expect(names).toEqual(['name', 'language', 'country', 'variant', 'languageDirection', 'languageAlignment']);
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

    it('should resolve Blog widget array modifiers for ["widgets", "Blog"] and gadget properties for first item', () => {
      const suggestions = resolver.resolveDataPath(['widgets', 'Blog']);
      const names = suggestions.map(s => s.name);

      expect(names).toContain('first');
      expect(names).toContain('last');
      expect(names).toContain('size');
      expect(names).not.toContain('title');

      const firstBlog = resolver.resolveDataPath(['widgets', 'Blog', 'first']);
      const firstNames = firstBlog.map(s => s.name);
      expect(firstNames).toContain('title');
      expect(firstNames).toContain('posts');
      expect(firstNames).toContain('headerByline');
      expect(firstNames).toContain('footerBylines');
      expect(firstNames).toContain('allBylineItems');
      expect(firstNames).not.toContain('numPosts');
      expect(firstNames).not.toContain('messages');
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

    describe('type members and chaining', () => {
      it('should suggest string members and support string chaining', () => {
        const suggestions = resolver.resolveDataPath(['blog', 'title']);
        const names = suggestions.map(s => s.name);
        expect(names).toEqual(['escaped', 'jsEscaped', 'jsonEscaped', 'cssEscaped', 'length', 'size']);

        const chained = resolver.resolveDataPath(['blog', 'title', 'escaped']);
        expect(chained.map(s => s.name)).toEqual(['escaped', 'jsEscaped', 'jsonEscaped', 'cssEscaped', 'length', 'size']);
      });

      it('should suggest image members and support image chaining', () => {
        const suggestions = resolver.resolveDataPath(['post', 'featuredImage']);
        const names = suggestions.map(s => s.name);
        expect(names).toContain('width');
        expect(names).toContain('height');
        expect(names).toContain('isResizable');
        expect(names).toContain('isYouTube');
        expect(names).toContain('youtubeMaxResDefaultUrl');

        const chained = resolver.resolveDataPath(['post', 'featuredImage', 'youtubeMaxResDefaultUrl']);
        expect(chained.map(s => s.name)).toContain('width');
        expect(chained.map(s => s.name)).toContain('height');
      });

      it('should suggest locale members and chain to string members', () => {
        const suggestions = resolver.resolveDataPath(['blog', 'locale']);
        const names = suggestions.map(s => s.name);
        expect(names).toContain('name');
        expect(names).toContain('language');
        expect(names).toContain('country');

        const chained = resolver.resolveDataPath(['blog', 'locale', 'country']);
        expect(chained.map(s => s.name)).toEqual(['escaped', 'jsEscaped', 'jsonEscaped', 'cssEscaped', 'length', 'size']);
      });

      it('should suggest date members and chain to string members', () => {
        const suggestions = resolver.resolveDataPath(['post', 'date']);
        expect(suggestions.map(s => s.name)).toEqual([
          'year',
          'month',
          'day',
          'dayOfWeek',
          'dayOfMonth',
          'dayOfYear',
          'iso8601',
        ]);

        const chained = resolver.resolveDataPath(['post', 'date', 'iso8601']);
        expect(chained.map(s => s.name)).toEqual(['escaped', 'jsEscaped', 'jsonEscaped', 'cssEscaped', 'length', 'size']);
      });

      it('should suggest url members and support url chaining', () => {
        const suggestions = resolver.resolveDataPath(['blog', 'url']);
        expect(suggestions.map(s => s.name)).toEqual([
          'escaped',
          'jsEscaped',
          'jsonEscaped',
          'cssEscaped',
          'length',
          'size',
          'canonical',
          'https',
          'http',
        ]);

        const chained = resolver.resolveDataPath(['blog', 'url', 'https']);
        expect(chained.map(s => s.name)).toEqual([
          'escaped',
          'jsEscaped',
          'jsonEscaped',
          'cssEscaped',
          'length',
          'size',
          'canonical',
          'https',
          'http',
        ]);
      });
    });

    describe('array properties', () => {
      it('should suggest only array modifiers for data:posts and post comments collection', () => {
        const postsSuggestions = resolver.resolveDataPath(['posts']).map(s => s.name);
        expect(postsSuggestions).toContain('size');
        expect(postsSuggestions).toContain('length');
        expect(postsSuggestions).toContain('empty');
        expect(postsSuggestions).toContain('notEmpty');
        expect(postsSuggestions).toContain('any');
        expect(postsSuggestions).toContain('first');
        expect(postsSuggestions).toContain('last');
        expect(postsSuggestions).not.toContain('title');
        expect(postsSuggestions).not.toContain('body');

        const commentSuggestions = resolver.resolveDataPath(['post', 'comments']).map(s => s.name);
        expect(commentSuggestions).toContain('size');
        expect(commentSuggestions).toContain('first');
        expect(commentSuggestions).not.toContain('body');

        const firstCommentSuggestions = resolver.resolveDataPath(['post', 'comments', 'first']).map(s => s.name);
        expect(firstCommentSuggestions).toContain('body');
      });

      it('should suggest only array modifiers for data:feedLinks', () => {
        const feedLinkSuggestions = resolver.resolveDataPath(['feedLinks']).map(s => s.name);
        expect(feedLinkSuggestions).toContain('size');
        expect(feedLinkSuggestions).toContain('length');
        expect(feedLinkSuggestions).toContain('empty');
        expect(feedLinkSuggestions).toContain('notEmpty');
        expect(feedLinkSuggestions).toContain('any');
        expect(feedLinkSuggestions).toContain('first');
        expect(feedLinkSuggestions).toContain('last');
        expect(feedLinkSuggestions).not.toContain('feedType');
        expect(feedLinkSuggestions).not.toContain('mimeType');

        const firstFeedLink = resolver.resolveDataPath(['feedLinks', 'first']).map(s => s.name);
        expect(firstFeedLink).toContain('feedType');
        expect(firstFeedLink).toContain('url');

        const urlSuggestions = resolver.resolveDataPath(['feedLinks', 'first', 'url']).map(s => s.name);
        expect(urlSuggestions).toContain('canonical');
        expect(urlSuggestions).toContain('https');
        expect(urlSuggestions).toContain('http');
      });

      it('should suggest post properties on first and last elements', () => {
        const firstNames = resolver.resolveDataPath(['posts', 'first']).map(s => s.name);
        expect(firstNames).toContain('title');
        expect(firstNames).toContain('body');
        expect(firstNames).toContain('snippets');
        expect(firstNames).toContain('author');

        const lastNames = resolver.resolveDataPath(['posts', 'last']).map(s => s.name);
        expect(lastNames).toContain('title');
        expect(lastNames).toContain('author');
      });
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

  describe('resolveWidgetTypes', () => {
    it('should return valid widget types with metadata and documentation', () => {
      const suggestions = resolver.resolveWidgetTypes();
      expect(suggestions.length).toBeGreaterThanOrEqual(20);
      expect(suggestions.every(s => s.kind === 'enumMember')).toBe(true);
      expect(suggestions.every(s => s.detail === '(Blogger Widget Type)')).toBe(true);

      const names = suggestions.map(s => s.name);
      expect(names).toContain('Blog');
      expect(names).toContain('Header');
      expect(names).toContain('HTML');
      expect(names).toContain('AdSense');

      const blogWidget = suggestions.find(s => s.name === 'Blog');
      expect(blogWidget).toBeDefined();
      expect(blogWidget!.example).toContain('<b:widget id="Blog1" type="Blog"');
      expect(blogWidget!.docUrl).toBe('https://bloggercode.orbiona.com/1979/07/Ressource-Blog.html');
    });
  });

  describe('resolveDefaultMarkupTypes', () => {
    it('should return valid defaultmarkup types including All and Common', () => {
      const suggestions = resolver.resolveDefaultMarkupTypes();
      expect(suggestions.length).toBeGreaterThanOrEqual(20);
      expect(suggestions.every(s => s.kind === 'enumMember')).toBe(true);
      expect(suggestions.every(s => s.detail === '(Blogger Default Markup Type)')).toBe(true);

      const names = suggestions.map(s => s.name);
      expect(names[0]).toBe('All');
      expect(names[1]).toBe('Common');
      expect(names).toContain('Blog');

      const allType = suggestions.find(s => s.name === 'All');
      expect(allType).toBeDefined();
      expect(allType!.example).toContain('<b:defaultmarkup type="All">');
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
      expect(names).toContain('template');
      expect(names).not.toContain('post');
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

    it('should resolve widget types for <b:widget type="', () => {
      const result = resolver.resolveFromLinePrefix('<b:widget id="main" type="');
      expect(result).toBeDefined();
      expect(result!.replacementLength).toBe(0);
      expect(result!.suggestions.length).toBe(25);
      const names = result!.suggestions.map(s => s.name);
      expect(names).toContain('AdSense');
      expect(names).toContain('Blog');
      expect(names).toContain('Wikipedia');
    });

    it('should resolve widget types for <b:widget type="Blo with replacementLength', () => {
      const result = resolver.resolveFromLinePrefix('<b:widget type="Blo');
      expect(result).toBeDefined();
      expect(result!.replacementLength).toBe(3);
      expect(result!.suggestions.length).toBe(25);
    });

    it('should resolve defaultmarkup types for <b:defaultmarkup type="', () => {
      const result = resolver.resolveFromLinePrefix('<b:defaultmarkup type="');
      expect(result).toBeDefined();
      expect(result!.replacementLength).toBe(0);
      expect(result!.suggestions.length).toBe(27);
      const names = result!.suggestions.map(s => s.name);
      expect(names[0]).toBe('All');
      expect(names[1]).toBe('Common');
      expect(names).toContain('Blog');
    });

    it('should resolve defaultmarkup types for <b:defaultmarkup type=\'All with replacementLength', () => {
      const result = resolver.resolveFromLinePrefix('<b:defaultmarkup type=\'All');
      expect(result).toBeDefined();
      expect(result!.replacementLength).toBe(3);
      expect(result!.suggestions.length).toBe(27);
    });

    it('should resolve widget types for multi-line b:widget tag', () => {
      const result = resolver.resolveFromLinePrefix('<b:widget\n  id="Blog1"\n  type="');
      expect(result).toBeDefined();
      expect(result!.replacementLength).toBe(0);
      expect(result!.suggestions.length).toBe(25);
    });

    it('should resolve nearest unclosed Blogger tag for "</b:"', () => {
      const result = resolver.resolveFromLinePrefix('<b:if cond="true">\n</b:');
      expect(result).toBeDefined();
      expect(result!.replacementLength).toBe(2); // "b:".length
      expect(result!.suggestions.length).toBe(1);
      const ifTag = result!.suggestions[0];
      expect(ifTag?.name).toBe('b:if');
      expect(ifTag?.insertText).toBe('b:if>');
      expect(ifTag?.isSnippet).toBe(false);
    });

    it('should resolve Blogger tags for "</b:lo" with correct replacement length when b:loop is open', () => {
      const result = resolver.resolveFromLinePrefix('<b:loop values="data:posts" var="post">\n  </b:lo');
      expect(result).toBeDefined();
      expect(result!.replacementLength).toBe(4); // "b:lo".length
      expect(result!.suggestions.length).toBe(1);
      const loopTag = result!.suggestions[0];
      expect(loopTag?.name).toBe('b:loop');
      expect(loopTag?.insertText).toBe('b:loop>');
      expect(loopTag?.isSnippet).toBe(false);
    });

    it('should return undefined for "</b:" if no tags are open or nearest tag is closed', () => {
      expect(resolver.resolveFromLinePrefix('</b:')).toBeUndefined();
      expect(resolver.resolveFromLinePrefix('<b:if cond="true"></b:if>\n</b:')).toBeUndefined();
    });

    it('should return undefined for "</b:" if nearest tag is strictly self-closing or HTML element', () => {
      expect(resolver.resolveFromLinePrefix('<b:eval expr="data:blog.title">\n</b:')).toBeUndefined();
      expect(resolver.resolveFromLinePrefix('<div>\n</b:')).toBeUndefined();
    });

    it('should return undefined for non-matching lines or unsupported tag attributes', () => {
      expect(resolver.resolveFromLinePrefix('<div class="container">')).toBeUndefined();
      expect(resolver.resolveFromLinePrefix('<b:section id="main" type="')).toBeUndefined();
      expect(resolver.resolveFromLinePrefix('<input type="text"')).toBeUndefined();
    });

    it('should NOT suggest skin descriptions in non-skin tags like <meta description="">', () => {
      expect(resolver.resolveFromLinePrefix('<meta description="')).toBeUndefined();
      expect(resolver.resolveFromLinePrefix('<div description="')).toBeUndefined();
    });

    it('should resolve data expressions inside complex expressions with operators', () => {
      const result = resolver.resolveFromLinePrefix('<b:if cond="!data:view.isHomepage && data:blog.');
      expect(result).toBeDefined();
      const names = result!.suggestions.map(s => s.name);
      expect(names).toContain('title');
      expect(names).toContain('pageType');
    });

    it('should resolve Blogger tags for "<Var" with correct replacement length', () => {
      const result = resolver.resolveFromLinePrefix('<Var');
      expect(result).toBeDefined();
      expect(result!.replacementLength).toBe(3);
      const varTag = result!.suggestions.find(s => s.name === 'Variable');
      expect(varTag).toBeDefined();
      expect(varTag!.insertText).toMatch(/^Variable\s/);
    });

    it('should resolve Blogger tags for "Group" bare tag', () => {
      const result = resolver.resolveFromLinePrefix('Group');
      expect(result).toBeDefined();
      expect(result!.replacementLength).toBe(5);
      const groupTag = result!.suggestions.find(s => s.name === 'Group');
      expect(groupTag).toBeDefined();
      expect(groupTag!.insertText).toMatch(/^<Group\s/);
    });

    it('should resolve skin variable types for <Variable type="', () => {
      const result = resolver.resolveFromLinePrefix('<Variable name="test" type="');
      expect(result).toBeDefined();
      expect(result!.replacementLength).toBe(0);
      expect(result!.suggestions.length).toBe(6);

      const names = result!.suggestions.map(s => s.name);
      expect(names).toEqual(['color', 'font', 'length', 'background', 'string', 'url']);

      const stringSug = result!.suggestions.find(s => s.name === 'string');
      expect(stringSug).toBeDefined();
      expect(stringSug!.detail).toBe('string(skin)');
      expect(stringSug!.docUrl).toBe('https://bloggercode.orbiona.com/2016/09/skin-type-string.html');

      const urlSug = result!.suggestions.find(s => s.name === 'url');
      expect(urlSug).toBeDefined();
      expect(urlSug!.detail).toBe('url(skin)');
      expect(urlSug!.docUrl).toBe('https://bloggercode.orbiona.com/2016/09/skin-type-url.html');
    });

    it('should resolve skin variable types with correct replacement length when typing mid-word', () => {
      const result = resolver.resolveFromLinePrefix('<Variable type="str');
      expect(result).toBeDefined();
      expect(result!.replacementLength).toBe(3);
      expect(result!.suggestions.length).toBe(6);
    });

    it('should include all 6 Variable specialized tags in resolveBloggerTags', () => {
      const openTags = resolver.resolveBloggerTags(true, false);
      const skinTagNames = [
        'Variable (color)',
        'Variable (font)',
        'Variable (length)',
        'Variable (background)',
        'Variable (string)',
        'Variable (url)',
      ];

      for (const name of skinTagNames) {
        const tag = openTags.find(s => s.name === name);
        expect(tag, `Missing skin tag ${name}`).toBeDefined();
        expect(tag!.insertText).toMatch(/^Variable\s/);
        expect(tag!.detail).toMatch(/^\w+\(skin\)$/);
      }

      // Closing tag should NOT have Variable (color)> or Variable>
      const closeTags = resolver.resolveBloggerTags(false, true);
      expect(closeTags.find(s => s.name === 'Variable (color)')).toBeUndefined();
      expect(closeTags.find(s => s.name === 'Variable')).toBeUndefined();
      expect(closeTags.find(s => s.name === 'b:eval')).toBeUndefined();
      expect(closeTags.find(s => s.name === 'b:include')).toBeUndefined();
      expect(closeTags.find(s => s.name === 'b:else')).toBeUndefined();
    });
  });
});
