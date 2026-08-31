import type { BloggerDataType, BloggerSuggestion, BloggerSuggestionKind } from '../../core/models/types.js';
import * as vscode from 'vscode';
import { buildCompletionDocumentation } from './docBuilder.js';

function mapSuggestionKindToVsCode(kind: BloggerSuggestionKind): vscode.CompletionItemKind {
  switch (kind) {
    case 'enumMember':
      return vscode.CompletionItemKind.EnumMember;
    case 'snippet':
      return vscode.CompletionItemKind.Snippet;
    case 'property':
    default:
      return vscode.CompletionItemKind.Property;
  }
}

function formatDetail(type: BloggerDataType, kind: BloggerSuggestionKind): string {
  if (kind === 'enumMember') {
    return '(Blogger Skin Description)';
  }
  if (kind === 'snippet') {
    return '(Blogger Tag)';
  }
  const typeFormatted = type.charAt(0).toUpperCase() + type.slice(1);
  return `(Blogger Data: ${typeFormatted})`;
}

export function createCompletionItem(
  suggestion: BloggerSuggestion,
  range?: vscode.Range,
): vscode.CompletionItem {
  const item = new vscode.CompletionItem(
    suggestion.name,
    mapSuggestionKindToVsCode(suggestion.kind),
  );

  item.detail = formatDetail(suggestion.type, suggestion.kind);
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

  return item;
}

export function createCompletionItems(
  suggestions: readonly BloggerSuggestion[],
  range?: vscode.Range,
): vscode.CompletionItem[] {
  return suggestions.map(s => createCompletionItem(s, range));
}
