import * as vscode from 'vscode';
import { TemplateLanguageService } from '../../core/service/templateLanguageService.js';
import { SUPPORTED_LANGUAGES } from '../constants.js';

export class BloggerStatusBarItem implements vscode.Disposable {
  private readonly statusBarItem: vscode.StatusBarItem;
  private readonly disposables: vscode.Disposable[] = [];
  private debounceTimer: ReturnType<typeof setTimeout> | undefined;

  constructor(private readonly service: TemplateLanguageService = new TemplateLanguageService()) {
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
    const result = this.service.getTemplateVersion(text);

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
    const summary = this.service.getTemplateSummary(text);

    const info = `Blogger Template Details:\n`
      + `• Version: ${summary.version.summary}\n`
      + `• Sections: ${summary.sectionCount}\n`
      + `• Widgets: ${summary.widgetCount}\n`
      + `• Includables: ${summary.includableCount}\n`
      + `• Features: ${summary.version.detectedFeatures.join(', ')}`;

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
