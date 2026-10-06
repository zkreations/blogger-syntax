import { describe, expect, it, vi } from 'vitest';
import * as vscode from 'vscode';
import { BloggerCodeActionProvider } from '../../src/vscode/providers/codeActionProvider.js';
import { BloggerDiagnosticProvider } from '../../src/vscode/providers/diagnosticProvider.js';
import { MockTextDocument, Range } from './__mocks__/vscode.js';

describe('linter VS Code Integration', () => {
  describe('bloggerDiagnosticProvider', () => {
    it('validates supported document immediately and populates diagnostics', () => {
      const provider = new BloggerDiagnosticProvider();
      const doc = new MockTextDocument(
        `<b:section id='main' growth='false'><b:for values='1 to 5'/></b:section>`,
        'file:///test.xml',
        1,
        'xml',
      ) as unknown as vscode.TextDocument;

      provider.validateDocument(doc, true);

      const diags = provider.getDiagnostics('file:///test.xml');
      expect(diags.length).toBeGreaterThanOrEqual(2);
      expect(diags.some(d => d.code === 'blogger.deprecated.section-attribute')).toBe(true);
      expect(diags.some(d => d.code === 'blogger.hallucination.tag')).toBe(true);

      provider.dispose();
    });

    it('ignores unsupported languages', () => {
      const provider = new BloggerDiagnosticProvider();
      const doc = new MockTextDocument(
        `<b:for values='1 to 5'/>`,
        'file:///test.ts',
        1,
        'typescript',
      ) as unknown as vscode.TextDocument;

      provider.validateDocument(doc, true);

      const diags = provider.getDiagnostics('file:///test.ts');
      expect(diags).toEqual([]);

      provider.dispose();
    });

    it('clears diagnostics when linter is disabled via configuration', () => {
      const getConfigurationSpy = vi.spyOn(vscode.workspace, 'getConfiguration').mockReturnValue({
        get: <T>(key: string, defaultValue: T): T => {
          if (key === 'enabled') {
            return false as unknown as T;
          }
          return defaultValue;
        },
      } as unknown as vscode.WorkspaceConfiguration);

      const provider = new BloggerDiagnosticProvider();
      const doc = new MockTextDocument(
        `<b:for values='1 to 5'/>`,
        'file:///test.xml',
        1,
        'xml',
      ) as unknown as vscode.TextDocument;

      provider.validateDocument(doc, true);

      const diags = provider.getDiagnostics('file:///test.xml');
      expect(diags).toEqual([]);

      getConfigurationSpy.mockRestore();
      provider.dispose();
    });

    it('debounces validation when immediate is false', async () => {
      vi.useFakeTimers();

      const provider = new BloggerDiagnosticProvider();
      const doc = new MockTextDocument(
        `<b:for values='1 to 5'/>`,
        'file:///test-debounce.xml',
        1,
        'xml',
      ) as unknown as vscode.TextDocument;

      provider.validateDocument(doc, false);

      // Immediately before debounce timer elapses
      expect(provider.getDiagnostics('file:///test-debounce.xml')).toEqual([]);

      // Advance debounce timer (default 400ms)
      vi.advanceTimersByTime(450);

      expect(provider.getDiagnostics('file:///test-debounce.xml').length).toBeGreaterThan(0);

      provider.dispose();
      vi.useRealTimers();
    });
  });

  describe('bloggerCodeActionProvider', () => {
    it('provides QuickFix CodeActions with WorkspaceEdit for intersecting diagnostic range', () => {
      const diagnosticProvider = new BloggerDiagnosticProvider();
      const codeActionProvider = new BloggerCodeActionProvider(diagnosticProvider);

      const doc = new MockTextDocument(
        `<b:section id='main' growth='false'></b:section>`,
        'file:///test-fix.xml',
        1,
        'xml',
      ) as unknown as vscode.TextDocument;

      diagnosticProvider.validateDocument(doc, true);

      const cursorRange = new Range(0, 22, 0, 28) as unknown as vscode.Range;
      const context = {
        diagnostics: [],
        only: undefined,
        triggerKind: 1,
      } as unknown as vscode.CodeActionContext;

      const actions = codeActionProvider.provideCodeActions(doc, cursorRange, context);

      expect(actions.length).toBeGreaterThan(0);
      const action = actions[0]!;
      expect(action.title).toBe('Remove obsolete attribute "growth"');
      expect(action.isPreferred).toBe(true);
      expect(action.edit).toBeDefined();

      const edits = (action.edit as any).entries.get('file:///test-fix.xml');
      expect(edits).toBeDefined();
      expect(edits[0].newText).toBe('');

      diagnosticProvider.dispose();
    });
  });
});
