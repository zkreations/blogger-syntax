import { describe, expect, it } from 'vitest';
import { BloggerPathResolver } from '../../src/core/resolver/pathResolver.js';

describe('hTML tags autocompletion for b:tag and data: output tag directive', () => {
  const resolver = new BloggerPathResolver();

  it('should suggest recommended semantic HTML tags for <b:tag name=" and NO b: tags', () => {
    const result = resolver.resolveFromLinePrefix('<b:tag name="');
    expect(result).toBeDefined();
    const names = result!.suggestions.map(s => s.name);

    expect(names).toContain('div');
    expect(names).toContain('span');
    expect(names).toContain('article');
    expect(names).toContain('section');
    expect(names).toContain('header');
    expect(names).toContain('footer');
    expect(names).toContain('aside');
    expect(names).toContain('nav');
    expect(names).toContain('main');
    expect(names).toContain('h1');
    expect(names).toContain('p');
    expect(names).toContain('time');

    // Absolutely NO b: tags allowed in b:tag
    expect(names.some(n => n.startsWith('b:'))).toBe(false);

    const divSugg = result!.suggestions.find(s => s.name === 'div');
    expect(divSugg?.detail).toBe('(HTML Element — Recommended)');
    expect(divSugg?.description).toContain('W3C HTML element');
  });

  it('should suggest data: tag as snippet when typing <d, <da, <data', () => {
    for (const prefix of ['<d', '<da', '<dat', '<data']) {
      const result = resolver.resolveFromLinePrefix(prefix);
      expect(result).toBeDefined();
      const names = result!.suggestions.map(s => s.name);
      expect(names).toContain('data:');

      const dataSugg = result!.suggestions.find(s => s.name === 'data:');
      expect(dataSugg?.isSnippet).toBe(true);
      expect(dataSugg?.insertText).toBe('data:${1}/>$0');
      expect(result!.replacementLength).toBe(prefix.length - 1);
    }
  });

  it('should suggest data properties when typing inside <data:blog.', () => {
    const result = resolver.resolveFromLinePrefix('<data:blog.');
    expect(result).toBeDefined();
    const names = result!.suggestions.map(s => s.name);
    expect(names).toContain('title');
    expect(names).toContain('url');
    expect(names).toContain('pageType');
  });
});
