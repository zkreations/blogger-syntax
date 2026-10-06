import * as vscode from 'vscode';
import { BloggerPathResolver } from './core/resolver/pathResolver.js';
import { BloggerScopeTracker } from './core/scope/scopeTracker.js';
import { SUPPORTED_LANGUAGES, TRIGGER_CHARACTERS } from './vscode/constants.js';
import { registerCursorSuggestListener } from './vscode/listeners/cursorListener.js';
import { BloggerCodeActionProvider } from './vscode/providers/codeActionProvider.js';
import { BloggerCompletionProvider } from './vscode/providers/completionProvider.js';
import { BloggerDiagnosticProvider } from './vscode/providers/diagnosticProvider.js';
import { BloggerHoverProvider } from './vscode/providers/hoverProvider.js';

export function activate(context: vscode.ExtensionContext): void {
  const pathResolver = new BloggerPathResolver();
  const scopeTracker = new BloggerScopeTracker();
  const completionProvider = new BloggerCompletionProvider(pathResolver, scopeTracker);
  const hoverProvider = new BloggerHoverProvider(pathResolver, scopeTracker);
  const diagnosticProvider = new BloggerDiagnosticProvider();
  const codeActionProvider = new BloggerCodeActionProvider(diagnosticProvider);

  context.subscriptions.push(
    vscode.languages.registerCompletionItemProvider(
      SUPPORTED_LANGUAGES,
      completionProvider,
      ...TRIGGER_CHARACTERS,
    ),
    vscode.languages.registerHoverProvider(
      SUPPORTED_LANGUAGES,
      hoverProvider,
    ),
    vscode.languages.registerCodeActionsProvider(
      SUPPORTED_LANGUAGES,
      codeActionProvider,
      { providedCodeActionKinds: [vscode.CodeActionKind.QuickFix] },
    ),
    registerCursorSuggestListener(),
    diagnosticProvider,
  );

  if (typeof vscode.workspace?.onDidCloseTextDocument === 'function') {
    context.subscriptions.push(
      vscode.workspace.onDidCloseTextDocument((doc) => {
        if (doc?.uri) {
          scopeTracker.clearCache(doc.uri.toString());
        }
      }),
    );
  }
}
