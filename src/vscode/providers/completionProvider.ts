import type { BloggerPathResolver } from '../../core/resolver/pathResolver.js';
import * as vscode from 'vscode';
import { createCompletionItems } from '../utils/completionAdapter.js';

export class BloggerCompletionProvider implements vscode.CompletionItemProvider {
  constructor(private readonly pathResolver: BloggerPathResolver) {}

  public provideCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position,
  ): vscode.ProviderResult<vscode.CompletionItem[]> {
    const lineText = document.lineAt(position).text;
    const linePrefix = lineText.slice(0, position.character);

    const result = this.pathResolver.resolveFromLinePrefix(linePrefix);

    if (!result || result.suggestions.length === 0) {
      return undefined;
    }

    const startChar = position.character - result.replacementLength;
    const range = new vscode.Range(position.line, startChar, position.line, position.character);

    return createCompletionItems(result.suggestions, range);
  }
}
