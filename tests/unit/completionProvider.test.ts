import { describe, expect, it } from 'vitest';
import * as vscode from 'vscode';
import { BloggerPathResolver } from '../../src/core/resolver/pathResolver.js';
import { BloggerCompletionProvider } from '../../src/vscode/providers/completionProvider.js';

describe('bloggerCompletionProvider', () => {
  const pathResolver = new BloggerPathResolver();
  const provider = new BloggerCompletionProvider(pathResolver);

  function createMockDocument(input: string | string[]): vscode.TextDocument {
    const lines = Array.isArray(input) ? input : [input];
    return {
      lineAt: (lineOrPos: number | vscode.Position) => {
        const lineNum = typeof lineOrPos === 'number' ? lineOrPos : lineOrPos.line;
        return { text: lines[lineNum] ?? '' };
      },
    } as unknown as vscode.TextDocument;
  }

  it('should provide completion items for data: expression with replacement range', () => {
    const text = '<b:eval expr="data:blog.t" />';
    const document = createMockDocument(text);
    const position = new vscode.Position(0, text.indexOf('blog.t') + 'blog.t'.length);

    const items = provider.provideCompletionItems(document, position) as vscode.CompletionItem[];
    expect(items).toBeDefined();
    expect(items.length).toBeGreaterThan(0);

    const titleItem = items.find(item => item.label === 'title');
    expect(titleItem).toBeDefined();
    expect(titleItem?.range).toBeDefined();
    const range = titleItem?.range as vscode.Range;
    expect(range.start.character).toBe(text.indexOf('blog.t') + 'blog.'.length);
    expect(range.end.character).toBe(text.indexOf('blog.t') + 'blog.t'.length);
  });

  it('should provide completion items for Blogger tags <b:', () => {
    const text = '<div><b:i';
    const document = createMockDocument(text);
    const position = new vscode.Position(0, text.length);

    const items = provider.provideCompletionItems(document, position) as vscode.CompletionItem[];
    expect(items).toBeDefined();
    expect(items.length).toBeGreaterThan(0);

    const ifItem = items.find(item => item.label === 'b:if');
    expect(ifItem).toBeDefined();
    expect(ifItem?.kind).toBe(vscode.CompletionItemKind.Snippet);
  });

  it('should provide completion items for closing Blogger tags </b:', () => {
    const text = '<div></b:loo';
    const document = createMockDocument(text);
    const position = new vscode.Position(0, text.length);

    const items = provider.provideCompletionItems(document, position) as vscode.CompletionItem[];
    expect(items).toBeDefined();
    expect(items.length).toBeGreaterThan(0);

    const loopItem = items.find(item => item.label === 'b:loop');
    expect(loopItem).toBeDefined();
    expect(loopItem?.insertText).toBe('b:loop>');
  });

  it('should provide completion items for b:widget type attribute', () => {
    const text = '<b:widget id="main" type="';
    const document = createMockDocument(text);
    const position = new vscode.Position(0, text.length);

    const items = provider.provideCompletionItems(document, position) as vscode.CompletionItem[];
    expect(items).toBeDefined();
    expect(items.length).toBe(25);

    const blogItem = items.find(item => item.label === 'Blog');
    expect(blogItem).toBeDefined();
    expect(blogItem?.kind).toBe(vscode.CompletionItemKind.EnumMember);
    expect(blogItem?.detail).toBe('(Blogger Widget Type)');
  });

  it('should provide completion items for b:defaultmarkup type attribute', () => {
    const text = '<b:defaultmarkup type="';
    const document = createMockDocument(text);
    const position = new vscode.Position(0, text.length);

    const items = provider.provideCompletionItems(document, position) as vscode.CompletionItem[];
    expect(items).toBeDefined();
    expect(items.length).toBe(27);

    const allItem = items.find(item => item.label === 'All');
    expect(allItem).toBeDefined();
    expect(allItem?.kind).toBe(vscode.CompletionItemKind.EnumMember);
    expect(allItem?.detail).toBe('(Blogger Default Markup Type)');
  });

  it('should provide completion items for multi-line b:widget tag', () => {
    const lines = [
      '<b:widget',
      '  id="Blog1"',
      '  type="',
    ];
    const multiDoc = createMockDocument(lines);
    const position = new vscode.Position(2, lines[2]!.length);

    const items = provider.provideCompletionItems(multiDoc, position) as vscode.CompletionItem[];
    expect(items).toBeDefined();
    expect(items.length).toBe(25);
  });

  it('should provide completion items for b:param tag', () => {
    const text = '<b:pa';
    const document = createMockDocument(text);
    const position = new vscode.Position(0, text.length);

    const items = provider.provideCompletionItems(document, position) as vscode.CompletionItem[];
    expect(items).toBeDefined();
    const paramItem = items.find(item => item.label === 'b:param');
    expect(paramItem).toBeDefined();
    expect(paramItem?.kind).toBe(vscode.CompletionItemKind.Snippet);
  });

  it('should safely clamp range start character to 0 when replacementLength is large', () => {
    const text = '<b:p';
    const document = createMockDocument(text);
    const position = new vscode.Position(0, 4);

    const items = provider.provideCompletionItems(document, position) as vscode.CompletionItem[];
    expect(items).toBeDefined();
    const item = items[0];
    expect(item?.range).toBeDefined();
    expect((item?.range as vscode.Range).start.character).toBeGreaterThanOrEqual(0);
  });

  it('should return undefined for plain text with no matching prefix', () => {
    const text = '<div class="container">';
    const document = createMockDocument(text);
    const position = new vscode.Position(0, text.length);

    const items = provider.provideCompletionItems(document, position);
    expect(items).toBeUndefined();
  });

  it('should provide completion items for <Variable tag with snippet kind and rich docs', () => {
    const text = '<Var';
    const document = createMockDocument(text);
    const position = new vscode.Position(0, text.length);

    const items = provider.provideCompletionItems(document, position) as vscode.CompletionItem[];
    expect(items).toBeDefined();
    const varItem = items.find(item => item.label === 'Variable');
    expect(varItem).toBeDefined();
    expect(varItem?.kind).toBe(vscode.CompletionItemKind.Snippet);
    expect(varItem?.documentation).toBeDefined();
  });

  it('should provide completion items for <Group tag', () => {
    const text = '<Gro';
    const document = createMockDocument(text);
    const position = new vscode.Position(0, text.length);

    const items = provider.provideCompletionItems(document, position) as vscode.CompletionItem[];
    expect(items).toBeDefined();
    const groupItem = items.find(item => item.label === 'Group');
    expect(groupItem).toBeDefined();
    expect(groupItem?.kind).toBe(vscode.CompletionItemKind.Snippet);
  });
});
