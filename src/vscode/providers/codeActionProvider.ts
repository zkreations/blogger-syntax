import type { BloggerDiagnosticProvider } from './diagnosticProvider.js';
import * as vscode from 'vscode';

export class BloggerCodeActionProvider implements vscode.CodeActionProvider {
  constructor(private readonly diagnosticProvider: BloggerDiagnosticProvider) {}

  public provideCodeActions(
    document: vscode.TextDocument,
    range: vscode.Range | vscode.Selection,
    context: vscode.CodeActionContext,
  ): vscode.CodeAction[] {
    const actions: vscode.CodeAction[] = [];
    const uriStr = document.uri.toString();
    const diags = this.diagnosticProvider.getDiagnostics(uriStr);

    for (const diag of diags) {
      if (!diag.quickFixes || diag.quickFixes.length === 0) {
        continue;
      }

      const diagRange = new vscode.Range(
        diag.range.start.line,
        diag.range.start.character,
        diag.range.end.line,
        diag.range.end.character,
      );

      const hasMatchingVsDiag = context.diagnostics?.some(
        d => d.code === diag.code && Boolean(d.range.intersection(diagRange)),
      );
      const rangeIntersects = Boolean(range.intersection(diagRange));

      if (hasMatchingVsDiag || rangeIntersects) {
        for (const fix of diag.quickFixes) {
          const action = new vscode.CodeAction(fix.title, vscode.CodeActionKind.QuickFix);
          const edit = new vscode.WorkspaceEdit();
          const fixRange = new vscode.Range(
            fix.range.start.line,
            fix.range.start.character,
            fix.range.end.line,
            fix.range.end.character,
          );
          edit.replace(document.uri, fixRange, fix.newText);
          action.edit = edit;
          if (fix.isPreferred) {
            action.isPreferred = true;
          }
          actions.push(action);
        }
      }
    }

    return actions;
  }
}
