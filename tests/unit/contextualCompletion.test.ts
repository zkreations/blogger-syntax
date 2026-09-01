import { describe, expect, it } from 'vitest';
import * as vscode from 'vscode';
import { BloggerPathResolver } from '../../src/core/resolver/pathResolver.js';
import { BloggerScopeTracker } from '../../src/core/scope/scopeTracker.js';
import { BloggerCompletionProvider } from '../../src/vscode/providers/completionProvider.js';
import { BloggerHoverProvider } from '../../src/vscode/providers/hoverProvider.js';

describe('contextualCompletion and Hover', () => {
  const pathResolver = new BloggerPathResolver();
  const scopeTracker = new BloggerScopeTracker();
  const completionProvider = new BloggerCompletionProvider(pathResolver, scopeTracker);
  const hoverProvider = new BloggerHoverProvider(pathResolver, scopeTracker);

  function createMockDocument(lines: string[], uri: string = 'file:///test.xml', version: number = 1): vscode.TextDocument {
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

  describe('b:loop with custom variable name (item)', () => {
    const lines = [
      '<b:loop values="data:posts" var="item">',
      '  <data:item.',
      '</b:loop>',
    ];

    it('should suggest post properties for data:item. inside loop', () => {
      const doc = createMockDocument(lines, 'file:///loopItem.xml');
      const position = new vscode.Position(1, '  <data:item.'.length);

      const items = completionProvider.provideCompletionItems(doc, position) as vscode.CompletionItem[];
      expect(items).toBeDefined();
      expect(items.length).toBeGreaterThan(0);

      const labels = items.map(item => item.label);
      expect(labels).toContain('title');
      expect(labels).toContain('body');
      expect(labels).toContain('snippets');
      expect(labels).toContain('author');
      expect(labels).toContain('url');
    });

    it('should suggest nested post author properties for data:item.author.', () => {
      const customLines = [
        '<b:loop values="data:posts" var="item">',
        '  <data:item.author.',
        '</b:loop>',
      ];
      const doc = createMockDocument(customLines, 'file:///loopAuthor.xml');
      const position = new vscode.Position(1, '  <data:item.author.'.length);

      const items = completionProvider.provideCompletionItems(doc, position) as vscode.CompletionItem[];
      expect(items).toBeDefined();
      const labels = items.map(item => item.label);
      expect(labels).toEqual(['name', 'profileUrl', 'authorPhoto', 'aboutMe']);
    });

    it('should provide correct replacement range when typing mid-word data:item.tit', () => {
      const customLines = [
        '<b:loop values="data:posts" var="item">',
        '  <data:item.tit',
        '</b:loop>',
      ];
      const doc = createMockDocument(customLines, 'file:///loopTit.xml');
      const position = new vscode.Position(1, '  <data:item.tit'.length);

      const items = completionProvider.provideCompletionItems(doc, position) as vscode.CompletionItem[];
      expect(items).toBeDefined();

      const titleItem = items.find(item => item.label === 'title');
      expect(titleItem).toBeDefined();
      expect(titleItem?.range).toBeDefined();
      const range = titleItem?.range as vscode.Range;
      expect(range.start.character).toBe('  <data:item.'.length);
      expect(range.end.character).toBe('  <data:item.tit'.length);
    });

    it('should NOT suggest post properties for data:item. outside the loop', () => {
      const customLines = [
        '<b:loop values="data:posts" var="item">',
        '  <div>In loop</div>',
        '</b:loop>',
        '<data:item.',
      ];
      const doc = createMockDocument(customLines, 'file:///outsideLoop.xml');
      const position = new vscode.Position(3, '<data:item.'.length);

      const items = completionProvider.provideCompletionItems(doc, position);
      expect(items).toBeUndefined();
    });
  });

  describe('nested b:loop with multiple variables (a and b)', () => {
    const lines = [
      '<b:loop values="data:posts" var="a">',
      '  <data:a.title/>',
      '  <b:loop values="data:posts" var="b">',
      '    <data:a.',
      '    <data:b.',
      '  </b:loop>',
      '</b:loop>',
    ];

    it('should suggest properties for both "a" and "b" inside nested loop', () => {
      const doc = createMockDocument(lines, 'file:///nestedLoops.xml');

      // Inside inner loop, typing data:a.
      const posA = new vscode.Position(3, '    <data:a.'.length);
      const itemsA = completionProvider.provideCompletionItems(doc, posA) as vscode.CompletionItem[];
      expect(itemsA).toBeDefined();
      expect(itemsA.map(i => i.label)).toContain('title');

      // Inside inner loop, typing data:b.
      const posB = new vscode.Position(4, '    <data:b.'.length);
      const itemsB = completionProvider.provideCompletionItems(doc, posB) as vscode.CompletionItem[];
      expect(itemsB).toBeDefined();
      expect(itemsB.map(i => i.label)).toContain('title');
    });

    it('should suggest both "a" and "b" at root data: trigger inside nested loop', () => {
      const customLines = [
        '<b:loop values="data:posts" var="a">',
        '  <b:loop values="data:posts" var="b">',
        '    <data:',
        '  </b:loop>',
        '</b:loop>',
      ];
      const doc = createMockDocument(customLines, 'file:///nestedRoot.xml');
      const position = new vscode.Position(2, '    <data:'.length);

      const items = completionProvider.provideCompletionItems(doc, position) as vscode.CompletionItem[];
      expect(items).toBeDefined();
      const labels = items.map(i => i.label);
      expect(labels).toContain('a');
      expect(labels).toContain('b');
      expect(labels).toContain('blog');
    });
  });

  describe('b:with alias scopes', () => {
    it('should suggest post properties for data:alias. when using b:with with data:posts.first', () => {
      const lines = [
        '<b:with value="data:posts.first" var="alias">',
        '  <data:alias.',
        '</b:with>',
      ];
      const doc = createMockDocument(lines, 'file:///withAlias.xml');
      const position = new vscode.Position(1, '  <data:alias.'.length);

      const items = completionProvider.provideCompletionItems(doc, position) as vscode.CompletionItem[];
      expect(items).toBeDefined();
      const labels = items.map(i => i.label);
      expect(labels).toContain('title');
      expect(labels).toContain('body');
      expect(labels).toContain('snippets');
    });

    it('should suggest author properties for data:writer. when using b:with with data:post.author', () => {
      const lines = [
        '<b:with value="data:post.author" var="writer">',
        '  <data:writer.',
        '</b:with>',
      ];
      const doc = createMockDocument(lines, 'file:///withWriter.xml');
      const position = new vscode.Position(1, '  <data:writer.'.length);

      const items = completionProvider.provideCompletionItems(doc, position) as vscode.CompletionItem[];
      expect(items).toBeDefined();
      const labels = items.map(i => i.label);
      expect(labels).toEqual(['name', 'profileUrl', 'authorPhoto', 'aboutMe']);
    });
  });

  describe('b:loop index variable', () => {
    it('should suggest index variable "i" with number type inside loop', () => {
      const lines = [
        '<b:loop values="data:posts" var="post" index="i">',
        '  <data:i',
        '</b:loop>',
      ];
      const doc = createMockDocument(lines, 'file:///loopIndex.xml');
      const position = new vscode.Position(1, '  <data:i'.length);

      const items = completionProvider.provideCompletionItems(doc, position) as vscode.CompletionItem[];
      expect(items).toBeDefined();
      const itemI = items.find(item => item.label === 'i');
      expect(itemI).toBeDefined();
      expect(itemI?.detail).toBe('(Blogger Data: Number)');
    });
  });

  describe('contextual HoverProvider', () => {
    it('should provide hover information for contextual loop variable property (data:item.title)', () => {
      const lines = [
        '<b:loop values="data:posts" var="item">',
        '  <data:item.title/>',
        '</b:loop>',
      ];
      const doc = createMockDocument(lines, 'file:///hoverLoop.xml');
      const position = new vscode.Position(1, '  <data:item.tit'.length);

      const hover = hoverProvider.provideHover(doc, position) as vscode.Hover;
      expect(hover).toBeDefined();
      expect(hover.contents).toBeDefined();
      const contentStr = hover.contents.map(c => typeof c === 'string' ? c : c.value).join('\n');
      expect(contentStr).toContain('data:item.title');
      expect(contentStr).toContain('Post title.');
    });

    it('should provide hover information for contextual with variable (data:writer.name)', () => {
      const lines = [
        '<b:with value="data:post.author" var="writer">',
        '  <data:writer.name/>',
        '</b:with>',
      ];
      const doc = createMockDocument(lines, 'file:///hoverWith.xml');
      const position = new vscode.Position(1, '  <data:writer.nam'.length);

      const hover = hoverProvider.provideHover(doc, position) as vscode.Hover;
      expect(hover).toBeDefined();
      const contentStr = hover.contents.map(c => typeof c === 'string' ? c : c.value).join('\n');
      expect(contentStr).toContain('data:writer.name');
      expect(contentStr).toContain('Display name of the post author.');
    });
  });
});
