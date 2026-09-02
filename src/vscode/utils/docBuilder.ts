import type { BloggerHoverInfo, BloggerSuggestion } from '../../core/models/types.js';
import * as vscode from 'vscode';
import { cleanSnippetBody } from '../../core/utils/snippetFormatter.js';

export function getDocUrlLabel(url: string, index: number = 0, total: number = 1): string {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname;
    if (host.includes('support.google.com') || host.includes('google.com')) {
      return 'Google Documentation';
    }
    if (host.includes('orbiona.com') || host.includes('bloggercode')) {
      return 'BloggerCode Reference';
    }
    if (host.includes('zkreations.com')) {
      return 'zkreations Reference';
    }
  }
  catch {}

  if (total === 1) {
    return 'Documentation Reference';
  }
  return `Reference ${index + 1}`;
}

export function formatDocLinks(docUrls?: string | readonly string[]): string | undefined {
  if (!docUrls) {
    return undefined;
  }

  const urls = Array.isArray(docUrls) ? docUrls : [docUrls];
  const validUrls = urls.filter(u => typeof u === 'string' && u.trim().length > 0);

  if (validUrls.length === 0) {
    return undefined;
  }

  const baseLabels = validUrls.map((url, i) => getDocUrlLabel(url, i, validUrls.length));
  const labelCounts = new Map<string, number>();
  for (const label of baseLabels) {
    labelCounts.set(label, (labelCounts.get(label) ?? 0) + 1);
  }

  const labelIndex = new Map<string, number>();
  const links = validUrls.map((url, i) => {
    const base = baseLabels[i]!;
    const count = labelCounts.get(base) ?? 1;
    let label = base;
    if (count > 1) {
      const currentIdx = (labelIndex.get(base) ?? 0) + 1;
      labelIndex.set(base, currentIdx);
      label = `${base} ${currentIdx}`;
    }
    return `[${label}](${url.trim()})`;
  });

  return links.join(' • ');
}

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

  const linksMarkdown = formatDocLinks(suggestion.docUrl);
  if (linksMarkdown) {
    markdown.appendMarkdown(`\n\n${linksMarkdown}\n`);
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

  const linksMarkdown = formatDocLinks(hoverInfo.docUrls);
  if (linksMarkdown) {
    markdown.appendMarkdown(`${linksMarkdown}\n`);
  }

  return markdown;
}
