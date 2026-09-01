import { describe, expect, it } from 'vitest';
import { bloggerTags } from '../../src/core/data/tagsData.js';
import { BloggerPathResolver } from '../../src/core/resolver/pathResolver.js';

describe('tags and snippets validation', () => {
  const resolver = new BloggerPathResolver();
  const allTagSuggestions = resolver.resolveBloggerTags(false, false);

  it('should have all 27 tags defined in bloggerTags', () => {
    expect(typeof bloggerTags).toBe('object');
    expect(Object.keys(bloggerTags).length).toBe(27);
  });

  it('every tag suggestion should have valid name, description, and snippetBody', () => {
    const names = new Set<string>();

    for (const tag of allTagSuggestions) {
      expect(typeof tag.name, `Tag has invalid name: ${tag.name}`).toBe('string');
      expect(tag.name.length).toBeGreaterThan(0);

      expect(typeof tag.description, `Tag "${tag.name}" description should be string`).toBe('string');
      expect(tag.description!.length).toBeGreaterThan(0);

      expect(typeof tag.insertText, `Tag "${tag.name}" insertText should be string`).toBe('string');
      expect(tag.insertText!.length).toBeGreaterThan(0);

      expect(names.has(tag.name), `Duplicate tag found: "${tag.name}"`).toBe(false);
      names.add(tag.name);
    }
  });

  it('should include all essential Blogger b:* tags as well as Group and Variable', () => {
    const names = allTagSuggestions.map(s => s.name);

    const essentialTags = [
      'b:attr',
      'b:class',
      'b:comment',
      'b:defaultmarkups',
      'b:defaultmarkup',
      'b:eval',
      'b:if',
      'b:elseif',
      'b:else',
      'b:includable',
      'b:include',
      'b:loop',
      'b:message',
      'b:param',
      'b:section',
      'b:skin',
      'b:template-skin',
      'Group',
      'Variable',
      'b:switch',
      'b:case',
      'b:default',
      'b:tag',
      'b:widget',
      'b:widget-settings',
      'b:widget-setting',
      'b:with',
    ];

    for (const tag of essentialTags) {
      expect(names, `Missing essential tag: ${tag}`).toContain(tag);
    }
  });

  it('should format snippetBody correctly with and without open bracket', () => {
    const suggestionsBare = resolver.resolveBloggerTags(false, false);
    const suggestionsOpen = resolver.resolveBloggerTags(true, false);
    const suggestionsClose = resolver.resolveBloggerTags(false, true);

    const varBare = suggestionsBare.find(s => s.name === 'Variable');
    const varOpen = suggestionsOpen.find(s => s.name === 'Variable');
    const varClose = suggestionsClose.find(s => s.name === 'Variable');

    expect(varBare?.insertText).toMatch(/^<Variable\s/);
    expect(varOpen?.insertText).toMatch(/^Variable\s/);
    expect(varClose?.insertText).toBe('Variable>');
  });
});
