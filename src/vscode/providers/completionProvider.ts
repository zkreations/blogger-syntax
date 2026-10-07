import type { BloggerProperty } from '../../core/models/types.js';
import type { BloggerPathResolver } from '../../core/resolver/pathResolver.js';
import * as vscode from 'vscode';
import { getNearestUnclosedTag } from '../../core/parser/tagTreeTracker.js';
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
  ): vscode.ProviderResult<vscode.CompletionItem[] | vscode.CompletionList> {
    const lineText = document.lineAt(position.line).text;
    const linePrefix = lineText.slice(0, position.character);

    const docKey = document.uri ? document.uri.toString() : 'untitled';
    const version = document.version ?? 0;
    const fullText = getDocumentText(document);
    const offset = getDocumentOffset(document, position);

    const getLocalVariables = (): Record<string, BloggerProperty> => {
      return this.scopeTracker.getActiveVariables(docKey, version, fullText, offset);
    };

    const widgetType = this.scopeTracker.getEnclosingWidgetType(docKey, version, fullText, offset);
    const includables = this.scopeTracker.getAvailableIncludables(docKey, version, fullText, offset);
    const enclosingMessageName = this.scopeTracker.getEnclosingMessageName(fullText, offset);
    const nearestOpenTag = getNearestUnclosedTag(fullText, offset);

    const resolverContext = {
      localVariables: getLocalVariables,
      widgetType,
      includables,
      enclosingMessageName,
      nearestOpenTag,
    };

    let result = this.pathResolver.resolveFromLinePrefix(linePrefix, resolverContext);

    if (!result && position.line > 0) {
      const startLine = Math.max(0, position.line - 15);
      const precedingLines: string[] = [];
      for (let l = startLine; l < position.line; l++) {
        precedingLines.push(document.lineAt(l).text);
      }
      precedingLines.push(linePrefix);
      const multiLineText = precedingLines.join('\n');
      result = this.pathResolver.resolveFromLinePrefix(multiLineText, resolverContext);
    }

    if (!result || result.suggestions.length === 0) {
      return undefined;
    }

    const startChar = Math.max(0, position.character - result.replacementLength);
    let endChar = position.character;

    const lineSuffix = lineText.slice(position.character);
    const isTagSnippet = result.suggestions.some(s => s.kind === 'snippet' && s.insertText?.includes('/>'));
    if (isTagSnippet) {
      const match = /^(:?\s*\/?>)/.exec(lineSuffix);
      if (match && match[1]) {
        endChar += match[1].length;
      }
    }

    const range = new vscode.Range(position.line, startChar, position.line, endChar);

    const items = createCompletionItems(result.suggestions, range);
    return new vscode.CompletionList(items, true);
  }
}
