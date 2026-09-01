import * as vscode from 'vscode';
import { CURSOR_SUGGEST_DEBOUNCE_MS, SUPPORTED_LANGUAGES } from '../constants.js';

/**
 * Determines whether the cursor is positioned directly between empty quotes of a specific attribute
 * (e.g. `description=""`, `type=""`, etc.).
 */
export function isCursorInsideEmptyAttribute(
  lineText: string,
  character: number,
  attributeNames: readonly string[] = ['description', 'type'],
): boolean {
  if (character < 0 || character > lineText.length) {
    return false;
  }

  const prefix = lineText.slice(0, character);
  const suffix = lineText.slice(character);

  const attrPattern = attributeNames.join('|');
  const regex = new RegExp(`\\b(?:${attrPattern})\\s*=\\s*(["'])$`);
  const match = regex.exec(prefix);
  if (!match || !match[1]) {
    return false;
  }

  const quote = match[1];
  return suffix.startsWith(quote);
}

/**
 * Registers an editor selection change listener that triggers code completion
 * when the cursor is positioned inside empty attributes like `description=""` or `type=""` in supported documents.
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

      const isEnabled = vscode.workspace.getConfiguration('bloggerSyntax').get<boolean>('autoTriggerInEmptyAttributes', true);
      if (!isEnabled) {
        return;
      }

      const position = activeEditor.selection.active;
      if (position.line >= activeEditor.document.lineCount) {
        return;
      }

      const lineText = activeEditor.document.lineAt(position.line).text;

      if (isCursorInsideEmptyAttribute(lineText, position.character)) {
        void vscode.commands.executeCommand('editor.action.triggerSuggest').then(undefined, () => {});
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
