import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

interface SnippetEntry {
  prefix: string;
  body: string[];
  description: string;
}

describe('snippets Validation', () => {
  const snippetsPath = resolve(__dirname, '../../snippets/snippets.code-snippets');
  const fileContent = readFileSync(snippetsPath, 'utf-8');
  const snippetsJson = JSON.parse(fileContent) as Record<string, SnippetEntry>;

  it('should be valid JSON with entries', () => {
    expect(typeof snippetsJson).toBe('object');
    expect(Object.keys(snippetsJson).length).toBeGreaterThan(20);
  });

  it('every snippet should have valid prefix, body, and description', () => {
    const prefixes = new Set<string>();

    for (const [title, snippet] of Object.entries(snippetsJson)) {
      expect(typeof snippet.prefix, `Snippet "${title}" has invalid prefix`).toBe('string');
      expect(snippet.prefix.length).toBeGreaterThan(0);

      expect(Array.isArray(snippet.body), `Snippet "${title}" body should be an array`).toBe(true);
      expect(snippet.body.length).toBeGreaterThan(0);

      expect(typeof snippet.description, `Snippet "${title}" description should be string`).toBe('string');
      expect(snippet.description.length).toBeGreaterThan(0);

      expect(prefixes.has(snippet.prefix), `Duplicate prefix found: "${snippet.prefix}" in "${title}"`).toBe(false);
      prefixes.add(snippet.prefix);
    }
  });

  it('should include all essential Blogger b:* tags', () => {
    const prefixes = Object.values(snippetsJson).map(s => s.prefix);

    const essentialPrefixes = [
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

    for (const prefix of essentialPrefixes) {
      expect(prefixes, `Missing essential snippet prefix: ${prefix}`).toContain(prefix);
    }
  });
});
