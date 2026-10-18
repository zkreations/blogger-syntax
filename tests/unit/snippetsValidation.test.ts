import { describe, expect, it } from 'vitest';
import {
  bloggerTags,
  resolveBloggerTagSuggestions,
} from '../../src/core/resolver/tagAttributeResolver.js';

describe('tags and snippets validation', () => {
  const allTagSuggestions = resolveBloggerTagSuggestions(false, false);

  it('should have valid bloggerTags defined', () => {
    expect(typeof bloggerTags).toBe('object');
    expect(Object.keys(bloggerTags).length).toBeGreaterThanOrEqual(20);
  });

  it('every tag suggestion should have valid name, description, and snippetBody without duplicates', () => {
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

  it('should include essential Blogger tags (b:if, b:loop, b:widget, Variable, Group)', () => {
    const names = allTagSuggestions.map(s => s.name);
    const essentialTags = ['b:if', 'b:loop', 'b:widget', 'b:include', 'b:includable', 'b:section', 'Variable', 'Group'];

    for (const tag of essentialTags) {
      expect(names, `Missing essential tag: ${tag}`).toContain(tag);
    }
  });

  it('should include all 6 Variable specialized skin tags', () => {
    const names = allTagSuggestions.map(s => s.name);
    const variableTags = [
      'Variable (color)',
      'Variable (font)',
      'Variable (length)',
      'Variable (background)',
      'Variable (string)',
      'Variable (url)',
    ];

    for (const tag of variableTags) {
      expect(names, `Missing specialized tag: ${tag}`).toContain(tag);
    }
  });

  it('should format snippetBody correctly with and without open bracket', () => {
    const suggestionsBare = resolveBloggerTagSuggestions(false, false);
    const suggestionsOpen = resolveBloggerTagSuggestions(true, false);
    const suggestionsClose = resolveBloggerTagSuggestions(false, true);

    const varBare = suggestionsBare.find(s => s.name === 'Variable');
    const varOpen = suggestionsOpen.find(s => s.name === 'Variable');
    const varClose = suggestionsClose.find(s => s.name === 'Variable');

    expect(varBare?.insertText).toMatch(/^<Variable\s/);
    expect(varOpen?.insertText).toMatch(/^Variable\s/);
    expect(varClose).toBeUndefined();

    const ifClose = suggestionsClose.find(s => s.name === 'b:if');
    expect(ifClose?.insertText).toBe('b:if>');
  });

  it('should enforce valid VS Code snippet syntax with final tabstop across all tags', () => {
    for (const tag of allTagSuggestions) {
      const body = tag.insertText ?? '';
      // All tag snippets must include final tabstop $0
      expect(body, `Tag "${tag.name}" must contain $0 tabstop`).toContain('$0');
    }
  });

  it('should only include required attributes and exclude optional ones in bloggerTags snippets', () => {
    for (const [tagName, tagDef] of Object.entries(bloggerTags)) {
      if (!tagDef.attributes) {
        continue;
      }

      // Find all attributes declared in the snippetBody (e.g. attr="...")
      const attrMatches = [...tagDef.snippetBody.matchAll(/\b([\w:-]+)=["']/g)].map(m => m[1]!);

      for (const attrName of attrMatches) {
        const attrDef = tagDef.attributes[attrName];
        expect(attrDef, `Tag "${tagName}" has unknown attribute "${attrName}" in snippet`).toBeDefined();
        expect(attrDef?.required, `Tag "${tagName}" has optional attribute "${attrName}" in snippetBody`).toBe(true);
      }

      // Verify no required: false attribute was included
      for (const [attrName, attrDef] of Object.entries(tagDef.attributes)) {
        if (!attrDef.required) {
          expect(attrMatches, `Tag "${tagName}" should not include optional attribute "${attrName}" in snippet`).not.toContain(attrName);
        }
      }
    }
  });

  it('should verify specific clean signatures for key directives', () => {
    expect(bloggerTags['b:widget']?.snippetBody).toBe('b:widget id=\'${1:id}\' type=\'${2:type}\'>\n  $0\n</b:widget>');
    expect(bloggerTags['b:include']?.snippetBody).toBe('b:include name=\'${1:name}\'/>$0');
    expect(bloggerTags['b:includable']?.snippetBody).toBe('b:includable id=\'${1:id}\'>\n  $0\n</b:includable>');
    expect(bloggerTags['b:section']?.snippetBody).toBe('b:section id=\'${1:id}\'>\n  $0\n</b:section>');
    expect(bloggerTags['b:message']?.snippetBody).toBe('b:message name=\'${1:name}\'>\n  $0\n</b:message>');
    expect(bloggerTags['b:switch']?.snippetBody).toBe('b:switch var=\'${1:data:view.type}\'>\n  $0\n</b:switch>');
    expect(bloggerTags['b:defaultmarkups']?.snippetBody).toBe('b:defaultmarkups>\n  $0\n</b:defaultmarkups>');
    expect(bloggerTags.Group?.snippetBody).toBe('Group description=\'${1:description}\'>\n  $0\n</Group>');
    expect(bloggerTags.Variable?.snippetBody).toBe('Variable name=\'${1:name}\' description=\'${2:description}\' type=\'${3:type}\' value=\'${4:value}\'/>$0');
  });
});
