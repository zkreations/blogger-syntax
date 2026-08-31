import type { BloggerHoverInfo, BloggerSuggestion } from '../../core/models/types.js';
import * as vscode from 'vscode';
import { cleanSnippetBody } from '../../core/utils/snippetFormatter.js';

/**
 * Returns a human-friendly label for a documentation URL based on its host or context.
 */
export function getDocUrlLabel(url: string, index: number, total: number): string {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes('support.google.com') || parsed.hostname.includes('google.com')) {
      return 'Google Documentation';
    }
    if (parsed.hostname.includes('orbiona.com') || parsed.hostname.includes('bloggercode')) {
      return 'BloggerCode Reference';
    }
    if (parsed.hostname.includes('zkreations.com')) {
      return 'zkreations Reference';
    }
  }
  catch {
    // Fallback if URL constructor fails
  }

  if (total === 1) {
    return 'Documentation Reference';
  }
  return `Reference ${index + 1}`;
}

/**
 * Formats one or multiple documentation URLs into a single markdown link line.
 */
export function formatDocLinks(docUrls?: string | readonly string[]): string | undefined {
  if (!docUrls) {
    return undefined;
  }

  const urls = Array.isArray(docUrls) ? docUrls : [docUrls];
  const validUrls = urls.filter(u => typeof u === 'string' && u.trim().length > 0);

  if (validUrls.length === 0) {
    return undefined;
  }

  const links = validUrls.map((url, i) => {
    const label = getDocUrlLabel(url, i, validUrls.length);
    return `[${label}](${url.trim()})`;
  });

  return links.join(' • ');
}

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
  markdown.isTrusted = true;

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

  const linksMarkdown = formatDocLinks(suggestion.docUrl);
  if (linksMarkdown) {
    markdown.appendMarkdown(`\n\n${linksMarkdown}\n`);
  }

  return markdown;
}

/**
 * Builds a clean, VS-Code native style hover tooltip MarkdownString.
 */
export function buildHoverDocumentation(hoverInfo: BloggerHoverInfo): vscode.MarkdownString {
  const markdown = new vscode.MarkdownString('', true);
  markdown.isTrusted = true;

  // Header badge: (tag), (data: String), (attribute), etc.
  let headerBadge = `(${hoverInfo.category})`;
  if (hoverInfo.category === 'data' && hoverInfo.type) {
    const formattedType = hoverInfo.type.charAt(0).toUpperCase() + hoverInfo.type.slice(1);
    headerBadge = `(data: ${formattedType})`;
  }
  else if (hoverInfo.category === 'attribute' && hoverInfo.type) {
    headerBadge = `(attribute: ${hoverInfo.type})`;
  }

  markdown.appendMarkdown(`${headerBadge} **\`${hoverInfo.title}\`**\n\n`);

  if (hoverInfo.description) {
    markdown.appendMarkdown(`${hoverInfo.description}\n\n`);
  }

  const linksMarkdown = formatDocLinks(hoverInfo.docUrls);
  if (linksMarkdown) {
    markdown.appendMarkdown(`${linksMarkdown}\n`);
  }

  return markdown;
}
