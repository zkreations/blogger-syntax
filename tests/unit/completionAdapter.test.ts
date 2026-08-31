import type { BloggerSuggestion } from '../../src/core/models/types.js';
import { describe, expect, it } from 'vitest';
import * as vscode from 'vscode';
import { createCompletionItem } from '../../src/vscode/utils/completionAdapter.js';

describe('completionAdapter', () => {
  it('should map property suggestion to CompletionItem with Property kind', () => {
    const suggestion: BloggerSuggestion = {
      name: 'title',
      type: 'string',
      description: 'Blog title',
      kind: 'property',
    };

    const item = createCompletionItem(suggestion);
    expect(item.label).toBe('title');
    expect(item.kind).toBe(vscode.CompletionItemKind.Property);
    expect(item.detail).toBe('(Blogger Data: String)');
    expect(item.documentation).toBeInstanceOf(vscode.MarkdownString);
  });

  it('should map enumMember suggestion to CompletionItem with EnumMember kind', () => {
    const suggestion: BloggerSuggestion = {
      name: 'Blog Title',
      type: 'string',
      description: 'Skin variable for blog title',
      kind: 'enumMember',
    };

    const item = createCompletionItem(suggestion);
    expect(item.label).toBe('Blog Title');
    expect(item.kind).toBe(vscode.CompletionItemKind.EnumMember);
    expect(item.detail).toBe('(Blogger Skin Description)');
  });
});
