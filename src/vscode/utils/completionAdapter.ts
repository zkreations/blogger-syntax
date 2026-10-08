import type { BloggerSuggestion, BloggerSuggestionKind } from '../../core/models/types.js';
import * as vscode from 'vscode';
import { buildCompletionDocumentation } from './docBuilder.js';

function mapSuggestionKindToVsCode(kind: BloggerSuggestionKind): vscode.CompletionItemKind {
  switch (kind) {
    case 'enumMember':
      return vscode.CompletionItemKind.EnumMember;
    case 'snippet':
      return vscode.CompletionItemKind.Snippet;
    case 'variable':
      return vscode.CompletionItemKind.Variable;
    case 'operator':
      return vscode.CompletionItemKind.Operator;
    case 'property':
    default:
      return vscode.CompletionItemKind.Property;
  }
}

function formatDetail(suggestion: BloggerSuggestion): string {
  if (suggestion.detail) {
    return suggestion.detail;
  }
  if (suggestion.kind === 'enumMember') {
    return '(Blogger Skin Description)';
  }
  if (suggestion.kind === 'snippet') {
    return '(Blogger Tag)';
  }
  if (suggestion.kind === 'variable') {
    if (suggestion.categoryBadge === 'Lambda') {
      return '(Blogger Lambda Variable)';
    }
    const typeFormatted = suggestion.type.charAt(0).toUpperCase() + suggestion.type.slice(1);
    return `(Blogger Data: ${typeFormatted})`;
  }
  if (suggestion.kind === 'operator') {
    return '(Blogger Operator)';
  }
  const typeFormatted = suggestion.type.charAt(0).toUpperCase() + suggestion.type.slice(1);
  return `(Blogger Data: ${typeFormatted})`;
}

export function createCompletionItem(
  suggestion: BloggerSuggestion,
  range?: vscode.Range,
): vscode.CompletionItem {
  const label: vscode.CompletionItemLabel | string = suggestion.categoryBadge
    ? { label: suggestion.name, description: suggestion.categoryBadge }
    : suggestion.name;

  const item = new vscode.CompletionItem(
    label,
    mapSuggestionKindToVsCode(suggestion.kind),
  );

  const priority = suggestion.sortPriority ?? 50;
  item.sortText = `${priority.toString().padStart(2, '0')}_${suggestion.name}`;

  item.detail = formatDetail(suggestion);
  item.documentation = buildCompletionDocumentation(suggestion);

  if (range) {
    item.range = range;
  }

  if (suggestion.insertText) {
    if (suggestion.isSnippet) {
      item.insertText = new vscode.SnippetString(suggestion.insertText);
    }
    else {
      item.insertText = suggestion.insertText;
    }
  }

  if (suggestion.name === 'data:') {
    item.command = {
      command: 'editor.action.triggerSuggest',
      title: 'Trigger Blogger Data Suggestions',
    };
  }

  return item;
}

export function createCompletionItems(
  suggestions: readonly BloggerSuggestion[],
  range?: vscode.Range,
): vscode.CompletionItem[] {
  return suggestions.map(s => createCompletionItem(s, range));
}
