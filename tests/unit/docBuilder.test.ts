import type { BloggerSuggestion } from '../../src/core/models/types.js';
import { describe, expect, it } from 'vitest';
import * as vscode from 'vscode';
import { buildCompletionDocumentation, getSuggestionExample } from '../../src/vscode/utils/docBuilder.js';

describe('docBuilder', () => {
  describe('getSuggestionExample', () => {
    it('should return custom example if explicitly provided', () => {
      const suggestion: BloggerSuggestion = {
        name: 'b:if',
        type: 'string',
        kind: 'snippet',
        example: '<b:if cond="data:view.isPost">\n  <!-- Post content -->\n</b:if>',
      };

      expect(getSuggestionExample(suggestion)).toBe('<b:if cond="data:view.isPost">\n  <!-- Post content -->\n</b:if>');
    });

    it('should clean snippet body for snippet suggestion without explicit example', () => {
      const suggestion: BloggerSuggestion = {
        name: 'b:if',
        type: 'string',
        kind: 'snippet',
        insertText: 'b:if cond="${1:condition}">\n\t$0\n</b:if>',
      };

      expect(getSuggestionExample(suggestion)).toBe('<b:if cond="condition">\n\t\n</b:if>');
    });

    it('should generate variable example for enumMember kind', () => {
      const suggestion: BloggerSuggestion = {
        name: 'Blog Title',
        type: 'string',
        kind: 'enumMember',
      };

      expect(getSuggestionExample(suggestion)).toBe(
        '<Variable name="myVariable" description="Blog Title" type="color" default="#000000" value="#000000"/>',
      );
    });

    it('should generate data path example for property kind', () => {
      const suggestion: BloggerSuggestion = {
        name: 'title',
        type: 'string',
        kind: 'property',
      };

      expect(getSuggestionExample(suggestion)).toBe('data:title');
    });
  });

  describe('buildCompletionDocumentation', () => {
    it('should build full Markdown documentation for a tag with attributes and docUrl', () => {
      const suggestion: BloggerSuggestion = {
        name: 'b:include',
        type: 'string',
        kind: 'snippet',
        description: 'Executes and renders a b:includable section.',
        insertText: 'b:include name="${1:main}" data="${2:data}"/>$0',
        docUrl: 'https://blogger.com/docs/tags/include',
        attributes: {
          name: { name: 'name', type: 'string', required: true, description: 'ID of section' },
          data: { name: 'data', type: 'string', required: false, description: 'Data expression' },
        },
      };

      const doc = buildCompletionDocumentation(suggestion);
      expect(doc).toBeInstanceOf(vscode.MarkdownString);
      expect(doc.value).toContain('Executes and renders a b:includable section.');
      expect(doc.value).toContain('```xml\n<b:include name="main" data="data"/>\n```');
      expect(doc.value).toContain('**Attributes:**');
      expect(doc.value).toContain('`name` *(required)* (`string`) — ID of section');
      expect(doc.value).toContain('`data` (`string`) — Data expression');
      expect(doc.value).toContain('[📖 Documentation](https://blogger.com/docs/tags/include)');
    });

    it('should show deprecation warning when deprecated is true', () => {
      const suggestion: BloggerSuggestion = {
        name: 'oldTag',
        type: 'string',
        kind: 'snippet',
        description: 'Old tag description',
        deprecated: true,
      };

      const doc = buildCompletionDocumentation(suggestion);
      expect(doc.value).toContain('⚠️ **Deprecated**');
      expect(doc.value).toContain('Old tag description');
    });
  });
});
