import { describe, expect, it } from 'vitest';
import { maskCommentsAndCdata, maskStringLiterals } from '../../src/core/utils/textUtils.js';

describe('textUtils', () => {
  describe('maskCommentsAndCdata', () => {
    it('masks XML comments while preserving length and line breaks', () => {
      const input = '<div class="main">\n  <!-- secret comment -->\n  <b:eval expr="data:blog.title"/>\n</div>';
      const masked = maskCommentsAndCdata(input);

      expect(masked.length).toBe(input.length);
      expect(masked).not.toContain('secret comment');
      expect(masked).toContain('<div class="main">\n');
      expect(masked).toContain('  <b:eval expr="data:blog.title"/>\n</div>');
      expect(masked.split('\n').length).toBe(input.split('\n').length);
    });

    it('masks CDATA blocks while preserving total length and newlines', () => {
      const input = '<b:skin>\n<![CDATA[\nbody { color: red; }\n]]>\n</b:skin>';
      const masked = maskCommentsAndCdata(input);

      expect(masked.length).toBe(input.length);
      expect(masked).not.toContain('body { color: red; }');
      expect(masked.startsWith('<b:skin>\n')).toBe(true);
      expect(masked.endsWith('\n</b:skin>')).toBe(true);
      expect(masked.split('\n').length).toBe(input.split('\n').length);
    });

    it('masks <b:comment> directive bodies', () => {
      const input = '<b:comment>\n  <b:widget id="Blog1" type="Blog"/>\n</b:comment>';
      const masked = maskCommentsAndCdata(input);

      expect(masked.length).toBe(input.length);
      expect(masked).not.toContain('Blog1');
      expect(masked.split('\n').length).toBe(input.split('\n').length);
    });

    it('returns original string when no comment or CDATA is present', () => {
      const input = '<b:eval expr="data:blog.title"/>';
      expect(maskCommentsAndCdata(input)).toBe(input);
    });
  });

  describe('maskStringLiterals', () => {
    it('masks double and single quoted strings preserving exact length', () => {
      const input = 'data:posts filter (p => p.title == "Hello World" && p.tag == \'News\')';
      const masked = maskStringLiterals(input);

      expect(masked.length).toBe(input.length);
      expect(masked).not.toContain('Hello World');
      expect(masked).not.toContain('News');
      expect(masked.startsWith('data:posts filter (p => p.title == ')).toBe(true);
    });

    it('masks &quot; and &apos; XML entities preserving exact length', () => {
      const input = 'expr=&quot;data:blog.title == &apos;My Blog&apos;&quot;';
      const masked = maskStringLiterals(input);

      expect(masked.length).toBe(input.length);
      expect(masked).not.toContain('data:blog.title');
      expect(masked).not.toContain('My Blog');
      expect(masked.startsWith('expr=')).toBe(true);
    });

    it('handles escaped quotes inside string literals', () => {
      const input = '"escaped \\" quote" and \'single \\\' quote\'';
      const masked = maskStringLiterals(input);

      expect(masked.length).toBe(input.length);
      expect(masked.trim()).toBe('and');
    });

    it('returns original string when no string literal is present', () => {
      const input = 'data:posts.first.title';
      expect(maskStringLiterals(input)).toBe(input);
    });
  });
});
