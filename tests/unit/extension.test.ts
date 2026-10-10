import { describe, expect, it, vi } from 'vitest';
import * as vscode from 'vscode';
import { activate } from '../../src/extension.js';
import { SUPPORTED_LANGUAGES, TRIGGER_CHARACTERS } from '../../src/vscode/constants.js';
import { BloggerCodeActionProvider } from '../../src/vscode/providers/codeActionProvider.js';
import { BloggerCompletionProvider } from '../../src/vscode/providers/completionProvider.js';
import { BloggerDefinitionProvider } from '../../src/vscode/providers/definitionProvider.js';
import { BloggerDocumentSymbolProvider } from '../../src/vscode/providers/documentSymbolProvider.js';
import { BloggerHoverProvider } from '../../src/vscode/providers/hoverProvider.js';

describe('extension lifecycle', () => {
  it('should activate and register providers with proper arguments to context.subscriptions', () => {
    const subscriptions: { dispose: () => void }[] = [];
    const mockContext = {
      subscriptions,
    } as unknown as vscode.ExtensionContext;

    const completionSpy = vi.spyOn(vscode.languages, 'registerCompletionItemProvider');
    const hoverSpy = vi.spyOn(vscode.languages, 'registerHoverProvider');
    const codeActionSpy = vi.spyOn(vscode.languages, 'registerCodeActionsProvider');
    const definitionSpy = vi.spyOn(vscode.languages, 'registerDefinitionProvider');
    const symbolSpy = vi.spyOn(vscode.languages, 'registerDocumentSymbolProvider');

    let closeHandler: ((doc: any) => void) | undefined;
    vi.spyOn(vscode.workspace, 'onDidCloseTextDocument').mockImplementation((cb: any) => {
      closeHandler = cb;
      return new (vscode as any).Disposable(() => {});
    });

    activate(mockContext);

    expect(completionSpy).toHaveBeenCalledWith(
      SUPPORTED_LANGUAGES,
      expect.any(BloggerCompletionProvider),
      ...TRIGGER_CHARACTERS,
    );
    expect(hoverSpy).toHaveBeenCalledWith(
      SUPPORTED_LANGUAGES,
      expect.any(BloggerHoverProvider),
    );
    expect(codeActionSpy).toHaveBeenCalledWith(
      SUPPORTED_LANGUAGES,
      expect.any(BloggerCodeActionProvider),
      { providedCodeActionKinds: [vscode.CodeActionKind.QuickFix] },
    );
    expect(definitionSpy).toHaveBeenCalledWith(
      SUPPORTED_LANGUAGES,
      expect.any(BloggerDefinitionProvider),
    );
    expect(symbolSpy).toHaveBeenCalledWith(
      SUPPORTED_LANGUAGES,
      expect.any(BloggerDocumentSymbolProvider),
    );

    // subscriptions contains 8 main items + 1 close handler subscription = 9
    expect(subscriptions.length).toBeGreaterThanOrEqual(9);
    expect(closeHandler).toBeDefined();

    // Verify closing a document runs without error
    expect(() => {
      closeHandler!({ uri: { toString: () => 'file:///test.xml' } });
    }).not.toThrow();

    for (const subscription of subscriptions) {
      expect(typeof subscription.dispose).toBe('function');
      expect(() => subscription.dispose()).not.toThrow();
    }
  });
});
