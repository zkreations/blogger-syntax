import * as vscode from 'vscode';
import { indexDocumentSymbols } from '../../core/navigation/symbolIndexer.js';
import { detectTemplateVersion } from '../../core/version/templateVersion.js';
import { SUPPORTED_LANGUAGES } from '../constants.js';

export class BloggerStatusBarItem implements vscode.Disposable {
  private readonly statusBarItem: vscode.StatusBarItem;
  private readonly disposables: vscode.Disposable[] = [];
  private debounceTimer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    this.statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right,
      100,
    );
    this.statusBarItem.command = 'bloggerSyntax.showTemplateInfo';

    this.disposables.push(
      this.statusBarItem,
      vscode.window.onDidChangeActiveTextEditor(() => this.update()),
      vscode.workspace.onDidChangeTextDocument((e) => {
        if (vscode.window.activeTextEditor?.document === e.document) {
          this.triggerDebouncedUpdate();
        }
      }),
      vscode.commands.registerCommand('bloggerSyntax.showTemplateInfo', () => {
        this.showTemplateDetails();
      }),
    );

    this.update();
  }

  private triggerDebouncedUpdate(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    this.debounceTimer = setTimeout(() => {
      this.debounceTimer = undefined;
      this.update();
    }, 300);
  }

  public update(): void {
    const editor = vscode.window.activeTextEditor;
    if (!editor || !SUPPORTED_LANGUAGES.includes(editor.document.languageId as any)) {
      this.statusBarItem.hide();
      return;
    }

    const text = editor.document.getText();
    const result = detectTemplateVersion(text);

    this.statusBarItem.text = `$(symbol-structure) Blogger v${result.version}`;
    this.statusBarItem.tooltip = `${result.summary}\nClick to view template structure & version details.`;
    this.statusBarItem.show();
  }

  private showTemplateDetails(): void {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      return;
    }

    const text = editor.document.getText();
    const versionResult = detectTemplateVersion(text);
    const symbols = indexDocumentSymbols(text);

    let sectionCount = 0;
    let widgetCount = 0;
    let includableCount = 0;

    for (const sym of symbols) {
      if (sym.kind === 'section') {
        sectionCount++;
        for (const child of sym.children) {
          if (child.kind === 'widget') {
            widgetCount++;
            for (const sub of child.children) {
              if (sub.kind === 'includable') {
                includableCount++;
              }
            }
          }
        }
      }
    }

    const info = `Blogger Template Details:\n`
      + `• Version: ${versionResult.summary}\n`
      + `• Sections: ${sectionCount}\n`
      + `• Widgets: ${widgetCount}\n`
      + `• Includables: ${includableCount}\n`
      + `• Features: ${versionResult.detectedFeatures.join(', ')}`;

    void vscode.window.showInformationMessage(info);
  }

  public dispose(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = undefined;
    }
    for (const d of this.disposables) {
      d.dispose();
    }
    this.disposables.length = 0;
  }
}
