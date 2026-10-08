import { describe, expect, it } from 'vitest';
import { TemplateLanguageService } from '../../src/core/service/templateLanguageService.js';

describe('templateLanguageService', () => {
  const service = new TemplateLanguageService();

  describe('getCompletions', () => {
    it('should provide completions for data: with exact replacement range', () => {
      const doc = '<b:eval expr="data:blog."/>';
      const offset = doc.indexOf('blog.') + 'blog.'.length;
      const result = service.getCompletions(doc, offset);

      expect(result).toBeDefined();
      expect(result?.replacementRange.start).toBe(offset);
      expect(result?.replacementRange.end).toBe(offset);
      const names = result?.suggestions.map(s => s.name);
      expect(names).toContain('title');
      expect(names).toContain('url');
    });

    it('should adjust snippet replacement range when closed with "/>"', () => {
      const doc = '<b:';
      const offset = 3;
      const result = service.getCompletions(doc, offset);

      expect(result).toBeDefined();
      expect(result?.suggestions.some(s => s.name === 'b:if')).toBe(true);
    });

    it('should resolve multi-line context when line prefix is incomplete', () => {
      const doc = '<b:widget type="Blog" id="Blog1">\n  <b:includable id="main">\n    <b:eval expr="\n      data:blog.';
      const offset = doc.length;
      const result = service.getCompletions(doc, offset);

      expect(result).toBeDefined();
      const names = result?.suggestions.map(s => s.name);
      expect(names).toContain('title');
    });
  });

  describe('getHover', () => {
    it('should return hover card and exact absolute range for data token', () => {
      const doc = '<b:eval expr="data:blog.title"/>';
      const offset = doc.indexOf('title') + 1;
      const result = service.getHover(doc, offset);

      expect(result).toBeDefined();
      expect(result?.hover.title).toBe('data:blog.title');
      expect(result?.range.start).toBe(doc.indexOf('data:blog.title'));
      expect(result?.range.end).toBe(doc.indexOf('data:blog.title') + 'data:blog.title'.length);
    });
  });

  describe('getDefinition', () => {
    it('should find includable definition from b:include tag', () => {
      const doc = '<b:widget type="Blog" id="Blog1">\n  <b:include name="sub"/>\n  <b:includable id="sub">\n  </b:includable>\n</b:widget>';
      const offset = doc.indexOf('name="sub"') + 6;
      const result = service.getDefinition(doc, offset);

      expect(result).toBeDefined();
      expect(result?.targetId).toBe('sub');
    });
  });

  describe('getDocumentSymbols', () => {
    it('should return hierarchical document symbols', () => {
      const doc = '<b:section id="main">\n  <b:widget id="Blog1" type="Blog"/>\n</b:section>';
      const symbols = service.getDocumentSymbols(doc);

      expect(symbols.length).toBe(1);
      expect(symbols[0]?.name).toBe('main');
      expect(symbols[0]?.children.length).toBe(1);
      expect(symbols[0]?.children[0]?.name).toContain('Blog1');
    });
  });
});
