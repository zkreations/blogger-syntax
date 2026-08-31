import { describe, expect, it } from 'vitest';
import { cleanSnippetBody } from '../../src/core/utils/snippetFormatter.js';

describe('cleanSnippetBody', () => {
  it('should handle empty or undefined input', () => {
    expect(cleanSnippetBody('')).toBe('');
  });

  it('should clean simple placeholders with default values', () => {
    const input = 'b:class name="${1:className}"/>$0';
    expect(cleanSnippetBody(input)).toBe('<b:class name="className"/>');
  });

  it('should clean multi-parameter tags with nested indentation', () => {
    const input = 'b:if cond="${1:condition}">\n\t$0\n</b:if>';
    expect(cleanSnippetBody(input)).toBe('<b:if cond="condition">\n\t\n</b:if>');
  });

  it('should clean choice placeholders taking first option', () => {
    const input = 'Variable description="${1|Accents,Action color,Action font|}" type="${2|color,font,length|}" default="${3:default}"/>$0';
    expect(cleanSnippetBody(input)).toBe('<Variable description="Accents" type="color" default="default"/>');
  });

  it('should clean plain tabstops without defaults', () => {
    const input = 'b:else/>$0';
    expect(cleanSnippetBody(input)).toBe('<b:else/>');
  });

  it('should preserve already open tags without adding extra bracket', () => {
    const input = '<b:eval expr="${1:expression}"/>$0';
    expect(cleanSnippetBody(input)).toBe('<b:eval expr="expression"/>');
  });
});
