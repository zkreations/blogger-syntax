import type { BloggerHoverInfo, BloggerSuggestion } from '../../src/core/models/types.js';
import { describe, expect, it } from 'vitest';
import * as vscode from 'vscode';
import {
  buildCompletionDocumentation,
  buildHoverDocumentation,
  formatDocLinks,
  getSuggestionExample,
} from '../../src/vscode/utils/docBuilder.js';

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

  describe('formatDocLinks', () => {
    it('should format multiple URLs with appropriate labels', () => {
      const urls = [
        'https://support.google.com/blogger/answer/46995',
        'https://bloggercode.orbiona.com/2016/03/tag-b-eval.html',
      ];
      const result = formatDocLinks(urls);
      expect(result).toBe(
        '[Google Documentation](https://support.google.com/blogger/answer/46995) • [BloggerCode Reference](https://bloggercode.orbiona.com/2016/03/tag-b-eval.html)',
      );
    });

    it('should format single URL', () => {
      const url = 'https://bloggercode.orbiona.com/2018/02/tag-b-attr.html';
      const result = formatDocLinks(url);
      expect(result).toBe('[BloggerCode Reference](https://bloggercode.orbiona.com/2018/02/tag-b-attr.html)');
    });

    it('should return undefined for empty docUrls', () => {
      expect(formatDocLinks(undefined)).toBeUndefined();
      expect(formatDocLinks([])).toBeUndefined();
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
        docUrl: 'https://bloggercode.orbiona.com/2016/03/tag-b-includable-b-include.html',
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
      expect(doc.value).toContain('[BloggerCode Reference](https://bloggercode.orbiona.com/2016/03/tag-b-includable-b-include.html)');
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

  describe('buildHoverDocumentation', () => {
    it('should format hover documentation for a tag with multiple links', () => {
      const hoverInfo: BloggerHoverInfo = {
        title: '<b:eval>',
        category: 'tag',
        description: 'Evaluates a Blogger expression and explicitly outputs the result.',
        docUrls: [
          'https://support.google.com/blogger/answer/46995',
          'https://bloggercode.orbiona.com/2016/03/tag-b-eval.html',
        ],
      };

      const doc = buildHoverDocumentation(hoverInfo);
      expect(doc.value).toContain('(tag) **`<b:eval>`**');
      expect(doc.value).toContain('Evaluates a Blogger expression and explicitly outputs the result.');
      expect(doc.value).toContain('[Google Documentation](https://support.google.com/blogger/answer/46995)');
      expect(doc.value).toContain('[BloggerCode Reference](https://bloggercode.orbiona.com/2016/03/tag-b-eval.html)');
    });

    it('should format hover documentation for a data property', () => {
      const hoverInfo: BloggerHoverInfo = {
        title: 'data:view.isHomepage',
        category: 'data',
        type: 'boolean',
        description: 'True when viewing the blog homepage.',
        docUrls: ['https://bloggercode.orbiona.com/1978/10/data-view-isHomepage.html'],
      };

      const doc = buildHoverDocumentation(hoverInfo);
      expect(doc.value).toContain('(data: Boolean) **`data:view.isHomepage`**');
      expect(doc.value).toContain('True when viewing the blog homepage.');
      expect(doc.value).toContain('[BloggerCode Reference](https://bloggercode.orbiona.com/1978/10/data-view-isHomepage.html)');
    });

    it('should format hover documentation with code example when provided on tag', () => {
      const hoverInfo: BloggerHoverInfo = {
        title: '<b:if>',
        category: 'tag',
        description: 'Conditional block',
        example: 'b:if cond="${1:condition}">\n\t$0\n</b:if>',
      };

      const doc = buildHoverDocumentation(hoverInfo);
      expect(doc.value).toContain('(tag) **`<b:if>`**');
      expect(doc.value).toContain('Conditional block');
      expect(doc.value).toContain('```xml\n<b:if cond="condition">\n\t\n</b:if>\n```');
    });
  });
});
