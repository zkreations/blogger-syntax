import type * as vscode from 'vscode';

export function getDocumentOffset(document: vscode.TextDocument, position: vscode.Position): number {
  if (typeof document.offsetAt === 'function') {
    return document.offsetAt(position);
  }

  let offset = 0;
  for (let l = 0; l < position.line; l++) {
    offset += (document.lineAt(l).text.length + 1);
  }
  return offset + position.character;
}

export function getDocumentText(document: vscode.TextDocument): string {
  if (typeof document.getText === 'function') {
    return document.getText();
  }

  const lines: string[] = [];
  const lineCount = (document as unknown as { lineCount?: number }).lineCount;
  if (typeof lineCount === 'number') {
    for (let i = 0; i < lineCount; i++) {
      lines.push(document.lineAt(i).text);
    }
    return lines.join('\n');
  }

  return document.lineAt(0).text;
}
