import { describe, expect, it } from 'vitest';
import { inferExpressionType } from '../../src/core/parser/exprParser.js';
import { BloggerPathResolver } from '../../src/core/resolver/pathResolver.js';
import { computeOperatorReturnType, isTypeAssignable } from '../../src/core/types/typeSystem.js';

describe('typeAwareCompletions - Strict Type Awareness & Operator Filtering', () => {
  const resolver = new BloggerPathResolver();

  describe('typeSystem - Subtyping & Inheritance', () => {
    it('correctly models subtype hierarchy according to Horatio', () => {
      // image -> url -> string
      expect(isTypeAssignable('image', 'url')).toBe(true);
      expect(isTypeAssignable('image', 'string')).toBe(true);
      expect(isTypeAssignable('url', 'string')).toBe(true);

      // date -> string
      expect(isTypeAssignable('date', 'string')).toBe(true);
      expect(isTypeAssignable('string', 'date')).toBe(false);

      // locale -> string
      expect(isTypeAssignable('locale', 'string')).toBe(true);

      // Disjoint types
      expect(isTypeAssignable('number', 'string')).toBe(false);
      expect(isTypeAssignable('boolean', 'number')).toBe(false);
      expect(isTypeAssignable('array', 'string')).toBe(false);
    });

    it('computes correct operator return types', () => {
      expect(computeOperatorReturnType('filter', 'array')).toBe('array');
      expect(computeOperatorReturnType('take', 'array')).toBe('array');
      expect(computeOperatorReturnType('map', 'array')).toBe('array');
      expect(computeOperatorReturnType('count', 'array')).toBe('number');
      expect(computeOperatorReturnType('any', 'array')).toBe('boolean');
      expect(computeOperatorReturnType('snippet', 'string')).toBe('string');
      expect(computeOperatorReturnType('resizeImage', 'image')).toBe('image');
      expect(computeOperatorReturnType('sourceSet', 'image')).toBe('string');
      expect(computeOperatorReturnType('format', 'date')).toBe('string');
      expect(computeOperatorReturnType('path', 'url')).toBe('url');
      expect(computeOperatorReturnType('+', 'number', 'number')).toBe('number');
      expect(computeOperatorReturnType('+', 'string', 'number')).toBe('string');
    });
  });

  describe('inferExpressionType - Compound & Chained Expressions', () => {
    it('infers date type for date paths', () => {
      expect(inferExpressionType('data:post.date').type).toBe('date');
    });

    it('infers image type for image paths and transforms', () => {
      expect(inferExpressionType('data:post.featuredImage').type).toBe('image');
      expect(inferExpressionType('data:post.featuredImage resizeImage 600').type).toBe('image');
    });

    it('infers url type for url paths and operators', () => {
      expect(inferExpressionType('data:post.url').type).toBe('url');
      expect(inferExpressionType('data:post.url path "/comments"').type).toBe('url');
    });

    it('infers string type for text snippet and format', () => {
      expect(inferExpressionType('data:post.body snippet { length: 150 }').type).toBe('string');
      expect(inferExpressionType('data:post.date format "YYYY"').type).toBe('string');
    });

    it('infers array type for pipeline collections', () => {
      expect(inferExpressionType('data:posts filter (p => p.allowComments)').type).toBe('array');
      expect(inferExpressionType('data:posts take 5').type).toBe('array');
    });

    it('infers number type for count pipeline', () => {
      expect(inferExpressionType('data:posts count (p => p.allowComments)').type).toBe('number');
    });

    it('infers parenthesized expressions correctly', () => {
      expect(inferExpressionType('(data:post.title ?: "Default")').type).toBe('string');
      expect(inferExpressionType('(data:posts filter (p => p.allowComments))').type).toBe('array');
    });
  });

  describe('infix operator autocompletion filtered by operand type', () => {
    it('suggests strictly logical & equality operators for boolean operand', () => {
      const line = '<b:if cond="data:view.isPost ';
      const res = resolver.resolveFromLinePrefix(line);
      expect(res).toBeDefined();

      const names = res!.suggestions.map(s => s.name);
      expect(names).toContain('and');
      expect(names).toContain('or');
      expect(names).toContain('==');
      expect(names).toContain('!=');
      expect(names).toContain('eq');
      expect(names).toContain('neq');
      expect(names).toContain('?:');

      // Prohibited: collection lambdas, arithmetic, image, snippet, date
      expect(names).not.toContain('filter');
      expect(names).not.toContain('where');
      expect(names).not.toContain('map');
      expect(names).not.toContain('select');
      expect(names).not.toContain('count');
      expect(names).not.toContain('take');
      expect(names).not.toContain('resizeImage');
      expect(names).not.toContain('sourceSet');
      expect(names).not.toContain('snippet');
      expect(names).not.toContain('format');
      expect(names).not.toContain('path');
      expect(names).not.toContain('-');
      expect(names).not.toContain('*');
      expect(names).not.toContain('/');
      expect(names).not.toContain('%');
    });

    it('suggests strictly collection & lambda operators for array operand', () => {
      const line = '<b:eval expr="data:posts ';
      const res = resolver.resolveFromLinePrefix(line);
      expect(res).toBeDefined();

      const names = res!.suggestions.map(s => s.name);
      expect(names).toContain('filter');
      expect(names).toContain('where');
      expect(names).toContain('map');
      expect(names).toContain('select');
      expect(names).toContain('count');
      expect(names).toContain('first');
      expect(names).toContain('any');
      expect(names).toContain('all');
      expect(names).toContain('none');
      expect(names).toContain('take');
      expect(names).toContain('limit');
      expect(names).toContain('skip');
      expect(names).toContain('offset');
      expect(names).toContain('contains');
      expect(names).toContain('==');
      expect(names).toContain('!=');

      // Prohibited: arithmetic, image, date, snippet, url
      expect(names).not.toContain('resizeImage');
      expect(names).not.toContain('sourceSet');
      expect(names).not.toContain('snippet');
      expect(names).not.toContain('format');
      expect(names).not.toContain('path');
      expect(names).not.toContain('params');
      expect(names).not.toContain('-');
      expect(names).not.toContain('*');
      expect(names).not.toContain('/');
      expect(names).not.toContain('%');
    });

    it('suggests strictly date format, comparisons & concatenation for date operand', () => {
      const line = '<b:eval expr="data:post.date ';
      const res = resolver.resolveFromLinePrefix(line);
      expect(res).toBeDefined();

      const names = res!.suggestions.map(s => s.name);
      expect(names).toContain('format');
      expect(names).toContain('+');
      expect(names).toContain('==');
      expect(names).toContain('!=');
      expect(names).toContain('eq');
      expect(names).toContain('neq');
      expect(names).toContain('lt');
      expect(names).toContain('gt');
      expect(names).toContain('?:');

      // Prohibited: collection lambdas, image resize, url params, arithmetic
      expect(names).not.toContain('filter');
      expect(names).not.toContain('map');
      expect(names).not.toContain('resizeImage');
      expect(names).not.toContain('params');
      expect(names).not.toContain('path');
      expect(names).not.toContain('-');
      expect(names).not.toContain('*');
      expect(names).not.toContain('/');
    });

    it('suggests strictly image transforms, url and string ops for image operand', () => {
      const line = '<b:eval expr="data:post.featuredImage ';
      const res = resolver.resolveFromLinePrefix(line);
      expect(res).toBeDefined();

      const names = res!.suggestions.map(s => s.name);
      expect(names).toContain('resizeImage');
      expect(names).toContain('sourceSet');
      expect(names).toContain('path');
      expect(names).toContain('params');
      expect(names).toContain('fragment');
      expect(names).toContain('snippet');
      expect(names).toContain('+');
      expect(names).toContain('contains');

      // Prohibited: collection lambdas, arithmetic
      expect(names).not.toContain('filter');
      expect(names).not.toContain('map');
      expect(names).not.toContain('count');
      expect(names).not.toContain('-');
      expect(names).not.toContain('*');
      expect(names).not.toContain('/');
      expect(names).not.toContain('%');
    });

    it('suggests strictly arithmetic & comparison operators for numeric operand', () => {
      const line = '<b:eval expr="data:post.numberOfComments ';
      const res = resolver.resolveFromLinePrefix(line);
      expect(res).toBeDefined();

      const names = res!.suggestions.map(s => s.name);
      expect(names).toContain('+');
      expect(names).toContain('-');
      expect(names).toContain('*');
      expect(names).toContain('/');
      expect(names).toContain('%');
      expect(names).toContain('==');
      expect(names).toContain('!=');
      expect(names).toContain('lt');
      expect(names).toContain('gt');
      expect(names).toContain('lte');
      expect(names).toContain('gte');

      // Prohibited: lambdas, image, snippet, format
      expect(names).not.toContain('filter');
      expect(names).not.toContain('map');
      expect(names).not.toContain('resizeImage');
      expect(names).not.toContain('snippet');
      expect(names).not.toContain('format');
    });

    it('suggests range operator "to" only inside loop values attribute', () => {
      const loopLine = '<b:loop values="1 ';
      const loopRes = resolver.resolveFromLinePrefix(loopLine);
      expect(loopRes).toBeDefined();
      expect(loopRes!.suggestions.some(s => s.name === 'to')).toBe(true);

      const evalLine = '<b:eval expr="1 ';
      const evalRes = resolver.resolveFromLinePrefix(evalLine);
      expect(evalRes).toBeDefined();
      expect(evalRes!.suggestions.some(s => s.name === 'to')).toBe(false);
    });

    it('preserves array type awareness across chained pipeline operations', () => {
      const line = '<b:eval expr="data:posts filter (p => p.allowComments) ';
      const res = resolver.resolveFromLinePrefix(line);
      expect(res).toBeDefined();

      const names = res!.suggestions.map(s => s.name);
      expect(names).toContain('take');
      expect(names).toContain('skip');
      expect(names).toContain('map');
      expect(names).toContain('count');
      expect(names).not.toContain('resizeImage');
      expect(names).not.toContain('-');
    });

    it('switches to numeric operators after count reduction', () => {
      const line = '<b:eval expr="data:posts count (p => p.allowComments) ';
      const res = resolver.resolveFromLinePrefix(line);
      expect(res).toBeDefined();

      const names = res!.suggestions.map(s => s.name);
      expect(names).toContain('gt');
      expect(names).toContain('==');
      expect(names).toContain('+');
      expect(names).toContain('-');
      expect(names).not.toContain('filter');
      expect(names).not.toContain('take');
    });
  });

  describe('compound parenthesized member navigation', () => {
    it('suggests string modifiers on parenthesized snippet expression', () => {
      const line = '<b:eval expr="(data:post.body snippet { length: 150 }).';
      const res = resolver.resolveFromLinePrefix(line);
      expect(res).toBeDefined();

      const names = res!.suggestions.map(s => s.name);
      expect(names).toContain('escaped');
      expect(names).toContain('length');
      expect(names).toContain('size');
      expect(names).toContain('jsEscaped');
      expect(names).toContain('jsonEscaped');
      expect(names).toContain('cssEscaped');
      expect(names).not.toContain('width');
      expect(names).not.toContain('canonical');
    });

    it('suggests image modifiers on parenthesized resizeImage expression', () => {
      const line = '<b:eval expr="(data:post.featuredImage resizeImage 600).';
      const res = resolver.resolveFromLinePrefix(line);
      expect(res).toBeDefined();

      const names = res!.suggestions.map(s => s.name);
      expect(names).toContain('width');
      expect(names).toContain('height');
      expect(names).toContain('isResizable');
      expect(names).toContain('isYouTube');
      expect(names).toContain('canonical');
      expect(names).toContain('escaped');
    });

    it('suggests array modifiers on parenthesized collection pipeline', () => {
      const line = '<b:eval expr="(data:posts filter (p => p.allowComments)).';
      const res = resolver.resolveFromLinePrefix(line);
      expect(res).toBeDefined();

      const names = res!.suggestions.map(s => s.name);
      expect(names).toContain('size');
      expect(names).toContain('length');
      expect(names).toContain('first');
      expect(names).toContain('last');
      expect(names).toContain('empty');
      expect(names).toContain('notEmpty');
    });

    it('correctly filters modifiers on partial typing', () => {
      const line = '<b:eval expr="(data:post.body snippet { length: 150 }).es';
      const res = resolver.resolveFromLinePrefix(line);
      expect(res).toBeDefined();

      const names = res!.suggestions.map(s => s.name);
      expect(names).toContain('escaped');
      expect(names).not.toContain('length');
      expect(res!.replacementLength).toBe(2);
    });
  });

  describe('handling uncertainty & unknown types', () => {
    it('provides safe universal operators when type is unknown without crashing', () => {
      const line = '<b:eval expr="unknownVariable ';
      const res = resolver.resolveFromLinePrefix(line);
      expect(res).toBeDefined();

      const names = res!.suggestions.map(s => s.name);
      expect(names).toContain('==');
      expect(names).toContain('!=');
      expect(names).toContain('?:');
      expect(names).toContain('+');
      expect(names).toContain('and');
      expect(names).toContain('or');
    });
  });
});
