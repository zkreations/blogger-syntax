import { describe, expect, it } from 'vitest';
import { BloggerPathResolver } from '../../src/core/resolver/pathResolver.js';

describe('bloggerPathResolver hover resolution', () => {
  const resolver = new BloggerPathResolver();

  describe('data: expressions hover', () => {
    it('should resolve hover on data:blog.title', () => {
      const line = '<b:eval expr="data:blog.title" />';
      const charIndex = line.indexOf('data:blog.title') + 3; // On 'data:blog.title'
      const result = resolver.resolveHoverAtPosition(line, charIndex);

      expect(result).toBeDefined();
      expect(result?.hover.title).toBe('data:blog.title');
      expect(result?.hover.category).toBe('data');
      expect(result?.hover.type).toBe('string');
      expect(result?.hover.description).toBe('The general name / main title of the blog.');
      expect(result?.hover.docUrls).toContain('https://bloggercode.orbiona.com/1978/11/data-blog-title.html');
      expect(result?.range.start).toBe(line.indexOf('data:blog.title'));
      expect(result?.range.end).toBe(line.indexOf('data:blog.title') + 'data:blog.title'.length);
    });

    it('should resolve hover on nested property data:post.author.authorPhoto.width', () => {
      const line = 'width="data:post.author.authorPhoto.width"';
      const charIndex = line.indexOf('authorPhoto');
      const result = resolver.resolveHoverAtPosition(line, charIndex);

      expect(result).toBeDefined();
      expect(result?.hover.title).toBe('data:post.author.authorPhoto.width');
      expect(result?.hover.type).toBe('number');
      expect(result?.hover.docUrls).toContain('https://bloggercode.orbiona.com/1971/03/data-posts-author-authorPhoto-width.html');
    });

    it('should resolve hover on data:posts root collection', () => {
      const line = '<b:loop values="data:posts" var="post">';
      const charIndex = line.indexOf('data:posts') + 5;
      const result = resolver.resolveHoverAtPosition(line, charIndex);

      expect(result).toBeDefined();
      expect(result?.hover.title).toBe('data:posts');
      expect(result?.hover.docUrls).toContain('https://bloggercode.orbiona.com/1971/08/data-posts.html');
    });

    it('should resolve hover on data:view.isHomepage', () => {
      const line = '<b:if cond="data:view.isHomepage">';
      const charIndex = line.indexOf('isHomepage');
      const result = resolver.resolveHoverAtPosition(line, charIndex);

      expect(result).toBeDefined();
      expect(result?.hover.title).toBe('data:view.isHomepage');
      expect(result?.hover.type).toBe('boolean');
      expect(result?.hover.docUrls).toContain('https://bloggercode.orbiona.com/1978/10/data-view-isHomepage.html');
    });
  });

  describe('blogger tags hover', () => {
    it('should resolve hover on <b:if>', () => {
      const line = '<b:if cond="data:view.isPost">';
      const charIndex = line.indexOf('b:if');
      const result = resolver.resolveHoverAtPosition(line, charIndex);

      expect(result).toBeDefined();
      expect(result?.hover.title).toBe('<b:if>');
      expect(result?.hover.category).toBe('tag');
      expect(result?.hover.description).toBe('Renders child content if the condition evaluates to true.');
      expect(result?.hover.docUrls).toContain('https://bloggercode.orbiona.com/2016/03/tag-b-if-b-else-b-elseif.html');
    });

    it('should resolve hover on closing tag </b:loop>', () => {
      const line = '  </b:loop>';
      const charIndex = line.indexOf('b:loop');
      const result = resolver.resolveHoverAtPosition(line, charIndex);

      expect(result).toBeDefined();
      expect(result?.hover.title).toBe('<b:loop>');
      expect(result?.hover.category).toBe('tag');
    });

    it('should resolve multiple doc URLs for <b:eval>', () => {
      const line = '<b:eval expr="data:blog.title" />';
      const charIndex = line.indexOf('b:eval');
      const result = resolver.resolveHoverAtPosition(line, charIndex);

      expect(result).toBeDefined();
      expect(result?.hover.docUrls?.length).toBe(2);
      expect(result?.hover.docUrls).toEqual([
        'https://support.google.com/blogger/answer/46995#zippy=%2Cevaluated-expressions-beval',
        'https://bloggercode.orbiona.com/2016/03/tag-b-eval.html',
      ]);
    });
  });

  describe('expr: prefix hover', () => {
    it('should resolve hover on expr:class', () => {
      const line = '<div expr:class="data:post.adminClass">';
      const charIndex = line.indexOf('expr:class');
      const result = resolver.resolveHoverAtPosition(line, charIndex);

      expect(result).toBeDefined();
      expect(result?.hover.category).toBe('prefix');
      expect(result?.hover.title).toBe('expr:class (Expression Attribute)');
      expect(result?.hover.description).toContain('Evaluates a Blogger expression');
    });
  });

  describe('tag attributes hover', () => {
    it('should resolve hover on cond attribute', () => {
      const line = '<b:if cond="data:view.isHomepage">';
      const charIndex = line.indexOf('cond');
      const result = resolver.resolveHoverAtPosition(line, charIndex);

      expect(result).toBeDefined();
      expect(result?.hover.category).toBe('attribute');
      expect(result?.hover.title).toBe('cond');
      expect(result?.hover.description).toBe('Conditional expression.');
      expect(result?.hover.docUrls).toContain('https://bloggercode.orbiona.com/2018/02/attribute-cond.html');
    });

    it('should resolve hover on maxwidgets attribute', () => {
      const line = '<b:section id="main" maxwidgets="3">';
      const charIndex = line.indexOf('maxwidgets');
      const result = resolver.resolveHoverAtPosition(line, charIndex);

      expect(result).toBeDefined();
      expect(result?.hover.category).toBe('attribute');
      expect(result?.hover.title).toBe('maxwidgets');
      expect(result?.hover.docUrls).toContain('https://bloggercode.orbiona.com/2021/11/attribute-maxwidgets.html');
    });
  });

  describe('empty and out of range cases', () => {
    it('should return undefined when cursor is on whitespace or plain text', () => {
      const line = '  <div> Hello World </div>  ';
      expect(resolver.resolveHoverAtPosition(line, 2)).toBeUndefined();
      expect(resolver.resolveHoverAtPosition(line, 10)).toBeUndefined();
    });

    it('should return undefined when character index is negative or out of bounds', () => {
      const line = '<b:if cond="true">';
      expect(resolver.resolveHoverAtPosition(line, -1)).toBeUndefined();
      expect(resolver.resolveHoverAtPosition(line, 999)).toBeUndefined();
    });
  });
});
