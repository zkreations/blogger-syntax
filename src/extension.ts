import * as vscode from 'vscode';
import { BloggerPathResolver } from './core/resolver/pathResolver.js';
import { SUPPORTED_LANGUAGES, TRIGGER_CHARACTERS } from './vscode/constants.js';
import { registerCursorSuggestListener } from './vscode/listeners/cursorListener.js';
import { BloggerCompletionProvider } from './vscode/providers/completionProvider.js';
import { BloggerHoverProvider } from './vscode/providers/hoverProvider.js';

export function activate(context: vscode.ExtensionContext): void {
  const pathResolver = new BloggerPathResolver();
  const completionProvider = new BloggerCompletionProvider(pathResolver);
  const hoverProvider = new BloggerHoverProvider(pathResolver);

  for (const language of SUPPORTED_LANGUAGES) {
    const completionDisposable = vscode.languages.registerCompletionItemProvider(
      language,
      completionProvider,
      ...TRIGGER_CHARACTERS,
    );

    const hoverDisposable = vscode.languages.registerHoverProvider(
      language,
      hoverProvider,
    );

    context.subscriptions.push(completionDisposable, hoverDisposable);
  }

  registerCursorSuggestListener(context);
}

export function deactivate(): void {
  // Cleanup hook
}
