import type { BloggerDiagnostic } from '../../core/linter/linterTypes.js';
import * as vscode from 'vscode';
import { lintBloggerDocument } from '../../core/linter/linterEngine.js';
import { SUPPORTED_LANGUAGES } from '../constants.js';
import { getDocumentText } from '../utils/documentHelper.js';

function toVsCodeDiagnostic(diag: BloggerDiagnostic): vscode.Diagnostic {
  const range = new vscode.Range(
    diag.range.start.line,
    diag.range.start.character,
    diag.range.end.line,
    diag.range.end.character,
  );

  let severity = vscode.DiagnosticSeverity.Warning;
  if (diag.severity === 'error') {
    severity = vscode.DiagnosticSeverity.Error;
  }
  else if (diag.severity === 'info') {
    severity = vscode.DiagnosticSeverity.Information;
  }
  else if (diag.severity === 'hint') {
    severity = vscode.DiagnosticSeverity.Hint;
  }

  const vsDiag = new vscode.Diagnostic(range, diag.message, severity);
  vsDiag.code = diag.code;
  vsDiag.source = 'blogger-syntax';

  if (diag.tags?.includes('deprecated')) {
    vsDiag.tags = [vscode.DiagnosticTag.Deprecated];
  }
  else if (diag.tags?.includes('unnecessary')) {
    vsDiag.tags = [vscode.DiagnosticTag.Unnecessary];
  }

  return vsDiag;
}

export class BloggerDiagnosticProvider implements vscode.Disposable {
  private readonly diagnosticCollection = vscode.languages.createDiagnosticCollection('blogger');
  private readonly debounceTimers = new Map<string, ReturnType<typeof setTimeout>>();
  private readonly documentDiagnostics = new Map<string, readonly BloggerDiagnostic[]>();
  private readonly disposables: vscode.Disposable[] = [];

  constructor() {
    this.disposables.push(
      this.diagnosticCollection,
      vscode.workspace.onDidOpenTextDocument(doc => this.validateDocument(doc, true)),
      vscode.workspace.onDidSaveTextDocument(doc => this.validateDocument(doc, true)),
      vscode.workspace.onDidChangeTextDocument(event => this.handleDocumentChange(event)),
      vscode.workspace.onDidCloseTextDocument(doc => this.clearDocument(doc)),
      vscode.workspace.onDidChangeConfiguration(e => this.handleConfigurationChange(e)),
    );

    if (vscode.workspace.textDocuments) {
      for (const doc of vscode.workspace.textDocuments) {
        this.validateDocument(doc, true);
      }
    }
  }

  public getDiagnostics(uri: string): readonly BloggerDiagnostic[] {
    return this.documentDiagnostics.get(uri) ?? [];
  }

  public validateDocument(document: vscode.TextDocument, immediate: boolean = false): void {
    if (!this.isSupportedDocument(document)) {
      return;
    }

    const config = vscode.workspace.getConfiguration('bloggerSyntax.linter');
    const enabled = config.get<boolean>('enabled', true);

    if (!enabled) {
      this.clearDocument(document);
      return;
    }

    const uriStr = document.uri.toString();
    const existingTimer = this.debounceTimers.get(uriStr);
    if (existingTimer) {
      clearTimeout(existingTimer);
      this.debounceTimers.delete(uriStr);
    }

    const runValidation = () => {
      const text = getDocumentText(document);
      const diagnostics = lintBloggerDocument(text);
      this.documentDiagnostics.set(uriStr, diagnostics);
      this.diagnosticCollection.set(document.uri, diagnostics.map(toVsCodeDiagnostic));
    };

    if (immediate) {
      runValidation();
    }
    else {
      const debounceMs = config.get<number>('debounceMs', 400);
      const timer = setTimeout(() => {
        this.debounceTimers.delete(uriStr);
        runValidation();
      }, debounceMs);
      this.debounceTimers.set(uriStr, timer);
    }
  }

  private handleDocumentChange(event: vscode.TextDocumentChangeEvent): void {
    const document = event.document;
    if (!this.isSupportedDocument(document)) {
      return;
    }

    const config = vscode.workspace.getConfiguration('bloggerSyntax.linter');
    const enabled = config.get<boolean>('enabled', true);
    if (!enabled) {
      this.clearDocument(document);
      return;
    }

    const trigger = config.get<'onType' | 'onSave'>('trigger', 'onType');
    if (trigger === 'onType') {
      this.validateDocument(document, false);
    }
  }

  private clearDocument(document: vscode.TextDocument): void {
    const uriStr = document.uri.toString();
    const timer = this.debounceTimers.get(uriStr);
    if (timer) {
      clearTimeout(timer);
      this.debounceTimers.delete(uriStr);
    }
    this.documentDiagnostics.delete(uriStr);
    this.diagnosticCollection.delete(document.uri);
  }

  private handleConfigurationChange(e: vscode.ConfigurationChangeEvent): void {
    if (e.affectsConfiguration('bloggerSyntax.linter')) {
      const config = vscode.workspace.getConfiguration('bloggerSyntax.linter');
      const enabled = config.get<boolean>('enabled', true);

      if (!enabled) {
        this.diagnosticCollection.clear();
        this.documentDiagnostics.clear();
      }
      else if (vscode.workspace.textDocuments) {
        for (const doc of vscode.workspace.textDocuments) {
          this.validateDocument(doc, true);
        }
      }
    }
  }

  private isSupportedDocument(document: vscode.TextDocument): boolean {
    return SUPPORTED_LANGUAGES.includes(document.languageId as (typeof SUPPORTED_LANGUAGES)[number]);
  }

  public dispose(): void {
    for (const timer of this.debounceTimers.values()) {
      clearTimeout(timer);
    }
    this.debounceTimers.clear();
    this.documentDiagnostics.clear();
    for (const d of this.disposables) {
      d.dispose();
    }
  }
}
