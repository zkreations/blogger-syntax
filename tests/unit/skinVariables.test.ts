import { describe, expect, it } from 'vitest';
import {
  bloggerSkinVariableTags,
  bloggerSkinVariableTypeDetails,
  bloggerSkinVariableTypes,
} from '../../src/core/data/skinVariablesData.js';
import { cleanSnippetBody } from '../../src/core/utils/snippetFormatter.js';

describe('blogger Skin Variables Data', () => {
  it('should define all 6 skin variable types', () => {
    expect(bloggerSkinVariableTypes).toEqual([
      'color',
      'font',
      'length',
      'background',
      'string',
      'url',
    ]);
  });

  it('should have detailed metadata and skinTypeLabel for each type', () => {
    for (const type of bloggerSkinVariableTypes) {
      const detail = bloggerSkinVariableTypeDetails[type];
      expect(detail).toBeDefined();
      expect(detail.type).toBe(type);
      expect(detail.skinTypeLabel).toBe(`${type}(skin)`);
      expect(detail.description.length).toBeGreaterThan(10);
      expect(detail.docUrl).toMatch(/^https:\/\/bloggercode\.orbiona\.com\/2016\/09\/skin-type-/);
      expect(detail.example).toContain(`<Variable `);
      expect(detail.example).toContain(`type="${type}"`);
      expect(detail.snippetBody).toContain(`type="${type}"`);
      expect(Object.keys(detail.attributes).length).toBeGreaterThanOrEqual(5);
    }
  });

  it('should clearly distinguish string(skin) and url(skin) from runtime data types', () => {
    const stringDetail = bloggerSkinVariableTypeDetails.string;
    const urlDetail = bloggerSkinVariableTypeDetails.url;

    expect(stringDetail.skinTypeLabel).toBe('string(skin)');
    expect(stringDetail.description).toContain('Distinct from runtime data:string');
    expect(stringDetail.attributes.type!.description).toContain('string(skin)');

    expect(urlDetail.skinTypeLabel).toBe('url(skin)');
    expect(urlDetail.description).toContain('Distinct from runtime data:url');
    expect(urlDetail.attributes.type!.description).toContain('url(skin)');
  });

  it('should have specific attributes for font, length, and background', () => {
    const font = bloggerSkinVariableTypeDetails.font;
    expect(font.attributes.family).toBeDefined();
    expect(font.attributes.size).toBeDefined();
    expect(font.attributes.hideEditor).toBeDefined();

    const length = bloggerSkinVariableTypeDetails.length;
    expect(length.attributes.min).toBeDefined();
    expect(length.attributes.max).toBeDefined();
    expect(length.attributes.hideEditor).toBeDefined();

    const background = bloggerSkinVariableTypeDetails.background;
    expect(background.attributes.color).toBeDefined();
    expect(background.attributes.default).toBeDefined();
  });

  it('should generate valid tags for each of the 6 skin variable types', () => {
    expect(bloggerSkinVariableTags.length).toBe(6);

    const expectedNames = [
      'Variable (color)',
      'Variable (font)',
      'Variable (length)',
      'Variable (background)',
      'Variable (string)',
      'Variable (url)',
    ];

    expect(bloggerSkinVariableTags.map(t => t.name)).toEqual(expectedNames);

    for (const tag of bloggerSkinVariableTags) {
      expect(tag.detail).toMatch(/^\w+\(skin\)$/);
      expect(tag.snippetBody).toMatch(/^Variable name=/);

      const cleaned = cleanSnippetBody(tag.snippetBody);
      expect(cleaned).toMatch(/^<Variable\s/);
      expect(cleaned).toContain('name="');
      expect(cleaned).toContain('description="');
      expect(cleaned).toContain('type="');
    }
  });
});
