import type { BloggerPathResolver } from '../../core/resolver/pathResolver.js';
import * as vscode from 'vscode';
import { BloggerScopeTracker } from '../../core/scope/scopeTracker.js';
import { buildHoverDocumentation } from '../utils/docBuilder.js';
import { getDocumentOffset, getDocumentText } from '../utils/documentHelper.js';

export class BloggerHoverProvider implements vscode.HoverProvider {
  constructor(
    private readonly pathResolver: BloggerPathResolver,
    private readonly scopeTracker: BloggerScopeTracker = new BloggerScopeTracker(),
  ) {}

  public provideHover(
    document: vscode.TextDocument,
    position: vscode.Position,
  ): vscode.ProviderResult<vscode.Hover> {
    const lineText = document.lineAt(position.line).text;

    const docKey = document.uri ? document.uri.toString() : 'untitled';
    const version = document.version ?? 0;
    const fullText = getDocumentText(document);
    const offset = getDocumentOffset(document, position);
    const localVariables = this.scopeTracker.getActiveVariables(docKey, version, fullText, offset);

    const getPrecedingContext = (): string | undefined => {
      if (position.line === 0) {
        return undefined;
      }
      const startLine = Math.max(0, position.line - 15);
      const lines: string[] = [];
      for (let l = startLine; l < position.line; l++) {
        lines.push(document.lineAt(l).text);
      }
      return lines.join('\n');
    };

    const result = this.pathResolver.resolveHoverAtPosition(
      lineText,
      position.character,
      getPrecedingContext,
      { localVariables },
    );

    if (!result) {
      return undefined;
    }

    const range = new vscode.Range(
      position.line,
      result.range.start,
      position.line,
      result.range.end,
    );

    const docMarkdown = buildHoverDocumentation(result.hover);
    return new vscode.Hover(docMarkdown, range);
  }
}
