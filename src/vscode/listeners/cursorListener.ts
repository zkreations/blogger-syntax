import * as vscode from 'vscode';
import { CURSOR_SUGGEST_DEBOUNCE_MS, SUPPORTED_LANGUAGES } from '../constants.js';

/**
 * Determines whether the cursor is positioned directly between empty quotes of a description attribute
 * (e.g. `description=""` or `description=''`).
 */
export function isCursorInsideEmptyDescription(lineText: string, character: number): boolean {
  if (character < 0 || character > lineText.length) {
    return false;
  }

  const prefix = lineText.slice(0, character);
  const suffix = lineText.slice(character);

  const match = /\bdescription\s*=\s*(["'])$/.exec(prefix);
  if (!match || !match[1]) {
    return false;
  }

  const quote = match[1];
  return suffix.startsWith(quote);
}

/**
 * Registers an editor selection change listener that automatically triggers code completion
 * when the cursor is positioned inside an empty `description=""` attribute in supported documents.
 */
export function registerCursorSuggestListener(
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

  return new vscode.Disposable(() => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    disposable.dispose();
  });
}
