import type { BloggerPathResolver } from '../../core/resolver/pathResolver.js';
import * as vscode from 'vscode';
import { BloggerScopeTracker } from '../../core/scope/scopeTracker.js';
import { createCompletionItems } from '../utils/completionAdapter.js';
import { getDocumentOffset, getDocumentText } from '../utils/documentHelper.js';

export class BloggerCompletionProvider implements vscode.CompletionItemProvider {
  constructor(
    private readonly pathResolver: BloggerPathResolver,
    private readonly scopeTracker: BloggerScopeTracker = new BloggerScopeTracker(),
  ) {}

  public provideCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position,
  ): vscode.ProviderResult<vscode.CompletionItem[]> {
    const lineText = document.lineAt(position.line).text;
    const linePrefix = lineText.slice(0, position.character);

    const docKey = document.uri ? document.uri.toString() : 'untitled';
    const version = document.version ?? 0;
    const fullText = getDocumentText(document);
    const offset = getDocumentOffset(document, position);
    const localVariables = this.scopeTracker.getActiveVariables(docKey, version, fullText, offset);

    let result = this.pathResolver.resolveFromLinePrefix(linePrefix, { localVariables });

    if (!result && position.line > 0 && /\b[\w:-]+\s*=\s*["'][^"']*$/.test(linePrefix)) {
      const startLine = Math.max(0, position.line - 15);
      const precedingLines: string[] = [];
      for (let l = startLine; l < position.line; l++) {
        precedingLines.push(document.lineAt(l).text);
      }
      precedingLines.push(linePrefix);
      const multiLineText = precedingLines.join('\n');
      result = this.pathResolver.resolveFromLinePrefix(multiLineText, { localVariables });
    }

    if (!result || result.suggestions.length === 0) {
      return undefined;
    }

    const startChar = Math.max(0, position.character - result.replacementLength);
    const range = new vscode.Range(position.line, startChar, position.line, position.character);

    return createCompletionItems(result.suggestions, range);
  }
}
