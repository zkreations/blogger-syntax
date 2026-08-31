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
    registerCursorSuggestListener(),
  );
}
