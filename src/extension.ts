import * as vscode from 'vscode';
import { BloggerPathResolver } from './core/resolver/pathResolver.js';
import { SUPPORTED_LANGUAGES, TRIGGER_CHARACTERS } from './vscode/constants.js';
import { BloggerCompletionProvider } from './vscode/providers/completionProvider.js';

export function activate(context: vscode.ExtensionContext): void {
  const pathResolver = new BloggerPathResolver();
  const completionProvider = new BloggerCompletionProvider(pathResolver);

  for (const language of SUPPORTED_LANGUAGES) {
    const disposable = vscode.languages.registerCompletionItemProvider(
      language,
      completionProvider,
      ...TRIGGER_CHARACTERS,
    );

    context.subscriptions.push(disposable);
  }
}

export function deactivate(): void {
  // Cleanup hook
}
