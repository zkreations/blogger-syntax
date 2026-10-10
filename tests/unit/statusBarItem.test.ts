import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as vscode from 'vscode';
import { BloggerStatusBarItem } from '../../src/vscode/ui/statusBarItem.js';
import { MockStatusBarItem, Position } from './__mocks__/vscode.js';

describe('bloggerStatusBarItem', () => {
  let createdMockItem: MockStatusBarItem;

  beforeEach(() => {
    vi.restoreAllMocks();
    createdMockItem = new MockStatusBarItem();
    vi.spyOn(vscode.window, 'createStatusBarItem').mockReturnValue(createdMockItem as any);
  });

  afterEach(() => {
    (vscode.window as any).activeTextEditor = undefined;
  });

  it('hides status bar item when there is no active text editor', () => {
    (vscode.window as any).activeTextEditor = undefined;

    const statusBar = new BloggerStatusBarItem();
    statusBar.update();

    expect(createdMockItem.isVisible).toBe(false);
    statusBar.dispose();
  });

  it('hides status bar item when active editor language is unsupported', () => {
    (vscode.window as any).activeTextEditor = {
      document: {
        languageId: 'typescript',
        getText: () => 'const x = 1;',
        lineCount: 1,
        lineAt: () => ({ text: 'const x = 1;' }),
        offsetAt: () => 0,
        positionAt: () => new Position(0, 0),
      },
      selection: { active: new Position(0, 0) },
    };

    const statusBar = new BloggerStatusBarItem();
    statusBar.update();

    expect(createdMockItem.isVisible).toBe(false);
    statusBar.dispose();
  });

  it('updates text and shows status bar item for Blogger XML document', () => {
    const xml = `<html b:layoutsVersion='3'><b:section id='main'><b:widget id='Blog1' type='Blog'/></b:section></html>`;
    (vscode.window as any).activeTextEditor = {
      document: {
        languageId: 'xml',
        getText: () => xml,
        lineCount: 1,
        lineAt: () => ({ text: xml }),
        offsetAt: () => 0,
        positionAt: () => new Position(0, 0),
      },
      selection: { active: new Position(0, 0) },
    };

    const statusBar = new BloggerStatusBarItem();
    statusBar.update();

    expect(createdMockItem.isVisible).toBe(true);
    expect(createdMockItem.text).toBe('$(symbol-structure) Blogger v3');
    expect(createdMockItem.tooltip).toContain('Blogger Layouts v3');
    statusBar.dispose();
  });

  it('registers and displays template details message via showTemplateInfo command', async () => {
    let registeredCallback: (() => void) | undefined;
    vi.spyOn(vscode.commands, 'registerCommand').mockImplementation((cmd, cb) => {
      if (cmd === 'bloggerSyntax.showTemplateInfo') {
        registeredCallback = cb;
      }
      return new (vscode as any).Disposable(() => {});
    });

    const infoSpy = vi.spyOn(vscode.window, 'showInformationMessage').mockResolvedValue(undefined);

    const xml = `
      <b:section id='main'>
        <b:widget id='Blog1' type='Blog'>
          <b:includable id='main'/>
          <b:includable id='sub'/>
        </b:widget>
      </b:section>
    `;

    (vscode.window as any).activeTextEditor = {
      document: {
        languageId: 'xml',
        getText: () => xml,
        lineCount: 8,
        lineAt: () => ({ text: '' }),
        offsetAt: () => 0,
        positionAt: () => new Position(0, 0),
      },
      selection: { active: new Position(0, 0) },
    };

    const statusBar = new BloggerStatusBarItem();
    expect(registeredCallback).toBeDefined();

    registeredCallback!();

    expect(infoSpy).toHaveBeenCalledTimes(1);
    const msg = infoSpy.mock.calls[0]![0];
    expect(msg).toContain('Sections: 1');
    expect(msg).toContain('Widgets: 1');
    expect(msg).toContain('Includables: 2');

    statusBar.dispose();
  });

  it('debounces update when text document changes', () => {
    vi.useFakeTimers();

    let textChangeHandler: ((e: any) => void) | undefined;
    vi.spyOn(vscode.workspace, 'onDidChangeTextDocument').mockImplementation((cb: any) => {
      textChangeHandler = cb;
      return new (vscode as any).Disposable(() => {});
    });

    const mockDoc = {
      languageId: 'xml',
      getText: () => `<html b:version='2'></html>`,
      lineCount: 1,
      lineAt: () => ({ text: '' }),
      offsetAt: () => 0,
      positionAt: () => new Position(0, 0),
    };

    (vscode.window as any).activeTextEditor = {
      document: mockDoc,
      selection: { active: new Position(0, 0) },
    };

    const statusBar = new BloggerStatusBarItem();
    expect(textChangeHandler).toBeDefined();

    // Trigger document change
    textChangeHandler!({ document: mockDoc });

    // Before timer completes (300ms)
    vi.advanceTimersByTime(200);
    // Advance remaining
    vi.advanceTimersByTime(150);

    expect(createdMockItem.text).toBe('$(symbol-structure) Blogger v2');

    statusBar.dispose();
    vi.useRealTimers();
  });
});
