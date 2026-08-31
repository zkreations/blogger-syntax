import type { BloggerPathResolver } from '../../core/resolver/pathResolver.js';
import * as vscode from 'vscode';
import { buildHoverDocumentation } from '../utils/docBuilder.js';

export class BloggerHoverProvider implements vscode.HoverProvider {
  constructor(private readonly pathResolver: BloggerPathResolver) {}

  public provideHover(
    document: vscode.TextDocument,
    position: vscode.Position,
  ): vscode.ProviderResult<vscode.Hover> {
    const lineText = document.lineAt(position).text;
    const result = this.pathResolver.resolveHoverAtPosition(lineText, position.character);

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
