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
    expect((item.documentation as vscode.MarkdownString).value).toContain('```xml');
  });

  it('should map snippet suggestion with cleaned code block in documentation', () => {
    const suggestion: BloggerSuggestion = {
      name: 'b:if',
      type: 'string',
      description: 'Renders child content if the condition evaluates to true.',
      insertText: 'b:if cond="${1:condition}">\n\t$0\n</b:if>',
      isSnippet: true,
      kind: 'snippet',
    };

    const item = createCompletionItem(suggestion);
    expect(item.label).toBe('b:if');
    expect(item.kind).toBe(vscode.CompletionItemKind.Snippet);
    expect(item.detail).toBe('(Blogger Tag)');
    expect(item.insertText).toBeInstanceOf(vscode.SnippetString);
    const docValue = (item.documentation as vscode.MarkdownString).value;
    expect(docValue).toContain('Renders child content if the condition evaluates to true.');
    expect(docValue).toContain('```xml\n<b:if cond="condition">\n\t\n</b:if>\n```');
  });

  it('should preserve custom detail when provided on suggestion', () => {
    const suggestion: BloggerSuggestion = {
      name: 'Blog',
      type: 'string',
      description: 'Blog widget',
      detail: '(Blogger Widget Type)',
      kind: 'enumMember',
    };

    const item = createCompletionItem(suggestion);
    expect(item.label).toBe('Blog');
    expect(item.kind).toBe(vscode.CompletionItemKind.EnumMember);
    expect(item.detail).toBe('(Blogger Widget Type)');
  });

  it('should attach editor.action.triggerSuggest command for data: tag completion', () => {
    const suggestion: BloggerSuggestion = {
      name: 'data:',
      type: 'string',
      description: 'Outputs resolved data expression',
      kind: 'snippet',
      insertText: 'data:${1}/>$0',
      isSnippet: true,
    };

    const item = createCompletionItem(suggestion);
    expect(item.command).toBeDefined();
    expect(item.command?.command).toBe('editor.action.triggerSuggest');
  });

  it('should format label as CompletionItemLabel and generate sortText when categoryBadge and sortPriority are present', () => {
    const suggestion: BloggerSuggestion = {
      name: 'resize',
      type: 'image',
      description: 'Resizes the image',
      kind: 'property',
      categoryBadge: 'Image',
      sortPriority: 10,
    };

    const item = createCompletionItem(suggestion);
    expect(typeof item.label).toBe('object');
    expect((item.label as vscode.CompletionItemLabel).label).toBe('resize');
    expect((item.label as vscode.CompletionItemLabel).description).toBe('Image');
    expect(item.sortText).toBe('10_resize');
  });

  it('should format detail properly for lambda variables vs template data variables', () => {
    const lambdaVar: BloggerSuggestion = {
      name: 'p',
      type: 'object',
      kind: 'variable',
      categoryBadge: 'Lambda',
      sortPriority: 0,
    };
    const templateVar: BloggerSuggestion = {
      name: 'post',
      type: 'object',
      kind: 'variable',
      categoryBadge: 'Local',
      sortPriority: 0,
    };

    const lambdaItem = createCompletionItem(lambdaVar);
    const templateItem = createCompletionItem(templateVar);

    expect(lambdaItem.detail).toBe('(Blogger Lambda Variable)');
    expect(templateItem.detail).toBe('(Blogger Data: Object)');
  });
});
