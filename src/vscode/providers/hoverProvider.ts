import type { BloggerPathResolver } from '../../core/resolver/pathResolver.js';
import * as vscode from 'vscode';
import { buildHoverDocumentation } from '../utils/docBuilder.js';

export class BloggerHoverProvider implements vscode.HoverProvider {
  constructor(private readonly pathResolver: BloggerPathResolver) {}

  public provideHover(
    document: vscode.TextDocument,
    position: vscode.Position,
  ): vscode.ProviderResult<vscode.Hover> {
    const lineText = document.lineAt(position.line).text;

    let precedingContext: string | undefined;
    if (position.line > 0) {
      const startLine = Math.max(0, position.line - 15);
      const lines: string[] = [];
      for (let l = startLine; l < position.line; l++) {
        lines.push(document.lineAt(l).text);
      }
      precedingContext = lines.join('\n');
    }

    const result = this.pathResolver.resolveHoverAtPosition(
      lineText,
      position.character,
      precedingContext,
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
