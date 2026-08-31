import type { BloggerSuggestion } from '../../core/models/types.js';
import * as vscode from 'vscode';
import { cleanSnippetBody } from '../../core/utils/snippetFormatter.js';

/**
 * Generates an example code snippet for a suggestion based on its metadata and kind.
 */
export function getSuggestionExample(suggestion: BloggerSuggestion): string | undefined {
  if (suggestion.example) {
    return suggestion.example;
  }

  if (suggestion.kind === 'snippet' && suggestion.insertText) {
    return cleanSnippetBody(suggestion.insertText, true);
  }

  if (suggestion.kind === 'enumMember') {
    return `<Variable name="myVariable" description="${suggestion.name}" type="color" default="#000000" value="#000000"/>`;
  }

  if (suggestion.kind === 'property') {
    return `data:${suggestion.name}`;
  }

  return undefined;
}

/**
 * Builds a structured, rich vscode.MarkdownString documentation for completion items.
 */
export function buildCompletionDocumentation(suggestion: BloggerSuggestion): vscode.MarkdownString {
  const markdown = new vscode.MarkdownString('', true);

  if (suggestion.deprecated) {
    markdown.appendMarkdown('⚠️ **Deprecated**\n\n');
  }

  if (suggestion.description) {
    markdown.appendMarkdown(suggestion.description);
  }

  const exampleCode = getSuggestionExample(suggestion);
  if (exampleCode) {
    markdown.appendCodeblock(exampleCode, suggestion.exampleLanguage ?? 'xml');
  }

  if (suggestion.attributes && Object.keys(suggestion.attributes).length > 0) {
    markdown.appendMarkdown('\n---\n**Attributes:**\n');
    for (const attr of Object.values(suggestion.attributes)) {
      const requiredBadge = attr.required ? ' *(required)*' : '';
      const desc = attr.description ? ` — ${attr.description}` : '';
      markdown.appendMarkdown(`- \`${attr.name}\`${requiredBadge} (\`${attr.type}\`)${desc}\n`);
    }
  }

  if (suggestion.docUrl) {
    markdown.appendMarkdown(`\n[📖 Documentation](${suggestion.docUrl})\n`);
  }

  return markdown;
}
