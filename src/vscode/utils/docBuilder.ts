import type { BloggerHoverInfo, BloggerSuggestion } from '../../core/models/types.js';
import * as vscode from 'vscode';
import { cleanSnippetBody } from '../../core/utils/snippetFormatter.js';

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

export function buildCompletionDocumentation(suggestion: BloggerSuggestion): vscode.MarkdownString {
  const markdown = new vscode.MarkdownString('', true);
  markdown.isTrusted = true;

  if (suggestion.deprecated) {
    markdown.appendMarkdown('⚠️ **Deprecated**\n\n');
  }

  if (suggestion.description) {
    markdown.appendMarkdown(suggestion.description);
  }

  const exampleCode = getSuggestionExample(suggestion);
  if (exampleCode) {
    markdown.appendCodeblock(exampleCode, 'xml');
  }

  if (suggestion.attributes && Object.keys(suggestion.attributes).length > 0) {
    markdown.appendMarkdown('\n---\n**Attributes:**\n');
    for (const attr of Object.values(suggestion.attributes)) {
      const requiredBadge = attr.required ? ' *(required)*' : '';
      const desc = attr.description ? ` — ${attr.description}` : '';
      markdown.appendMarkdown(`- \`${attr.name}\`${requiredBadge} (\`${attr.type}\`)${desc}\n`);
    }
  }

  return markdown;
}

export function buildHoverDocumentation(hoverInfo: BloggerHoverInfo): vscode.MarkdownString {
  const markdown = new vscode.MarkdownString('', true);
  markdown.isTrusted = true;

  let headerBadge = `(${hoverInfo.category})`;
  if (hoverInfo.category === 'data' && hoverInfo.type) {
    const formattedType = hoverInfo.type.charAt(0).toUpperCase() + hoverInfo.type.slice(1);
    headerBadge = `(data: ${formattedType})`;
  }
  else if (hoverInfo.category === 'attribute' && hoverInfo.type) {
    headerBadge = `(attribute: ${hoverInfo.type})`;
  }
  else if (hoverInfo.category === 'operator') {
    headerBadge = '(operator)';
  }
  else if (hoverInfo.category === 'variable') {
    headerBadge = '(variable)';
  }

  markdown.appendMarkdown(`${headerBadge} **\`${hoverInfo.title}\`**\n\n`);

  if (hoverInfo.description) {
    markdown.appendMarkdown(`${hoverInfo.description}\n\n`);
  }

  if (hoverInfo.example && hoverInfo.category === 'tag') {
    const cleaned = cleanSnippetBody(hoverInfo.example, true);
    if (cleaned) {
      markdown.appendCodeblock(cleaned, 'xml');
    }
  }

  return markdown;
}
