import { describe, expect, it } from 'vitest';
import {
  bloggerOperatorsCatalog,
  getFunctionalOperatorSuggestions,
  getOperatorSuggestions,
} from '../../src/core/data/operatorsData.js';
import { blogWidgetProperties } from '../../src/core/data/widgetsData.js';
import { BloggerPathResolver } from '../../src/core/resolver/pathResolver.js';

describe('operators - Catalog Integrity, Dual Syntax & Autocompletion', () => {
  const resolver = new BloggerPathResolver();

  describe('bloggerOperatorsCatalog', () => {
    const expectedOperators = [
      // Lambdas (infix only)
      'filter',
      'where',
      'map',
      'select',
      'count',
      'first',
      'any',
      'all',
      'none',
      // Collection & range
      'take',
      'limit',
      'skip',
      'offset',
      'to',
      // Membership & content
      'in',
      'contains',
      // Transforms (dual syntax)
      'format',
      'params',
      'appendParams',
      'path',
      'fragment',
      'snippet',
      'resizeImage',
      'sourceSet',
      // Logical
      'and',
      'or',
      'not',
      // Comparison (word aliases)
      'eq',
      'neq',
      'lt',
      'lte',
      'gt',
      'gte',
      // Coalescing & arithmetic
      '?:',
      '+',
      '-',
      '*',
      '/',
      '%',
    ];

    it.each(expectedOperators)('contains canonical operator "%s" with valid metadata in catalog', (op) => {
      const entry = bloggerOperatorsCatalog[op];
      expect(entry, `Operator ${op} should be present in catalog`).toBeDefined();
      expect(entry?.signature.length).toBeGreaterThan(0);
      expect(entry?.description.length).toBeGreaterThan(0);
      expect(entry?.example.length).toBeGreaterThan(0);
    });

    it('strictly prohibits "ne" and ensures only "neq" exists', () => {
      expect(bloggerOperatorsCatalog.ne).toBeUndefined();
      expect(bloggerOperatorsCatalog.neq).toBeDefined();
      expect(bloggerOperatorsCatalog.neq?.aliases).toContain('!=');
      expect(bloggerOperatorsCatalog.neq?.aliases).not.toContain('ne');

      const allInfix = getOperatorSuggestions(false);
      expect(allInfix.some(s => s.name === 'ne')).toBe(false);
      expect(allInfix.some(s => s.name === 'neq')).toBe(true);

      const allFunctional = getFunctionalOperatorSuggestions();
      expect(allFunctional.some(s => s.name === 'ne')).toBe(false);
      expect(allFunctional.some(s => s.name === 'neq')).toBe(true);
    });

    it('correctly declares dual syntax capability and functional snippets', () => {
      // Infix-only operators
      expect(bloggerOperatorsCatalog.filter?.supportsFunctional).toBe(false);
      expect(bloggerOperatorsCatalog.map?.supportsFunctional).toBe(false);
      expect(bloggerOperatorsCatalog.count?.supportsFunctional).toBe(false);
      expect(bloggerOperatorsCatalog.to?.supportsFunctional).toBe(false);
      expect(bloggerOperatorsCatalog.not?.supportsFunctional).toBe(false);

      // Dual syntax operators (both infix and functional)
      expect(bloggerOperatorsCatalog.snippet?.supportsFunctional).toBe(true);
      expect(bloggerOperatorsCatalog.resizeImage?.supportsFunctional).toBe(true);
      expect(bloggerOperatorsCatalog.sourceSet?.supportsFunctional).toBe(true);
      expect(bloggerOperatorsCatalog.format?.supportsFunctional).toBe(true);
      expect(bloggerOperatorsCatalog.in?.supportsFunctional).toBe(true);
      expect(bloggerOperatorsCatalog.contains?.supportsFunctional).toBe(true);
      expect(bloggerOperatorsCatalog.take?.supportsFunctional).toBe(true);
      expect(bloggerOperatorsCatalog.and?.supportsFunctional).toBe(true);
      expect(bloggerOperatorsCatalog.or?.supportsFunctional).toBe(true);
      expect(bloggerOperatorsCatalog.eq?.supportsFunctional).toBe(true);
      expect(bloggerOperatorsCatalog.neq?.supportsFunctional).toBe(true);
      expect(bloggerOperatorsCatalog['?:']?.supportsFunctional).toBe(true);

      // Snippet templates for functional form
      expect(bloggerOperatorsCatalog.snippet?.functionalSnippet).toContain('snippet(');
      expect(bloggerOperatorsCatalog.resizeImage?.functionalSnippet).toContain('resizeImage(');
      expect(bloggerOperatorsCatalog.sourceSet?.functionalSnippet).toContain('sourceSet(');
      expect(bloggerOperatorsCatalog.eq?.functionalSnippet).toContain('eq(');
      expect(bloggerOperatorsCatalog.neq?.functionalSnippet).toContain('neq(');
    });

    it('flags variadic support for +, and, or, and ?:', () => {
      expect(bloggerOperatorsCatalog['+']?.supportsVariadic).toBe(true);
      expect(bloggerOperatorsCatalog.and?.supportsVariadic).toBe(true);
      expect(bloggerOperatorsCatalog.or?.supportsVariadic).toBe(true);
      expect(bloggerOperatorsCatalog['?:']?.supportsVariadic).toBe(true);

      // Fixed arity operators do NOT support variadic chaining
      expect(bloggerOperatorsCatalog.snippet?.supportsVariadic).toBeFalsy();
      expect(bloggerOperatorsCatalog.eq?.supportsVariadic).toBeFalsy();
      expect(bloggerOperatorsCatalog.neq?.supportsVariadic).toBeFalsy();
      expect(bloggerOperatorsCatalog['-']?.supportsVariadic).toBeFalsy();
    });

    it('suggests standard == and != while omitting XML-escaped symbols (<, >, &&, ||)', () => {
      const suggestions = getOperatorSuggestions(false);
      const names = suggestions.map(s => s.name);

      // Equality and inequality operators are included for clarity and convenience
      expect(names).toContain('==');
      expect(names).toContain('!=');
      expect(names).toContain('eq');
      expect(names).toContain('neq');

      // Word aliases for XML-escaped operators
      expect(names).toContain('lt');
      expect(names).toContain('lte');
      expect(names).toContain('gt');
      expect(names).toContain('gte');
      expect(names).toContain('and');
      expect(names).toContain('or');
      expect(names).toContain('snippet');
      expect(names).toContain('resizeImage');

      // Raw symbols requiring XML escaping are strictly omitted
      expect(names).not.toContain('<');
      expect(names).not.toContain('<=');
      expect(names).not.toContain('>');
      expect(names).not.toContain('>=');
      expect(names).not.toContain('&&');
      expect(names).not.toContain('||');
    });
  });

  describe('autocompletion in PathResolver', () => {
    it('suggests post members on p. inside lambda', () => {
      const line = '<b:eval expr="data:posts filter (p => p.';
      const res = resolver.resolveFromLinePrefix(line, { localVariables: blogWidgetProperties, widgetType: 'Blog' });
      expect(res).toBeDefined();
      expect(res?.suggestions.some(s => s.name === 'title')).toBe(true);
      expect(res?.suggestions.some(s => s.name === 'author')).toBe(true);
      expect(res?.suggestions.some(s => s.name === 'labels')).toBe(true);
      expect(res?.replacementLength).toBe(0);
    });

    it('suggests label members on l. inside nested lambda', () => {
      const line = '<b:eval expr="data:posts filter (p => p.labels any (l => l.';
      const res = resolver.resolveFromLinePrefix(line, { localVariables: blogWidgetProperties, widgetType: 'Blog' });
      expect(res).toBeDefined();
      expect(res?.suggestions.some(s => s.name === 'name')).toBe(true);
      expect(res?.suggestions.some(s => s.name === 'url')).toBe(true);
      expect(res?.suggestions.some(s => s.name === 'count')).toBe(false);
    });

    it('suggests operators after typing space after collection', () => {
      const line = '<b:eval expr="data:posts ';
      const res = resolver.resolveFromLinePrefix(line, { localVariables: blogWidgetProperties, widgetType: 'Blog' });
      expect(res).toBeDefined();
      expect(res?.suggestions.some(s => s.name === 'filter')).toBe(true);
      expect(res?.suggestions.some(s => s.name === 'map')).toBe(true);
      expect(res?.suggestions.some(s => s.name === 'count')).toBe(true);
      expect(res?.replacementLength).toBe(0);
    });

    it('suggests matching operator on partial typing like data:posts fil', () => {
      const line = '<b:eval expr="data:posts fil';
      const res = resolver.resolveFromLinePrefix(line, { localVariables: blogWidgetProperties, widgetType: 'Blog' });
      expect(res).toBeDefined();
      expect(res?.suggestions.some(s => s.name === 'filter')).toBe(true);
      expect(res?.replacementLength).toBe(3);
    });

    it('suggests functional operators at expression start with partial prefix', () => {
      const line = '<b:eval expr="sni';
      const res = resolver.resolveFromLinePrefix(line);
      expect(res).toBeDefined();
      expect(res?.suggestions.some(s => s.name === 'snippet')).toBe(true);
      expect(res?.suggestions.find(s => s.name === 'snippet')?.isSnippet).toBe(true);
      expect(res?.replacementLength).toBe(3);
    });

    it('suggests functional neq at expression start with partial prefix', () => {
      const line = '<b:if cond="neq';
      const res = resolver.resolveFromLinePrefix(line);
      expect(res).toBeDefined();
      expect(res?.suggestions.some(s => s.name === 'neq')).toBe(true);
      expect(res?.suggestions.some(s => s.name === 'ne')).toBe(false);
      expect(res?.replacementLength).toBe(3);
    });

    it('suggests == on typing = after an operand', () => {
      const line = '<b:if cond="data:view.isPost =';
      const res = resolver.resolveFromLinePrefix(line);
      expect(res).toBeDefined();
      expect(res?.suggestions.some(s => s.name === '==')).toBe(true);
      expect(res?.replacementLength).toBe(1);
    });

    it('suggests != on typing ! after an operand', () => {
      const line = '<b:if cond="data:view.type !';
      const res = resolver.resolveFromLinePrefix(line);
      expect(res).toBeDefined();
      expect(res?.suggestions.some(s => s.name === '!=')).toBe(true);
      expect(res?.replacementLength).toBe(1);
    });

    it('suggests root data properties and ZERO operators on data: in b:eval expr', () => {
      const line = '<b:eval expr="data:';
      const res = resolver.resolveFromLinePrefix(line);
      expect(res).toBeDefined();
      expect(res?.suggestions.some(s => s.name === 'blog')).toBe(true);
      expect(res?.suggestions.some(s => s.name === 'view')).toBe(true);
      expect(res?.suggestions.some(s => s.name === 'skin')).toBe(true);
      expect(res?.suggestions.every(s => s.kind !== 'operator')).toBe(true);
    });

    it('suggests root data properties and ZERO operators on data: in b:loop values', () => {
      const line = '<b:loop values="data:';
      const res = resolver.resolveFromLinePrefix(line);
      expect(res).toBeDefined();
      expect(res?.suggestions.some(s => s.name === 'blog')).toBe(true);
      expect(res?.suggestions.some(s => s.name === 'view')).toBe(true);
      expect(res?.suggestions.every(s => s.kind !== 'operator')).toBe(true);
    });

    it('suggests root data properties and ZERO operators on data: in b:with value', () => {
      const line = '<b:with value="data:';
      const res = resolver.resolveFromLinePrefix(line);
      expect(res).toBeDefined();
      expect(res?.suggestions.some(s => s.name === 'blog')).toBe(true);
      expect(res?.suggestions.some(s => s.name === 'view')).toBe(true);
      expect(res?.suggestions.every(s => s.kind !== 'operator')).toBe(true);
    });

    it('suggests root data properties and ZERO operators on data: in b:if cond', () => {
      const line = '<b:if cond="data:';
      const res = resolver.resolveFromLinePrefix(line);
      expect(res).toBeDefined();
      expect(res?.suggestions.some(s => s.name === 'view')).toBe(true);
      expect(res?.suggestions.every(s => s.kind !== 'operator')).toBe(true);
    });

    it('suggests root data properties and ZERO operators on data: in expr:class', () => {
      const line = '<div expr:class="data:';
      const res = resolver.resolveFromLinePrefix(line);
      expect(res).toBeDefined();
      expect(res?.suggestions.some(s => s.name === 'blog')).toBe(true);
      expect(res?.suggestions.every(s => s.kind !== 'operator')).toBe(true);
    });

    it('suggests blog members and ZERO operators on data:blog. in b:eval expr', () => {
      const line = '<b:eval expr="data:blog.';
      const res = resolver.resolveFromLinePrefix(line);
      expect(res).toBeDefined();
      expect(res?.suggestions.some(s => s.name === 'title')).toBe(true);
      expect(res?.suggestions.some(s => s.name === 'pageType')).toBe(true);
      expect(res?.suggestions.every(s => s.kind !== 'operator')).toBe(true);
    });

    it('suggests operand start and functional operators after comparison operator', () => {
      const line = '<b:eval expr="data:posts count (p => p.allowComments) == ';
      const res = resolver.resolveFromLinePrefix(line);
      expect(res).toBeDefined();
      expect(res?.suggestions.some(s => s.name === 'data:')).toBe(true);
    });

    it('suggests post members on bare variable post. inside expression attribute', () => {
      const line = '<b:eval expr="post.';
      const localVariables = {
        post: {
          name: 'post',
          type: 'object' as const,
          children: {
            title: { name: 'title', type: 'string' as const, description: 'Post title' },
            author: { name: 'author', type: 'object' as const, description: 'Post author' },
          },
        },
      };
      const res = resolver.resolveFromLinePrefix(line, { localVariables });
      expect(res).toBeDefined();
      expect(res?.suggestions.some(s => s.name === 'title')).toBe(true);
      expect(res?.suggestions.some(s => s.name === 'author')).toBe(true);
      expect(res?.suggestions.every(s => s.kind !== 'operator')).toBe(true);
    });

    describe('lambda operators contextual assistance & snippet insertion', () => {
      it('generates lambda snippet with inferred parameter p for data:posts', () => {
        const line = '<b:eval expr="data:posts fi';
        const res = resolver.resolveFromLinePrefix(line, { localVariables: blogWidgetProperties, widgetType: 'Blog' });
        expect(res).toBeDefined();

        const firstSugg = res?.suggestions.find(s => s.name === 'first');
        expect(firstSugg).toBeDefined();
        expect(firstSugg?.isSnippet).toBe(true);
        expect(firstSugg?.insertText).toBe('first (${1:p} => $0)');
        expect(firstSugg?.detail).toBe('(Blogger Lambda Operator)');
      });

      it('generates lambda snippet with inferred parameter l for p.labels in nested lambda', () => {
        const line = '<b:eval expr="data:posts filter (p => p.labels an';
        const res = resolver.resolveFromLinePrefix(line, { localVariables: blogWidgetProperties, widgetType: 'Blog' });
        expect(res).toBeDefined();

        const anySugg = res?.suggestions.find(s => s.name === 'any');
        expect(anySugg).toBeDefined();
        expect(anySugg?.isSnippet).toBe(true);
        expect(anySugg?.insertText).toBe('any (${1:l} => $0)');
      });

      it('omits parenthesis snippet if lineSuffix already contains an opening parenthesis', () => {
        const linePrefix = '<b:eval expr="data:posts fi';
        const lineSuffix = ' (p => p.id)"/>';
        const res = resolver.resolveFromLinePrefix(linePrefix, { lineSuffix, localVariables: blogWidgetProperties, widgetType: 'Blog' });
        expect(res).toBeDefined();

        const firstSugg = res?.suggestions.find(s => s.name === 'first');
        expect(firstSugg).toBeDefined();
        expect(firstSugg?.isSnippet).toBeFalsy();
        expect(firstSugg?.insertText).toBeUndefined();
      });

      it('suggests mandatory arrow => after typing parameter and space', () => {
        const line = '<b:eval expr="data:posts first (p ';
        const res = resolver.resolveFromLinePrefix(line);
        expect(res).toBeDefined();

        const arrowSugg = res?.suggestions.find(s => s.name === '=>');
        expect(arrowSugg).toBeDefined();
        expect(arrowSugg?.isSnippet).toBe(true);
        expect(arrowSugg?.insertText).toBe('=> $0');
        expect(arrowSugg?.detail).toBe('(Blogger Lambda Arrow)');
        expect(res?.replacementLength).toBe(0);
      });

      it('suggests parameter template when cursor is right after open parenthesis', () => {
        const line = '<b:eval expr="data:posts first (';
        const res = resolver.resolveFromLinePrefix(line);
        expect(res).toBeDefined();

        const paramSugg = res?.suggestions.find(s => s.name === 'p');
        expect(paramSugg).toBeDefined();
        expect(paramSugg?.isSnippet).toBe(true);
        expect(paramSugg?.insertText).toBe('${1:p} => $0');
        expect(res?.replacementLength).toBe(0);
      });

      it('suggests lambda variable p immediately after arrow in lambda body', () => {
        const line = '<b:eval expr="data:posts first (p => ';
        const res = resolver.resolveFromLinePrefix(line);
        expect(res).toBeDefined();

        expect(res?.suggestions.some(s => s.name === 'p')).toBe(true);
        expect(res?.suggestions.some(s => s.name === 'data:')).toBe(true);
        expect(res?.replacementLength).toBe(0);
      });

      it('suggests both inner and outer variables in nested lambda body', () => {
        const line = '<b:eval expr="data:posts filter (p => p.labels any (l => ';
        const res = resolver.resolveFromLinePrefix(line);
        expect(res).toBeDefined();

        expect(res?.suggestions.some(s => s.name === 'l')).toBe(true);
        expect(res?.suggestions.some(s => s.name === 'p')).toBe(true);
        expect(res?.suggestions.some(s => s.name === 'data:')).toBe(true);
        expect(res?.replacementLength).toBe(0);
      });
    });
  });

  describe('hover Cards in PathResolver', () => {
    it('returns operator hover card when hovering over ==', () => {
      const line = '<b:if cond="data:view.isPost == true">';
      const hover = resolver.resolveHoverAtPosition(line, 29);
      expect(hover).toBeDefined();
      expect(hover?.hover.category).toBe('operator');
      expect(hover?.hover.title).toBe('Operator: ==');
      expect(hover?.hover.description).toContain('Strict equality');
    });

    it('returns operator hover card when hovering over !=', () => {
      const line = '<b:if cond="data:view.type != \'item\'">';
      const hover = resolver.resolveHoverAtPosition(line, 27);
      expect(hover).toBeDefined();
      expect(hover?.hover.category).toBe('operator');
      expect(hover?.hover.title).toBe('Operator: !=');
      expect(hover?.hover.description).toContain('Strict inequality');
    });

    it('returns operator hover card when hovering over filter', () => {
      const line = '<b:eval expr="data:posts filter (p => p.title)" />';
      const hover = resolver.resolveHoverAtPosition(line, 26);
      expect(hover).toBeDefined();
      expect(hover?.hover.category).toBe('operator');
      expect(hover?.hover.title).toBe('Operator: filter');
      expect(hover?.hover.description).toContain('Filters a collection');
    });

    it('returns operator hover card when hovering over first', () => {
      const line = '<b:eval expr="data:posts first (p => p.isFeatured)" />';
      const charIndex = line.indexOf('first');
      const hover = resolver.resolveHoverAtPosition(line, charIndex);
      expect(hover).toBeDefined();
      expect(hover?.hover.category).toBe('operator');
      expect(hover?.hover.title).toBe('Operator: first');
      expect(hover?.hover.description).toContain('collection first (item => boolean)');
    });

    it('returns operator hover card when hovering over snippet in functional syntax', () => {
      const line = '<b:eval expr="snippet(data:post.body, { length: 150 })" />';
      const hover = resolver.resolveHoverAtPosition(line, 17);
      expect(hover).toBeDefined();
      expect(hover?.hover.category).toBe('operator');
      expect(hover?.hover.title).toBe('Operator: snippet');
      expect(hover?.hover.description).toContain('Generates a clean');
      expect(hover?.hover.description).toContain('Infix Syntax:');
      expect(hover?.hover.description).toContain('Functional Syntax:');
    });

    it('returns operator hover card when hovering over snippet in infix syntax', () => {
      const line = '<b:eval expr="data:post.body snippet { length: 150 }" />';
      const hover = resolver.resolveHoverAtPosition(line, 32);
      expect(hover).toBeDefined();
      expect(hover?.hover.category).toBe('operator');
      expect(hover?.hover.title).toBe('Operator: snippet');
    });

    it('returns operator hover card when hovering over neq', () => {
      const line = '<b:if cond="data:view.type neq \'item\'">';
      const hover = resolver.resolveHoverAtPosition(line, 28);
      expect(hover).toBeDefined();
      expect(hover?.hover.category).toBe('operator');
      expect(hover?.hover.title).toBe('Operator: neq');
      expect(hover?.hover.description).toContain('Strict inequality');
    });

    it('returns operator hover card when hovering over variadic and', () => {
      const line = '<b:if cond="data:view.isPost and data:post.allowComments">';
      const hover = resolver.resolveHoverAtPosition(line, 30);
      expect(hover).toBeDefined();
      expect(hover?.hover.category).toBe('operator');
      expect(hover?.hover.title).toBe('Operator: and');
      expect(hover?.hover.description).toContain('variadic chaining');
    });

    it('returns lambda property hover when hovering over p.title', () => {
      const line = '<b:eval expr="data:posts filter (p => p.title)" />';
      const hover = resolver.resolveHoverAtPosition(line, 40, undefined, { localVariables: blogWidgetProperties, widgetType: 'Blog' });
      expect(hover).toBeDefined();
      expect(hover?.hover.title).toBe('(property) p.title');
      expect(hover?.hover.type).toBe('string');
    });

    it('returns lambda parameter hover when hovering over p', () => {
      const line = '<b:eval expr="data:posts filter (p => p.title)" />';
      const hover = resolver.resolveHoverAtPosition(line, 33);
      expect(hover).toBeDefined();
      expect(hover?.hover.title).toBe('(parameter) p');
    });
  });
});
