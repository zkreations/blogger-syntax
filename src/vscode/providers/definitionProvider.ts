import * as vscode from 'vscode';
import { findIncludableDefinition } from '../../core/navigation/definitionResolver.js';

export class BloggerDefinitionProvider implements vscode.DefinitionProvider {
  public provideDefinition(
    document: vscode.TextDocument,
    position: vscode.Position,
  ): vscode.ProviderResult<vscode.Definition | vscode.LocationLink[]> {
    const text = document.getText();
    const offset = document.offsetAt(position);

    const match = findIncludableDefinition(text, offset);
    if (!match) {
      return undefined;
    }

    const originSelectionRange = new vscode.Range(
      document.positionAt(match.originSpan.start),
      document.positionAt(match.originSpan.end),
    );

    const targetRange = new vscode.Range(
      document.positionAt(match.targetSpan.start),
      document.positionAt(match.targetSpan.end),
    );

    const targetSelectionRange = new vscode.Range(
      document.positionAt(match.targetSelectionSpan.start),
      document.positionAt(match.targetSelectionSpan.end),
    );

    return [
      {
        originSelectionRange,
        targetUri: document.uri,
        targetRange,
        targetSelectionRange,
      },
    ];
  }
}
