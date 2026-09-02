import { describe, expect, it } from 'vitest';
import * as vscode from 'vscode';
import { BloggerPathResolver } from '../../src/core/resolver/pathResolver.js';
import { BloggerScopeTracker } from '../../src/core/scope/scopeTracker.js';
import { BloggerCompletionProvider } from '../../src/vscode/providers/completionProvider.js';

describe('typeMembers resolution and chaining', () => {
  const pathResolver = new BloggerPathResolver();
  const scopeTracker = new BloggerScopeTracker();
  const completionProvider = new BloggerCompletionProvider(pathResolver, scopeTracker);

  function createMockDocument(lines: string[], uri: string = 'file:///typeTest.xml', version: number = 1): vscode.TextDocument {
    const fullText = lines.join('\n');
    return {
      uri: { toString: () => uri } as vscode.Uri,
      version,
      lineCount: lines.length,
      lineAt: (lineOrPos: number | vscode.Position) => {
        const lineNum = typeof lineOrPos === 'number' ? lineOrPos : lineOrPos.line;
        return { text: lines[lineNum] ?? '' };
      },
      getText: () => fullText,
      offsetAt: (position: vscode.Position) => {
        let offset = 0;
        for (let l = 0; l < position.line; l++) {
          offset += (lines[l]?.length ?? 0) + 1;
        }
        return offset + position.character;
      },
    } as unknown as vscode.TextDocument;
  }

  describe('string members', () => {
    it('should suggest string members on string property (data:blog.title.)', () => {
      const suggestions = pathResolver.resolveDataPath(['blog', 'title']);
      const names = suggestions.map(s => s.name);

      expect(names).toEqual(['escaped', 'jsEscaped', 'jsonEscaped', 'cssEscaped']);
    });

    it('should support string chaining on string members (data:blog.title.escaped.)', () => {
      const suggestions = pathResolver.resolveDataPath(['blog', 'title', 'escaped']);
      const names = suggestions.map(s => s.name);

      expect(names).toEqual(['escaped', 'jsEscaped', 'jsonEscaped', 'cssEscaped']);
    });
  });

  describe('image members', () => {
    it('should suggest image members on image property (data:post.featuredImage.)', () => {
      const suggestions = pathResolver.resolveDataPath(['post', 'featuredImage']);
      const names = suggestions.map(s => s.name);

      expect(names).toContain('width');
      expect(names).toContain('height');
      expect(names).toContain('isResizable');
      expect(names).toContain('originalWidth');
      expect(names).toContain('originalHeight');
      expect(names).toContain('isYouTube');
      expect(names).toContain('youtubeMaxResDefaultUrl');
    });

    it('should support image chaining on youtubeMaxResDefaultUrl (data:post.featuredImage.youtubeMaxResDefaultUrl.)', () => {
      const suggestions = pathResolver.resolveDataPath(['post', 'featuredImage', 'youtubeMaxResDefaultUrl']);
      const names = suggestions.map(s => s.name);

      expect(names).toContain('width');
      expect(names).toContain('height');
      expect(names).toContain('isResizable');
      expect(names).toContain('originalWidth');
      expect(names).toContain('originalHeight');
    });
  });

  describe('locale members', () => {
    it('should suggest locale members on locale property (data:blog.locale.)', () => {
      const suggestions = pathResolver.resolveDataPath(['blog', 'locale']);
      const names = suggestions.map(s => s.name);

      expect(names).toContain('name');
      expect(names).toContain('language');
      expect(names).toContain('country');
      expect(names).toContain('variant');
      expect(names).toContain('languageDirection');
      expect(names).toContain('languageAlignment');
    });

    it('should support chaining from locale string members (data:blog.locale.country.)', () => {
      const suggestions = pathResolver.resolveDataPath(['blog', 'locale', 'country']);
      const names = suggestions.map(s => s.name);

      expect(names).toEqual(['escaped', 'jsEscaped', 'jsonEscaped', 'cssEscaped']);
    });
  });

  describe('date members', () => {
    it('should suggest date members on date property (data:post.date.)', () => {
      const suggestions = pathResolver.resolveDataPath(['post', 'date']);
      const names = suggestions.map(s => s.name);

      expect(names).toEqual(['year', 'month', 'day', 'dayOfWeek', 'dayOfMonth', 'dayOfYear', 'iso8601']);
    });

    it('should support chaining from date.iso8601 to string members (data:post.date.iso8601.)', () => {
      const suggestions = pathResolver.resolveDataPath(['post', 'date', 'iso8601']);
      const names = suggestions.map(s => s.name);

      expect(names).toEqual(['escaped', 'jsEscaped', 'jsonEscaped', 'cssEscaped']);
    });
  });

  describe('url members', () => {
    it('should suggest url members on url property (data:blog.url.)', () => {
      const suggestions = pathResolver.resolveDataPath(['blog', 'url']);
      const names = suggestions.map(s => s.name);

      expect(names).toEqual(['canonical', 'https', 'http']);
    });

    it('should support chaining on url members (data:blog.url.https.)', () => {
      const suggestions = pathResolver.resolveDataPath(['blog', 'url', 'https']);
      const names = suggestions.map(s => s.name);

      expect(names).toEqual(['canonical', 'https', 'http']);
    });
  });

  describe('completion provider integration', () => {
    it('should suggest string members for data:blog.title. via CompletionProvider', () => {
      const lines = ['<b:eval expr="data:blog.title." />'];
      const doc = createMockDocument(lines, 'file:///titleTest.xml');
      const position = new vscode.Position(0, '<b:eval expr="data:blog.title.'.length);

      const items = completionProvider.provideCompletionItems(doc, position) as vscode.CompletionItem[];
      expect(items).toBeDefined();

      const labels = items.map(item => item.label);
      expect(labels).toContain('escaped');
      expect(labels).toContain('jsEscaped');
      expect(labels).toContain('jsonEscaped');
      expect(labels).toContain('cssEscaped');
    });

    it('should suggest date members for data:post.date. via CompletionProvider', () => {
      const lines = ['<b:eval expr="data:post.date." />'];
      const doc = createMockDocument(lines, 'file:///dateTest.xml');
      const position = new vscode.Position(0, '<b:eval expr="data:post.date.'.length);

      const items = completionProvider.provideCompletionItems(doc, position) as vscode.CompletionItem[];
      expect(items).toBeDefined();

      const labels = items.map(item => item.label);
      expect(labels).toContain('year');
      expect(labels).toContain('month');
      expect(labels).toContain('day');
      expect(labels).toContain('iso8601');
    });
  });
});
