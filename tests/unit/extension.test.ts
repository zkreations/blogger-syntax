import { describe, expect, it, vi } from 'vitest';
import * as vscode from 'vscode';
import { activate } from '../../src/extension.js';

describe('extension lifecycle', () => {
  it('should activate and register providers to context.subscriptions', () => {
    const subscriptions: { dispose: () => void }[] = [];
    const mockContext = {
      subscriptions,
    } as unknown as vscode.ExtensionContext;

    const completionSpy = vi.spyOn(vscode.languages, 'registerCompletionItemProvider');
    const hoverSpy = vi.spyOn(vscode.languages, 'registerHoverProvider');
    const codeActionSpy = vi.spyOn(vscode.languages, 'registerCodeActionsProvider');
    const definitionSpy = vi.spyOn(vscode.languages, 'registerDefinitionProvider');
    const symbolSpy = vi.spyOn(vscode.languages, 'registerDocumentSymbolProvider');

    activate(mockContext);

    expect(completionSpy).toHaveBeenCalled();
    expect(hoverSpy).toHaveBeenCalled();
    expect(codeActionSpy).toHaveBeenCalled();
    expect(definitionSpy).toHaveBeenCalled();
    expect(symbolSpy).toHaveBeenCalled();
    expect(subscriptions.length).toBe(9);

    for (const subscription of subscriptions) {
      expect(typeof subscription.dispose).toBe('function');
      expect(() => subscription.dispose()).not.toThrow();
    }
  });
});
