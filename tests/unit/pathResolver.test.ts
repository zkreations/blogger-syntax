import type { BloggerProperty } from '../../src/core/models/types.js';
import { describe, expect, it } from 'vitest';
import { bloggerDescriptions } from '../../src/core/data/descriptions.js';
import { blogWidgetProperties, singlePostProperties } from '../../src/core/data/widgetsData.js';
import { BloggerPathResolver } from '../../src/core/resolver/pathResolver.js';
import {
  resolveBloggerTagSuggestions,
  resolveDefaultMarkupTypesSuggestions,
  resolveDescriptionsSuggestions,
  resolveWidgetTypesSuggestions,
} from '../../src/core/resolver/tagAttributeResolver.js';

describe('bloggerPathResolver', () => {
  const resolver = new BloggerPathResolver();
  const postContext: Record<string, BloggerProperty> = {
    post: {
      name: 'post',
      type: 'object',
      children: singlePostProperties,
    },
    ...blogWidgetProperties,
  };

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

      expect(names).toEqual(['name', 'language', 'country', 'variant', 'script', 'languageDirection', 'languageAlignment']);
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

    it('should return empty array for ["post"] without local variable or loop context', () => {
      const suggestions = resolver.resolveDataPath(['post']);
      expect(suggestions).toEqual([]);
    });

    it('should return empty array for ["posts"] without widget context', () => {
      const suggestions = resolver.resolveDataPath(['posts']);
      expect(suggestions).toEqual([]);
    });

    it('should return empty array for ["feedLinks"] without widget context', () => {
      const suggestions = resolver.resolveDataPath(['feedLinks']);
      expect(suggestions).toEqual([]);
    });

    it('should resolve post properties for ["post"] when provided in localVariables', () => {
      const suggestions = resolver.resolveDataPath(['post'], postContext);
      const names = suggestions.map(s => s.name);

      expect(names).toContain('id');
      expect(names).toContain('title');
      expect(names).toContain('body');
      expect(names).toContain('snippets');
      expect(names).toContain('author');
      expect(names).toContain('location');
    });

    it('should resolve post author properties for ["post", "author"] with context', () => {
      const suggestions = resolver.resolveDataPath(['post', 'author'], postContext);
      const names = suggestions.map(s => s.name);

      expect(names).toContain('name');
      expect(names).toContain('profileUrl');
      expect(names).toContain('authorPhoto');
      expect(names).toContain('aboutMe');
    });

    it('should resolve post author photo properties for ["post", "author", "authorPhoto"] with context', () => {
      const suggestions = resolver.resolveDataPath(['post', 'author', 'authorPhoto'], postContext);
      const names = suggestions.map(s => s.name);

      expect(names).toEqual(['image', 'width', 'height', 'alt']);
    });

    it('should resolve post snippet properties for ["post", "snippets"] with context', () => {
      const suggestions = resolver.resolveDataPath(['post', 'snippets'], postContext);
      const names = suggestions.map(s => s.name);

      expect(names).toEqual(['short', 'long']);
    });

    it('should resolve post location properties for ["post", "location"] with context', () => {
      const suggestions = resolver.resolveDataPath(['post', 'location'], postContext);
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
        const suggestions = resolver.resolveDataPath(['post', 'featuredImage'], postContext);
        const names = suggestions.map(s => s.name);
        expect(names).toContain('width');
        expect(names).toContain('height');
        expect(names).toContain('isResizable');
        expect(names).toContain('isYouTube');
        expect(names).toContain('youtubeMaxResDefaultUrl');

        const chained = resolver.resolveDataPath(['post', 'featuredImage', 'youtubeMaxResDefaultUrl'], postContext);
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
        const suggestions = resolver.resolveDataPath(['post', 'date'], postContext);
        expect(suggestions.map(s => s.name)).toEqual([
          'year',
          'month',
          'day',
          'dayOfWeek',
          'dayOfMonth',
          'dayOfYear',
          'iso8601',
        ]);

        const chained = resolver.resolveDataPath(['post', 'date', 'iso8601'], postContext);
        expect(chained.map(s => s.name)).toEqual(['escaped', 'jsEscaped', 'jsonEscaped', 'cssEscaped', 'length', 'size']);
      });

      it('should suggest url members and support url chaining', () => {
        const suggestions = resolver.resolveDataPath(['blog', 'url']);
        expect(suggestions.map(s => s.name)).toEqual([
          'canonical',
          'https',
          'http',
          'escaped',
          'jsEscaped',
          'jsonEscaped',
          'cssEscaped',
          'length',
          'size',
        ]);
        expect(suggestions[0]?.categoryBadge).toBe('URL');
        expect(suggestions[0]?.sortPriority).toBe(0);
        expect(suggestions[3]?.categoryBadge).toBe('String');
        expect(suggestions[3]?.sortPriority).toBe(10);

        const chained = resolver.resolveDataPath(['blog', 'url', 'https']);
        expect(chained.map(s => s.name)).toEqual([
          'canonical',
          'https',
          'http',
          'escaped',
          'jsEscaped',
          'jsonEscaped',
          'cssEscaped',
          'length',
          'size',
        ]);
      });
    });

    describe('array properties', () => {
      it('should suggest only array modifiers for data:posts and post comments collection', () => {
        const postsSuggestions = resolver.resolveDataPath(['posts'], postContext, 'Blog').map(s => s.name);
        expect(postsSuggestions).toContain('size');
        expect(postsSuggestions).toContain('length');
        expect(postsSuggestions).toContain('empty');
        expect(postsSuggestions).toContain('notEmpty');
        expect(postsSuggestions).toContain('any');
        expect(postsSuggestions).toContain('first');
        expect(postsSuggestions).toContain('last');
        expect(postsSuggestions).not.toContain('title');
        expect(postsSuggestions).not.toContain('body');

        const commentSuggestions = resolver.resolveDataPath(['post', 'comments'], postContext).map(s => s.name);
        expect(commentSuggestions).toContain('size');
        expect(commentSuggestions).toContain('first');
        expect(commentSuggestions).not.toContain('body');

        const firstCommentSuggestions = resolver.resolveDataPath(['post', 'comments', 'first'], postContext).map(s => s.name);
        expect(firstCommentSuggestions).toContain('body');
      });

      it('should suggest only array modifiers for data:feedLinks in Blog widget', () => {
        const feedLinkSuggestions = resolver.resolveDataPath(['feedLinks'], postContext, 'Blog').map(s => s.name);
        expect(feedLinkSuggestions).toContain('size');
        expect(feedLinkSuggestions).toContain('length');
        expect(feedLinkSuggestions).toContain('empty');
        expect(feedLinkSuggestions).toContain('notEmpty');
        expect(feedLinkSuggestions).toContain('any');
        expect(feedLinkSuggestions).toContain('first');
        expect(feedLinkSuggestions).toContain('last');
        expect(feedLinkSuggestions).not.toContain('feedType');
        expect(feedLinkSuggestions).not.toContain('mimeType');

        const firstFeedLink = resolver.resolveDataPath(['feedLinks', 'first'], postContext, 'Blog').map(s => s.name);
        expect(firstFeedLink).toContain('feedType');
        expect(firstFeedLink).toContain('url');

        const urlSuggestions = resolver.resolveDataPath(['feedLinks', 'first', 'url'], postContext, 'Blog').map(s => s.name);
        expect(urlSuggestions).toContain('canonical');
        expect(urlSuggestions).toContain('https');
        expect(urlSuggestions).toContain('http');
      });

      it('should suggest post properties on first and last elements', () => {
        const firstNames = resolver.resolveDataPath(['posts', 'first'], postContext, 'Blog').map(s => s.name);
        expect(firstNames).toContain('title');
        expect(firstNames).toContain('body');
        expect(firstNames).toContain('snippets');
        expect(firstNames).toContain('author');

        const lastNames = resolver.resolveDataPath(['posts', 'last'], postContext, 'Blog').map(s => s.name);
        expect(lastNames).toContain('title');
        expect(lastNames).toContain('author');
      });
    });
  });

  describe('resolveDescriptionsSuggestions', () => {
    it('should return all descriptions with variable examples', () => {
      const suggestions = resolveDescriptionsSuggestions();
      expect(suggestions.length).toBe(bloggerDescriptions.length);
      expect(suggestions.every(s => s.kind === 'enumMember')).toBe(true);
      expect(suggestions.some(s => s.name === 'Blog Title')).toBe(true);
      expect(suggestions.some(s => s.name === 'Background Color')).toBe(true);
      const titleDesc = suggestions.find(s => s.name === 'Blog Title');
      expect(titleDesc!.example).toContain('<Variable name="myVar" description="Blog Title"');
    });
  });

  describe('resolveWidgetTypesSuggestions', () => {
    it('should return valid widget types with metadata and documentation', () => {
      const suggestions = resolveWidgetTypesSuggestions();
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

  describe('resolveDefaultMarkupTypesSuggestions', () => {
    it('should return valid defaultmarkup types including All and Common', () => {
      const suggestions = resolveDefaultMarkupTypesSuggestions();
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

  describe('resolveBloggerTagSuggestions', () => {
    it('should propagate attributes and snippet body for tags', () => {
      const suggestions = resolveBloggerTagSuggestions(true);
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
      expect(result!.suggestions.length).toBe(26);
      const names = result!.suggestions.map(s => s.name);
      expect(names).toContain('AdSense');
      expect(names).toContain('Blog');
      expect(names).toContain('ReportAbuse');
      expect(names).toContain('Wikipedia');
    });

    it('should resolve widget types for <b:widget type="Blo with replacementLength', () => {
      const result = resolver.resolveFromLinePrefix('<b:widget type="Blo');
      expect(result).toBeDefined();
      expect(result!.replacementLength).toBe(3);
      expect(result!.suggestions.length).toBe(26);
    });

    it('should resolve defaultmarkup types for <b:defaultmarkup type="', () => {
      const result = resolver.resolveFromLinePrefix('<b:defaultmarkup type="');
      expect(result).toBeDefined();
      expect(result!.replacementLength).toBe(0);
      expect(result!.suggestions.length).toBe(28);
      const names = result!.suggestions.map(s => s.name);
      expect(names[0]).toBe('All');
      expect(names[1]).toBe('Common');
      expect(names).toContain('Blog');
      expect(names).toContain('ReportAbuse');
    });

    it('should resolve defaultmarkup types for <b:defaultmarkup type=\'All with replacementLength', () => {
      const result = resolver.resolveFromLinePrefix('<b:defaultmarkup type=\'All');
      expect(result).toBeDefined();
      expect(result!.replacementLength).toBe(3);
      expect(result!.suggestions.length).toBe(28);
    });

    it('should exclude previously defined types when suggesting after comma in b:defaultmarkup type', () => {
      const result = resolver.resolveFromLinePrefix('<b:defaultmarkup type="Blog,');
      expect(result).toBeDefined();
      expect(result!.replacementLength).toBe(0);
      expect(result!.suggestions.length).toBe(27);
      const names = result!.suggestions.map(s => s.name);
      expect(names).not.toContain('Blog');
      expect(names).toContain('Common');
      expect(names).toContain('All');
      expect(names).toContain('PopularPosts');
      expect(names).toContain('ReportAbuse');
    });

    it('should exclude multiple previously defined types and support partial prefix', () => {
      const result = resolver.resolveFromLinePrefix('<b:defaultmarkup type="Blog, PopularPosts, Fea');
      expect(result).toBeDefined();
      expect(result!.replacementLength).toBe(3);
      expect(result!.suggestions.length).toBe(26);
      const names = result!.suggestions.map(s => s.name);
      expect(names).not.toContain('Blog');
      expect(names).not.toContain('PopularPosts');
      expect(names).toContain('FeaturedPost');
      expect(names).toContain('ReportAbuse');
    });

    it('should exclude types specified after cursor when lineSuffix is provided', () => {
      const result = resolver.resolveFromLinePrefix('<b:defaultmarkup type="Blog, ', {
        lineSuffix: ',FeaturedPost">',
      });
      expect(result).toBeDefined();
      expect(result!.suggestions.length).toBe(26);
      const names = result!.suggestions.map(s => s.name);
      expect(names).not.toContain('Blog');
      expect(names).not.toContain('FeaturedPost');
      expect(names).toContain('ReportAbuse');
    });

    it('should resolve widget types for multi-line b:widget tag', () => {
      const result = resolver.resolveFromLinePrefix('<b:widget\n  id="Blog1"\n  type="');
      expect(result).toBeDefined();
      expect(result!.replacementLength).toBe(0);
      expect(result!.suggestions.length).toBe(26);
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
      expect(result!.suggestions.length).toBe(7);

      const names = result!.suggestions.map(s => s.name);
      expect(names).toEqual(['color', 'font', 'length', 'background', 'string', 'url', 'automatic']);

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
      expect(result!.suggestions.length).toBe(7);
    });

    it('should include all 7 Variable specialized tags in resolveBloggerTagSuggestions', () => {
      const openTags = resolveBloggerTagSuggestions(true, false);
      const skinTagNames = [
        'Variable (color)',
        'Variable (font)',
        'Variable (length)',
        'Variable (background)',
        'Variable (string)',
        'Variable (url)',
        'Variable (automatic)',
      ];

      for (const name of skinTagNames) {
        const tag = openTags.find(s => s.name === name);
        expect(tag, `Missing skin tag ${name}`).toBeDefined();
        expect(tag!.insertText).toMatch(/^Variable\s/);
        expect(tag!.detail).toMatch(/^\w+\(skin\)$/);
      }

      // Closing tag should NOT have Variable (color)> or Variable>
      const closeTags = resolveBloggerTagSuggestions(false, true);
      expect(closeTags.find(s => s.name === 'Variable (color)')).toBeUndefined();
      expect(closeTags.find(s => s.name === 'Variable')).toBeUndefined();
      expect(closeTags.find(s => s.name === 'b:eval')).toBeUndefined();
      expect(closeTags.find(s => s.name === 'b:include')).toBeUndefined();
      expect(closeTags.find(s => s.name === 'b:else')).toBeUndefined();
    });
  });

  describe('suggestion categorization and ranking', () => {
    it('should assign priority and badges to root data suggestions (Local=0, Widget=10, Global=20)', () => {
      const localVars: Record<string, BloggerProperty> = {
        item: { name: 'item', type: 'object', description: 'Current loop item' },
        title: { name: 'title', type: 'string', description: 'Widget title' },
      };

      const suggestions = resolver.resolveDataPath([], localVars, 'Blog');
      const itemSug = suggestions.find(s => s.name === 'item');
      expect(itemSug).toBeDefined();
      expect(itemSug?.categoryBadge).toBe('Local');
      expect(itemSug?.sortPriority).toBe(0);

      const titleSug = suggestions.find(s => s.name === 'title');
      expect(titleSug).toBeDefined();
      expect(titleSug?.categoryBadge).toBe('Widget: Blog');
      expect(titleSug?.sortPriority).toBe(10);

      const blogSug = suggestions.find(s => s.name === 'blog');
      expect(blogSug).toBeDefined();
      expect(blogSug?.categoryBadge).toBe('Global');
      expect(blogSug?.sortPriority).toBe(20);
    });

    it('should categorize and rank image property members (Image -> String) strictly without URL members', () => {
      const localVars: Record<string, BloggerProperty> = {
        post: {
          name: 'post',
          type: 'object',
          children: {
            featuredImage: {
              name: 'featuredImage',
              type: 'image',
              description: 'Post featured image',
            },
          },
        },
      };

      const suggestions = resolver.resolveDataPath(['post', 'featuredImage'], localVars);
      expect(suggestions.length).toBeGreaterThan(0);

      const isResizable = suggestions.find(s => s.name === 'isResizable');
      expect(isResizable).toBeDefined();
      expect(isResizable?.categoryBadge).toBe('Image');
      expect(isResizable?.sortPriority).toBe(0);

      const isYouTube = suggestions.find(s => s.name === 'isYouTube');
      expect(isYouTube).toBeDefined();
      expect(isYouTube?.categoryBadge).toBe('Image');

      const escaped = suggestions.find(s => s.name === 'escaped');
      expect(escaped).toBeDefined();
      expect(escaped?.categoryBadge).toBe('String');
      expect(escaped?.sortPriority).toBe(10);

      // URL modifiers must NOT be available on image data
      expect(suggestions.find(s => s.name === 'canonical')).toBeUndefined();
      expect(suggestions.find(s => s.name === 'params')).toBeUndefined();
      expect(suggestions.find(s => s.name === 'path')).toBeUndefined();

      expect(isResizable!.sortPriority!).toBeLessThan(escaped!.sortPriority!);
    });

    it('should prioritize custom array properties over array modifiers in data:widgets', () => {
      const suggestions = resolver.resolveDataPath(['widgets']);
      expect(suggestions.length).toBeGreaterThan(0);

      const blogEntry = suggestions.find(s => s.name === 'Blog');
      expect(blogEntry).toBeDefined();
      expect(blogEntry?.categoryBadge).toBe('Property');
      expect(blogEntry?.sortPriority).toBe(0);

      const headerEntry = suggestions.find(s => s.name === 'Header');
      expect(headerEntry).toBeDefined();
      expect(headerEntry?.categoryBadge).toBe('Property');
      expect(headerEntry?.sortPriority).toBe(0);

      const firstMod = suggestions.find(s => s.name === 'first');
      expect(firstMod).toBeDefined();
      expect(firstMod?.categoryBadge).toBe('Array');
      expect(firstMod?.sortPriority).toBe(10);

      const sizeMod = suggestions.find(s => s.name === 'size');
      expect(sizeMod).toBeDefined();
      expect(sizeMod?.categoryBadge).toBe('Array');
      expect(sizeMod?.sortPriority).toBe(10);

      expect(blogEntry!.sortPriority!).toBeLessThan(firstMod!.sortPriority!);
    });

    it('should resolve full sharing properties on data:blog.sharing and nested platforms', () => {
      const sharingSuggestions = resolver.resolveDataPath(['blog', 'sharing']);
      expect(sharingSuggestions.length).toBeGreaterThan(0);

      const platforms = sharingSuggestions.find(s => s.name === 'platforms');
      expect(platforms).toBeDefined();
      expect(platforms?.type).toBe('array');

      const platformsMembers = resolver.resolveDataPath(['blog', 'sharing', 'platforms']);
      expect(platformsMembers.length).toBeGreaterThan(0);
      expect(platformsMembers.some(s => s.name === 'first')).toBe(true);

      const firstItemProps = resolver.resolveDataPath(['blog', 'sharing', 'platforms', 'first']);
      const itemPropNames = firstItemProps.map(s => s.name);
      expect(itemPropNames).toContain('key');
      expect(itemPropNames).toContain('name');
      expect(itemPropNames).toContain('shareMessage');
      expect(itemPropNames).toContain('target');
    });

    it('should categorize includable subroutines with Local over Default Markup', () => {
      const result = resolver.resolveFromLinePrefix('<b:include name="', {
        includables: {
          local: ['postHeader', 'main'],
          defaultMarkups: ['postHeader', 'shareButtons'],
        },
      });

      expect(result).toBeDefined();
      const localHeader = result!.suggestions.find(s => s.name === 'postHeader');
      expect(localHeader).toBeDefined();
      expect(localHeader?.categoryBadge).toBe('Local');
      expect(localHeader?.sortPriority).toBe(0);

      const defaultShare = result!.suggestions.find(s => s.name === 'shareButtons');
      expect(defaultShare).toBeDefined();
      expect(defaultShare?.categoryBadge).toBe('Default Markup');
      expect(defaultShare?.sortPriority).toBe(10);
    });

    it('should assign categorization badges to Blogger tags in resolveBloggerTagSuggestions', () => {
      const tags = resolveBloggerTagSuggestions(true, false);
      const ifTag = tags.find(t => t.name === 'b:if');
      expect(ifTag).toBeDefined();
      expect(ifTag?.categoryBadge).toBe('Control Flow');
      expect(ifTag?.sortPriority).toBe(10);

      const sectionTag = tags.find(t => t.name === 'b:section');
      expect(sectionTag).toBeDefined();
      expect(sectionTag?.categoryBadge).toBe('Structure');
      expect(sectionTag?.sortPriority).toBe(0);
    });
  });
});
