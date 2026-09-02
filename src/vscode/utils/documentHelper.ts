import type * as vscode from 'vscode';

export function getDocumentOffset(document: vscode.TextDocument, position: vscode.Position): number {
  return document.offsetAt(position);
}

export function getDocumentText(document: vscode.TextDocument): string {
  return document.getText();
}
