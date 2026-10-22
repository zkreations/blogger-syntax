import { describe, expect, it } from 'vitest';
import { blogWidgetProperties, singlePostProperties } from '../../src/core/resolver/dataModel.js';
import { BloggerPathResolver } from '../../src/core/resolver/pathResolver.js';

describe('bloggerPathResolver hover resolution', () => {
  const resolver = new BloggerPathResolver();
  const blogResolverContext = {
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

  describe('data: expressions hover', () => {
    it('should resolve hover on data:blog.title', () => {
      const line = '<b:eval expr="data:blog.title" />';
      const charIndex = line.indexOf('data:blog.title') + 3; // On 'data:blog.title'
      const result = resolver.resolveHoverAtPosition(line, charIndex);

      expect(result).toBeDefined();
      expect(result?.hover.title).toBe('data:blog.title');
      expect(result?.hover.category).toBe('data');
      expect(result?.hover.type).toBe('string');
      expect(result?.hover.description).toBe('Blog title configured in basic settings (e.g. data:blog.title.escaped).');
      expect(result?.range.start).toBe(line.indexOf('data:blog.title'));
      expect(result?.range.end).toBe(line.indexOf('data:blog.title') + 'data:blog.title'.length);
    });

    it('should resolve hover on nested property data:post.author.authorPhoto.width inside Blog widget', () => {
      const line = 'width="data:post.author.authorPhoto.width"';
      const charIndex = line.indexOf('authorPhoto');
      const result = resolver.resolveHoverAtPosition(line, charIndex, undefined, blogResolverContext);

      expect(result).toBeDefined();
      expect(result?.hover.title).toBe('data:post.author.authorPhoto.width');
      expect(result?.hover.type).toBe('number');
    });

    it('should resolve hover on data:posts root collection inside Blog widget', () => {
      const line = '<b:loop values="data:posts" var="post">';
      const charIndex = line.indexOf('data:posts') + 5;
      const result = resolver.resolveHoverAtPosition(line, charIndex, undefined, blogResolverContext);

      expect(result).toBeDefined();
      expect(result?.hover.title).toBe('data:posts');
    });

    it('should NOT resolve hover on data:posts outside widget context', () => {
      const line = '<b:loop values="data:posts" var="post">';
      const charIndex = line.indexOf('data:posts') + 5;
      const result = resolver.resolveHoverAtPosition(line, charIndex);

      expect(result).toBeUndefined();
    });

    it('should resolve hover on data:view.isHomepage', () => {
      const line = '<b:if cond="data:view.isHomepage">';
      const charIndex = line.indexOf('isHomepage');
      const result = resolver.resolveHoverAtPosition(line, charIndex);

      expect(result).toBeDefined();
      expect(result?.hover.title).toBe('data:view.isHomepage');
      expect(result?.hover.type).toBe('boolean');
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
      expect(result?.hover.description).toContain('Conditional control tag');
    });

    it('should resolve hover on <b:param>', () => {
      const line = '<b:param name="foo" value="bar"/>';
      const charIndex = line.indexOf('b:param');
      const result = resolver.resolveHoverAtPosition(line, charIndex);

      expect(result).toBeDefined();
      expect(result?.hover.title).toBe('<b:param>');
      expect(result?.hover.category).toBe('tag');
      expect(result?.hover.description).toBeDefined();
    });

    it('should resolve hover on closing tag </b:loop>', () => {
      const line = '  </b:loop>';
      const charIndex = line.indexOf('b:loop');
      const result = resolver.resolveHoverAtPosition(line, charIndex);

      expect(result).toBeDefined();
      expect(result?.hover.title).toBe('<b:loop>');
      expect(result?.hover.category).toBe('tag');
    });

    it('should resolve hover for <b:eval>', () => {
      const line = '<b:eval expr="data:blog.title" />';
      const charIndex = line.indexOf('b:eval');
      const result = resolver.resolveHoverAtPosition(line, charIndex);

      expect(result).toBeDefined();
      expect(result?.hover.title).toBe('<b:eval>');
      expect(result?.hover.category).toBe('tag');
    });

    it('should resolve hover on <Variable>', () => {
      const line = '<Variable name="color" description="Color" />';
      const charIndex = line.indexOf('Variable');
      const result = resolver.resolveHoverAtPosition(line, charIndex);

      expect(result).toBeDefined();
      expect(result?.hover.title).toBe('<Variable>');
      expect(result?.hover.category).toBe('tag');
      expect(result?.hover.description).toContain('skin variable');
    });

    it('should resolve hover on <Group>', () => {
      const line = '<Group description="Main Group">';
      const charIndex = line.indexOf('Group');
      const result = resolver.resolveHoverAtPosition(line, charIndex);

      expect(result).toBeDefined();
      expect(result?.hover.title).toBe('<Group>');
      expect(result?.hover.category).toBe('tag');
      expect(result?.hover.description).toContain('group multiple skin variables');
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
    it('should resolve hover on cond attribute in <b:if>', () => {
      const line = '<b:if cond="data:view.isHomepage">';
      const charIndex = line.indexOf('cond');
      const result = resolver.resolveHoverAtPosition(line, charIndex);

      expect(result).toBeDefined();
      expect(result?.hover.category).toBe('attribute');
      expect(result?.hover.title).toBe('cond');
      expect(result?.hover.description).toContain('Condition determining branch execution');
    });

    it('should resolve hover on tag attribute in <b:section>', () => {
      const line = '<b:section id="main" tag="main">';
      const charIndex = line.indexOf('tag');
      const result = resolver.resolveHoverAtPosition(line, charIndex);

      expect(result).toBeDefined();
      expect(result?.hover.category).toBe('attribute');
      expect(result?.hover.title).toBe('tag');
      expect(result?.hover.description).toContain('HTML element used for output');
    });

    it('should resolve hover on reverse attribute in <b:loop>', () => {
      const line = '<b:loop values="data:posts" reverse="true">';
      const charIndex = line.indexOf('reverse');
      const result = resolver.resolveHoverAtPosition(line, charIndex);

      expect(result).toBeDefined();
      expect(result?.hover.category).toBe('attribute');
      expect(result?.hover.title).toBe('reverse');
      expect(result?.hover.description).toContain('Reverses iteration order');
    });

    it('should resolve hover on render attribute in <b:comment>', () => {
      const line = '<b:comment render="true">';
      const charIndex = line.indexOf('render');
      const result = resolver.resolveHoverAtPosition(line, charIndex);

      expect(result).toBeDefined();
      expect(result?.hover.category).toBe('attribute');
      expect(result?.hover.title).toBe('render');
      expect(result?.hover.description).toContain('HTML comment');
    });

    it('should resolve hover on maxwidgets attribute in <b:section>', () => {
      const line = '<b:section id="main" maxwidgets="3">';
      const charIndex = line.indexOf('maxwidgets');
      const result = resolver.resolveHoverAtPosition(line, charIndex);

      expect(result).toBeDefined();
      expect(result?.hover.category).toBe('attribute');
      expect(result?.hover.title).toBe('maxwidgets');
    });

    it('should resolve hover on Blogger attributes in multi-line context', () => {
      const line = '  type="Blog">';
      const preceding = '<b:widget\n  id="Blog1"';
      const charIndex = line.indexOf('type');
      const result = resolver.resolveHoverAtPosition(line, charIndex, preceding);

      expect(result).toBeDefined();
      expect(result?.hover.category).toBe('attribute');
      expect(result?.hover.title).toBe('type');
    });

    it('should NOT resolve hover for standard HTML tag attributes', () => {
      const divLine = '<div class="container" id="app" title="Hello">';
      expect(resolver.resolveHoverAtPosition(divLine, divLine.indexOf('class'))).toBeUndefined();
      expect(resolver.resolveHoverAtPosition(divLine, divLine.indexOf('id'))).toBeUndefined();
      expect(resolver.resolveHoverAtPosition(divLine, divLine.indexOf('title'))).toBeUndefined();

      const inputLine = '<input type="text" name="query" value="search"/>';
      expect(resolver.resolveHoverAtPosition(inputLine, inputLine.indexOf('type'))).toBeUndefined();
      expect(resolver.resolveHoverAtPosition(inputLine, inputLine.indexOf('name'))).toBeUndefined();
      expect(resolver.resolveHoverAtPosition(inputLine, inputLine.indexOf('value'))).toBeUndefined();
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

  describe('b:includable inferred widget scope hover in Common markup', () => {
    it('should resolve hover on <b:includable> tag when inferred context exists', () => {
      const line = '<b:includable id="widget:Header">';
      const charIndex = line.indexOf('b:includable') + 2;
      const result = resolver.resolveHoverAtPosition(line, charIndex, undefined, {
        inferredWidgetContext: {
          widgetType: 'Header',
          source: 'convention',
          ruleDetail: 'Inferred from ID convention \'widget:Header\'',
        },
      });

      expect(result).toBeDefined();
      expect(result?.hover.title).toBe('Includable (Common Markup)');
      expect(result?.hover.description).toContain('**Associated Widget Scope:** `Header`');
      expect(result?.hover.description).toContain('Inferred from ID convention \'widget:Header\'');
      expect(result?.hover.description).toContain('> [!NOTE]');
    });

    it('should resolve hover on id attribute value when inferred context exists', () => {
      const line = '<b:includable id="widget:Header">';
      const charIndex = line.indexOf('widget:Header') + 2;
      const result = resolver.resolveHoverAtPosition(line, charIndex, undefined, {
        inferredWidgetContext: {
          widgetType: 'Header',
          source: 'convention',
          ruleDetail: 'Inferred from ID convention \'widget:Header\'',
        },
      });

      expect(result).toBeDefined();
      expect(result?.hover.title).toBe('Includable: widget:Header (Common Markup)');
      expect(result?.hover.category).toBe('attribute');
      expect(result?.hover.description).toContain('**Associated Widget Scope:** `Header`');
      expect(result?.hover.example).toBe('<b:include name=\'widget:Header\'/>');
    });
  });
});
