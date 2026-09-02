import * as vscode from 'vscode';
import { CURSOR_SUGGEST_DEBOUNCE_MS, SUPPORTED_LANGUAGES } from '../constants.js';

const DEFAULT_EMPTY_ATTR_REGEX = /\b(?:description|type)\s*=\s*(["'])$/;

export function isCursorInsideEmptyAttribute(
  lineText: string,
  character: number,
  attributeNames?: readonly string[],
): boolean {
  if (character < 0 || character > lineText.length) {
    return false;
  }

  const prefix = lineText.slice(0, character);
  const suffix = lineText.slice(character);

  const regex = attributeNames
    ? new RegExp(`\\b(?:${attributeNames.join('|')})\\s*=\\s*(["'])$`)
    : DEFAULT_EMPTY_ATTR_REGEX;

  const match = regex.exec(prefix);
  if (!match || !match[1]) {
    return false;
  }

  const quote = match[1];
  return suffix.startsWith(quote);
}

export function isBloggerAttributeContext(
  document: vscode.TextDocument,
  position: vscode.Position,
): boolean {
  const lineText = document.lineAt(position.line).text;
  const prefix = lineText.slice(0, position.character);
  const match = /\b([\w:-]+)\s*=\s*["']$/.exec(prefix);
  if (!match || !match[1]) {
    return false;
  }
  const attrName = match[1];
  const beforeAttr = prefix.slice(0, match.index);
  let tagMatch = /<([\w:-]+)(?:\s[^>]*)?$/.exec(beforeAttr);

  if (!tagMatch && position.line > 0) {
    const startLine = Math.max(0, position.line - 15);
    const preceding: string[] = [];
    for (let l = startLine; l < position.line; l++) {
      preceding.push(document.lineAt(l).text);
    }
    preceding.push(beforeAttr);
    tagMatch = /<([\w:-]+)(?:\s[^>]*)?$/.exec(preceding.join('\n'));
  }

  const tagName = tagMatch?.[1];
  if (!tagName) {
    return false;
  }

  if (attrName === 'description') {
    return tagName === 'Variable' || tagName === 'Group';
  }
  if (attrName === 'type') {
    return tagName === 'b:widget' || tagName === 'b:defaultmarkup';
  }

  return false;
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

      if (isCursorInsideEmptyAttribute(lineText, position.character) && isBloggerAttributeContext(activeEditor.document, position)) {
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
