import { describe, expect, it } from 'vitest';
import * as vscode from 'vscode';
import { BloggerPathResolver } from '../../src/core/resolver/pathResolver.js';
import { BloggerCompletionProvider } from '../../src/vscode/providers/completionProvider.js';

describe('bloggerCompletionProvider', () => {
  const pathResolver = new BloggerPathResolver();
  const provider = new BloggerCompletionProvider(pathResolver);

  function createMockDocument(lineText: string): vscode.TextDocument {
    return {
      lineAt: () => ({ text: lineText }),
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
    expect(titleItem?.range?.start.character).toBe(text.indexOf('blog.t') + 'blog.'.length);
    expect(titleItem?.range?.end.character).toBe(text.indexOf('blog.t') + 'blog.t'.length);
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

  it('should return undefined for plain text with no matching prefix', () => {
    const text = '<div class="container">';
    const document = createMockDocument(text);
    const position = new vscode.Position(0, text.length);

    const items = provider.provideCompletionItems(document, position);
    expect(items).toBeUndefined();
  });
});

