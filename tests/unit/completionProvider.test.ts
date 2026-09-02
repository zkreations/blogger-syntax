import { describe, expect, it } from 'vitest';
import * as vscode from 'vscode';
import { BloggerPathResolver } from '../../src/core/resolver/pathResolver.js';
import { BloggerCompletionProvider } from '../../src/vscode/providers/completionProvider.js';
import { createMockDocument } from '../helpers/mockDocument.js';

describe('bloggerCompletionProvider', () => {
  const pathResolver = new BloggerPathResolver();
  const provider = new BloggerCompletionProvider(pathResolver);

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

  it('should provide snippet completion items for Blogger opening tags', () => {
    const text = '<div><b:i';
    const document = createMockDocument(text);
    const position = new vscode.Position(0, text.length);

    const items = provider.provideCompletionItems(document, position) as vscode.CompletionItem[];
    expect(items).toBeDefined();
    const ifItem = items.find(item => item.label === 'b:if');
    expect(ifItem).toBeDefined();
    expect(ifItem?.kind).toBe(vscode.CompletionItemKind.Snippet);
  });

  it('should provide completion items for closing Blogger tags', () => {
    const text = '<div></b:loo';
    const document = createMockDocument(text);
    const position = new vscode.Position(0, text.length);

    const items = provider.provideCompletionItems(document, position) as vscode.CompletionItem[];
    expect(items).toBeDefined();
    const loopItem = items.find(item => item.label === 'b:loop');
    expect(loopItem).toBeDefined();
    expect(loopItem?.insertText).toBe('b:loop>');
  });

  it('should provide attribute value completions in multi-line tags', () => {
    const lines = [
      '<b:widget',
      '  id="Blog1"',
      '  type="',
    ];
    const multiDoc = createMockDocument(lines);
    const position = new vscode.Position(2, lines[2]!.length);

    const items = provider.provideCompletionItems(multiDoc, position) as vscode.CompletionItem[];
    expect(items).toBeDefined();
    expect(items.length).toBeGreaterThan(0);
    expect(items.some(item => item.label === 'Blog')).toBe(true);
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
});
