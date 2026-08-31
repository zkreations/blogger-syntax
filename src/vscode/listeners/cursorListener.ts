import * as vscode from 'vscode';
import { CURSOR_SUGGEST_DEBOUNCE_MS, SUPPORTED_LANGUAGES } from '../constants.js';
import { isCursorInsideEmptyDescription } from '../utils/cursorDetector.js';

/**
 * Registers an editor selection change listener that automatically triggers code completion
 * when the cursor is positioned inside an empty `description=""` attribute in supported documents.
 */
export function registerCursorSuggestListener(
  context: vscode.ExtensionContext,
  debounceMs: number = CURSOR_SUGGEST_DEBOUNCE_MS,
): vscode.Disposable {
  let debounceTimer: ReturnType<typeof setTimeout> | undefined;

  const disposable = vscode.window.onDidChangeTextEditorSelection((event) => {
    const editor = event.textEditor;

    if (!SUPPORTED_LANGUAGES.includes(editor.document.languageId as (typeof SUPPORTED_LANGUAGES)[number])) {
      return;
    }

    const firstSelection = event.selections[0];
    if (event.selections.length !== 1 || !firstSelection || !firstSelection.isEmpty) {
      return;
    }

    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    debounceTimer = setTimeout(() => {
      const activeEditor = vscode.window.activeTextEditor;
      if (!activeEditor || activeEditor.document !== editor.document) {
        return;
      }

      const position = activeEditor.selection.active;
      const lineText = activeEditor.document.lineAt(position.line).text;

      if (isCursorInsideEmptyDescription(lineText, position.character)) {
        vscode.commands.executeCommand('editor.action.triggerSuggest');
      }
    }, debounceMs);
  });

  const cleanupDisposable = new vscode.Disposable(() => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    disposable.dispose();
  });

  context.subscriptions.push(cleanupDisposable);
  return cleanupDisposable;
}
