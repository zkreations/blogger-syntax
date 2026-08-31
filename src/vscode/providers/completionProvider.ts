import type { BloggerPathResolver } from '../../core/resolver/pathResolver.js';
import * as vscode from 'vscode';
import { createCompletionItems } from '../utils/completionAdapter.js';

export class BloggerCompletionProvider implements vscode.CompletionItemProvider {
  constructor(private readonly pathResolver: BloggerPathResolver) {}

  public provideCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position,
  ): vscode.ProviderResult<vscode.CompletionItem[]> {
    const lineText = document.lineAt(position.line).text;
    const linePrefix = lineText.slice(0, position.character);

    let result = this.pathResolver.resolveFromLinePrefix(linePrefix);

    if (!result && position.line > 0 && /\b[\w:-]+\s*=\s*["'][^"']*$/.test(linePrefix)) {
      const startLine = Math.max(0, position.line - 15);
      const precedingLines: string[] = [];
      for (let l = startLine; l < position.line; l++) {
        precedingLines.push(document.lineAt(l).text);
      }
      precedingLines.push(linePrefix);
      const multiLineText = precedingLines.join('\n');
      result = this.pathResolver.resolveFromLinePrefix(multiLineText);
    }

    if (!result || result.suggestions.length === 0) {
      return undefined;
    }

    const startChar = position.character - result.replacementLength;
    const range = new vscode.Range(position.line, startChar, position.line, position.character);

    return createCompletionItems(result.suggestions, range);
  }
}
