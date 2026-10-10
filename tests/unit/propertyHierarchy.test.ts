import { describe, expect, it } from 'vitest';
import { navigatePropertyPath } from '../../src/core/resolver/propertyHierarchy.js';

describe('propertyHierarchy', () => {
  it('should return undefined for empty segments', () => {
    expect(navigatePropertyPath([])).toBeUndefined();
    expect(navigatePropertyPath([''])).toBeUndefined();
  });

  it('should resolve top-level global property "blog"', () => {
    const result = navigatePropertyPath(['blog']);
    expect(result).toBeDefined();
    expect(result?.target?.name).toBe('blog');
    expect(result?.target?.type).toBe('object');
    expect(result?.children).toBeDefined();
    expect(result?.children?.title).toBeDefined();
  });

  it('should resolve nested path "blog.locale.language"', () => {
    const result = navigatePropertyPath(['blog', 'locale', 'language']);
    expect(result).toBeDefined();
    expect(result?.target?.name).toBe('language');
    expect(result?.target?.type).toBe('string');
  });

  it('should normalize bracket notation', () => {
    const result = navigatePropertyPath(['blog[locale][language]']);
    expect(result).toBeDefined();
    expect(result?.target?.name).toBe('language');
  });

  it('should prioritize local variables over globals', () => {
    const localVars = {
      blog: {
        name: 'blog',
        type: 'object' as const,
        children: {
          customField: { name: 'customField', type: 'string' as const },
        },
      },
    };
    const result = navigatePropertyPath(['blog', 'customField'], localVars);
    expect(result).toBeDefined();
    expect(result?.target?.name).toBe('customField');
  });

  it('should handle array item indexing', () => {
    const localVars = {
      items: {
        name: 'items',
        type: 'array' as const,
        itemChildren: {
          id: { name: 'id', type: 'string' as const },
        },
      },
    };
    const result = navigatePropertyPath(['items', '0', 'id'], localVars);
    expect(result).toBeDefined();
    expect(result?.target?.name).toBe('id');
  });

  it('should handle data:widgets descriptor lookup', () => {
    const result = navigatePropertyPath(['widgets', 'Blog1']);
    expect(result).toBeDefined();
    expect(result?.target?.name).toBe('Blog1');
    expect(result?.children?.posts).toBeDefined();
  });

  it('should return undefined for non-existent properties or primitives', () => {
    expect(navigatePropertyPath(['nonExistentProperty'])).toBeUndefined();
    expect(navigatePropertyPath(['blog', 'nonExistentChild'])).toBeUndefined();
  });
});
