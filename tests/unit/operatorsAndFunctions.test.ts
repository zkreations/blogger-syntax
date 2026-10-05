import { describe, expect, it } from 'vitest';
import {
  bloggerFunctionsCatalog,
  getGlobalFunctionSuggestions,
} from '../../src/core/data/functionsData.js';
import {
  bloggerOperatorsCatalog,
  getOperatorSuggestions,
} from '../../src/core/data/operatorsData.js';
import { BloggerPathResolver } from '../../src/core/resolver/pathResolver.js';

describe('operatorsAndFunctions - Catalog Integrity & Autocompletion', () => {
  const resolver = new BloggerPathResolver();

  describe('bloggerOperatorsCatalog', () => {
    it('contains all 25 canonical Blogger operators', () => {
      const expectedOperators = [
        'filter',
        'where',
        'map',
        'select',
        'count',
        'first',
        'last',
        'any',
        'all',
        'none',
        'take',
        'limit',
        'skip',
        'offset',
        'to',
        'in',
        'contains',
        'format',
        'params',
        'appendParams',
        'path',
        'fragment',
        'and',
        'or',
        'not',
      ];

      for (const op of expectedOperators) {
        expect(bloggerOperatorsCatalog[op], `Operator ${op} should be present in catalog`).toBeDefined();
        expect(bloggerOperatorsCatalog[op]?.signature).toBeTruthy();
        expect(bloggerOperatorsCatalog[op]?.description).toBeTruthy();
        expect(bloggerOperatorsCatalog[op]?.example).toBeTruthy();
      }
    });

    it('returns operator suggestions list with metadata', () => {
      const allSuggestions = getOperatorSuggestions(false);
      expect(allSuggestions.length).toBeGreaterThanOrEqual(25);
      const filterItem = allSuggestions.find(s => s.name === 'filter');
      expect(filterItem).toBeDefined();
      expect(filterItem?.detail).toContain('Operator');
    });
  });

  describe('bloggerFunctionsCatalog', () => {
    it('contains snippet, resizeImage, and sourceSet', () => {
      expect(bloggerFunctionsCatalog.snippet).toBeDefined();
      expect(bloggerFunctionsCatalog.resizeImage).toBeDefined();
      expect(bloggerFunctionsCatalog.sourceSet).toBeDefined();

      expect(bloggerFunctionsCatalog.snippet?.signature).toContain('snippet(');
      expect(bloggerFunctionsCatalog.resizeImage?.signature).toContain('resizeImage(');
      expect(bloggerFunctionsCatalog.sourceSet?.signature).toContain('sourceSet(');
    });

    it('generates global function snippet suggestions', () => {
      const fnSuggestions = getGlobalFunctionSuggestions();
      expect(fnSuggestions).toHaveLength(3);
      expect(fnSuggestions.some(f => f.name === 'snippet' && f.isSnippet)).toBe(true);
      expect(fnSuggestions.some(f => f.name === 'resizeImage' && f.isSnippet)).toBe(true);
      expect(fnSuggestions.some(f => f.name === 'sourceSet' && f.isSnippet)).toBe(true);
    });
  });

  describe('autocompletion in PathResolver', () => {
    it('suggests post members on p. inside lambda', () => {
      const line = '<b:eval expr="data:posts filter (p => p.';
      const res = resolver.resolveFromLinePrefix(line);
      expect(res).toBeDefined();
      expect(res?.suggestions.some(s => s.name === 'title')).toBe(true);
      expect(res?.suggestions.some(s => s.name === 'author')).toBe(true);
      expect(res?.suggestions.some(s => s.name === 'labels')).toBe(true);
      expect(res?.replacementLength).toBe(0);
    });

    it('suggests label members on l. inside nested lambda', () => {
      const line = '<b:eval expr="data:posts filter (p => p.labels any (l => l.';
      const res = resolver.resolveFromLinePrefix(line);
      expect(res).toBeDefined();
      expect(res?.suggestions.some(s => s.name === 'name')).toBe(true);
      expect(res?.suggestions.some(s => s.name === 'url')).toBe(true);
      expect(res?.suggestions.some(s => s.name === 'count')).toBe(false); // canonical post.labels only has name, url
    });

    it('suggests operators after typing space after collection', () => {
      const line = '<b:eval expr="data:posts ';
      const res = resolver.resolveFromLinePrefix(line);
      expect(res).toBeDefined();
      expect(res?.suggestions.some(s => s.name === 'filter')).toBe(true);
      expect(res?.suggestions.some(s => s.name === 'map')).toBe(true);
      expect(res?.suggestions.some(s => s.name === 'count')).toBe(true);
      expect(res?.replacementLength).toBe(0);
    });

    it('suggests matching operator on partial typing like data:posts fil', () => {
      const line = '<b:eval expr="data:posts fil';
      const res = resolver.resolveFromLinePrefix(line);
      expect(res).toBeDefined();
      expect(res?.suggestions.some(s => s.name === 'filter')).toBe(true);
      expect(res?.replacementLength).toBe(3);
    });

    it('suggests global functions at expression start with partial prefix', () => {
      const line = '<b:eval expr="sni';
      const res = resolver.resolveFromLinePrefix(line);
      expect(res).toBeDefined();
      expect(res?.suggestions.some(s => s.name === 'snippet')).toBe(true);
      expect(res?.replacementLength).toBe(3);
    });
  });

  describe('hover Cards in PathResolver', () => {
    it('returns operator hover card when hovering over filter', () => {
      const line = '<b:eval expr="data:posts filter (p => p.title)" />';
      const hover = resolver.resolveHoverAtPosition(line, 26); // on 'filter'
      expect(hover).toBeDefined();
      expect(hover?.hover.category).toBe('operator');
      expect(hover?.hover.title).toBe('Operator: filter');
      expect(hover?.hover.description).toContain('Filters a collection');
    });

    it('returns function hover card when hovering over snippet', () => {
      const line = '<b:eval expr="snippet(data:post.body, { length: 150 })" />';
      const hover = resolver.resolveHoverAtPosition(line, 17); // on 'snippet'
      expect(hover).toBeDefined();
      expect(hover?.hover.category).toBe('function');
      expect(hover?.hover.title).toBe('Function: snippet');
      expect(hover?.hover.description).toContain('Generates a clean');
    });

    it('returns lambda property hover when hovering over p.title', () => {
      const line = '<b:eval expr="data:posts filter (p => p.title)" />';
      const hover = resolver.resolveHoverAtPosition(line, 40); // on 'p.title'
      expect(hover).toBeDefined();
      expect(hover?.hover.title).toBe('(property) p.title');
      expect(hover?.hover.type).toBe('string');
    });

    it('returns lambda parameter hover when hovering over p', () => {
      const line = '<b:eval expr="data:posts filter (p => p.title)" />';
      const hover = resolver.resolveHoverAtPosition(line, 33); // on 'p'
      expect(hover).toBeDefined();
      expect(hover?.hover.title).toBe('(parameter) p');
    });
  });
});
