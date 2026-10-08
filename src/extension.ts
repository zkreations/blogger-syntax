import * as vscode from 'vscode';
import { TemplateLanguageService } from './core/service/templateLanguageService.js';
import { SUPPORTED_LANGUAGES, TRIGGER_CHARACTERS } from './vscode/constants.js';
import { registerCursorSuggestListener } from './vscode/listeners/cursorListener.js';
import { BloggerCodeActionProvider } from './vscode/providers/codeActionProvider.js';
import { BloggerCompletionProvider } from './vscode/providers/completionProvider.js';
import { BloggerDefinitionProvider } from './vscode/providers/definitionProvider.js';
import { BloggerDiagnosticProvider } from './vscode/providers/diagnosticProvider.js';
import { BloggerDocumentSymbolProvider } from './vscode/providers/documentSymbolProvider.js';
import { BloggerHoverProvider } from './vscode/providers/hoverProvider.js';
import { BloggerStatusBarItem } from './vscode/ui/statusBarItem.js';

export function activate(context: vscode.ExtensionContext): void {
  const languageService = new TemplateLanguageService();
  const completionProvider = new BloggerCompletionProvider(languageService);
  const hoverProvider = new BloggerHoverProvider(languageService);
  const diagnosticProvider = new BloggerDiagnosticProvider();
  const codeActionProvider = new BloggerCodeActionProvider(diagnosticProvider);
  const definitionProvider = new BloggerDefinitionProvider(languageService);
  const documentSymbolProvider = new BloggerDocumentSymbolProvider(languageService);
  const statusBarItem = new BloggerStatusBarItem();

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
    vscode.languages.registerDefinitionProvider(
      SUPPORTED_LANGUAGES,
      definitionProvider,
    ),
    vscode.languages.registerDocumentSymbolProvider(
      SUPPORTED_LANGUAGES,
      documentSymbolProvider,
    ),
    registerCursorSuggestListener(),
    diagnosticProvider,
    statusBarItem,
  );

  if (typeof vscode.workspace?.onDidCloseTextDocument === 'function') {
    context.subscriptions.push(
      vscode.workspace.onDidCloseTextDocument((doc) => {
        if (doc?.uri) {
          languageService.clearCache(doc.uri.toString());
        }
      }),
    );
  }
}
