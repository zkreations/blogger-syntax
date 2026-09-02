import { describe, expect, it } from 'vitest';
import * as vscode from 'vscode';
import { BloggerPathResolver } from '../../src/core/resolver/pathResolver.js';
import { BloggerScopeTracker } from '../../src/core/scope/scopeTracker.js';
import { BloggerCompletionProvider } from '../../src/vscode/providers/completionProvider.js';

describe('array properties resolution and autocompletion', () => {
  const pathResolver = new BloggerPathResolver();
  const scopeTracker = new BloggerScopeTracker();
  const completionProvider = new BloggerCompletionProvider(pathResolver, scopeTracker);

  function createMockDocument(lines: string[], uri: string = 'file:///arrayTest.xml', version: number = 1): vscode.TextDocument {
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

  it('should suggest array keys (size, length, empty, notEmpty, any, first, last) for data:posts.', () => {
    const suggestions = pathResolver.resolveDataPath(['posts']);
    const names = suggestions.map(s => s.name);

    expect(names).toContain('size');
    expect(names).toContain('length');
    expect(names).toContain('empty');
    expect(names).toContain('notEmpty');
    expect(names).toContain('any');
    expect(names).toContain('first');
    expect(names).toContain('last');

    // Should NOT contain single post properties directly on posts
    expect(names).not.toContain('title');
    expect(names).not.toContain('body');
  });

  it('should suggest singlePostProperties on data:posts.first.', () => {
    const suggestions = pathResolver.resolveDataPath(['posts', 'first']);
    const names = suggestions.map(s => s.name);

    expect(names).toContain('title');
    expect(names).toContain('body');
    expect(names).toContain('snippets');
    expect(names).toContain('author');
    expect(names).toContain('url');
  });

  it('should suggest singlePostProperties on data:posts.last.', () => {
    const suggestions = pathResolver.resolveDataPath(['posts', 'last']);
    const names = suggestions.map(s => s.name);

    expect(names).toContain('title');
    expect(names).toContain('body');
    expect(names).toContain('author');
  });

  it('should suggest array keys for post comments (data:post.comments.)', () => {
    const suggestions = pathResolver.resolveDataPath(['post', 'comments']);
    const names = suggestions.map(s => s.name);

    expect(names).toContain('size');
    expect(names).toContain('length');
    expect(names).toContain('empty');
    expect(names).toContain('notEmpty');
    expect(names).toContain('any');
    expect(names).toContain('first');
    expect(names).toContain('last');
  });

  it('should provide autocompletion for data:posts. via CompletionProvider', () => {
    const lines = ['<b:eval expr="data:posts." />'];
    const doc = createMockDocument(lines, 'file:///postsEval.xml');
    const position = new vscode.Position(0, '<b:eval expr="data:posts.'.length);

    const items = completionProvider.provideCompletionItems(doc, position) as vscode.CompletionItem[];
    expect(items).toBeDefined();

    const labels = items.map(item => item.label);
    expect(labels).toContain('size');
    expect(labels).toContain('length');
    expect(labels).toContain('empty');
    expect(labels).toContain('notEmpty');
    expect(labels).toContain('any');
    expect(labels).toContain('first');
    expect(labels).toContain('last');
    expect(labels).not.toContain('title');
  });

  it('should provide autocompletion for data:posts.first.title via CompletionProvider', () => {
    const lines = ['<b:eval expr="data:posts.first." />'];
    const doc = createMockDocument(lines, 'file:///postsFirstEval.xml');
    const position = new vscode.Position(0, '<b:eval expr="data:posts.first.'.length);

    const items = completionProvider.provideCompletionItems(doc, position) as vscode.CompletionItem[];
    expect(items).toBeDefined();

    const labels = items.map(item => item.label);
    expect(labels).toContain('title');
    expect(labels).toContain('body');
    expect(labels).toContain('snippets');
    expect(labels).toContain('author');
  });

  it('should infer child properties for loop variable on <b:loop values="data:posts" var="item">', () => {
    const lines = [
      '<b:loop values="data:posts" var="item">',
      '  <data:item.',
      '</b:loop>',
    ];
    const doc = createMockDocument(lines, 'file:///postsLoopVar.xml');
    const position = new vscode.Position(1, '  <data:item.'.length);

    const items = completionProvider.provideCompletionItems(doc, position) as vscode.CompletionItem[];
    expect(items).toBeDefined();

    const labels = items.map(item => item.label);
    expect(labels).toContain('title');
    expect(labels).toContain('body');
    expect(labels).toContain('snippets');
    expect(labels).toContain('author');
  });
});
