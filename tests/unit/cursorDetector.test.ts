import { describe, expect, it, vi } from 'vitest';
import * as vscode from 'vscode';
import {
  isBloggerAttributeContext,
  isCursorInsideDataTag,
  isCursorInsideEmptyAttribute,
  registerCursorSuggestListener,
} from '../../src/vscode/listeners/cursorListener.js';
import { createMockDocument } from '../helpers/mockDocument.js';

describe('cursorListener', () => {
  describe('isCursorInsideDataTag', () => {
    it('should return true when cursor is positioned directly between <data: and />', () => {
      const line = '<data:/>';
      const char = line.indexOf(':') + 1;
      expect(isCursorInsideDataTag(line, char)).toBe(true);
    });

    it('should return true when cursor is between <data: and >', () => {
      const line = '<data:>';
      const char = line.indexOf(':') + 1;
      expect(isCursorInsideDataTag(line, char)).toBe(true);
    });

    it('should return false when cursor is not directly after <data:', () => {
      const line = '<data:blog.title/>';
      expect(isCursorInsideDataTag(line, 2)).toBe(false);
      expect(isCursorInsideDataTag(line, line.length)).toBe(false);
    });
  });
  describe('isCursorInsideEmptyAttribute', () => {
    it.each([
      {
        desc: 'empty double quotes description=""',
        line: '<Variable name="test" description="" type="color"/>',
        calcChar: (l: string) => l.indexOf('description=""') + 'description="'.length,
        filter: ['description'],
        expected: true,
      },
      {
        desc: 'empty single quotes description=\'\'',
        line: '<Group description=\'\' selector=".main">',
        calcChar: (l: string) => l.indexOf('description=\'\'') + 'description=\''.length,
        filter: ['description'],
        expected: true,
      },
      {
        desc: 'spaces around equals sign in description = ""',
        line: '<Variable description = "" />',
        calcChar: (l: string) => l.indexOf('""') + 1,
        filter: ['description'],
        expected: true,
      },
      {
        desc: 'empty type="" in b:widget',
        line: '<b:widget id="main" type="" />',
        calcChar: (l: string) => l.indexOf('type=""') + 'type="'.length,
        filter: undefined,
        expected: true,
      },
      {
        desc: 'empty type=\'\' in b:defaultmarkup',
        line: '<b:defaultmarkup type=\'\' />',
        calcChar: (l: string) => l.indexOf('type=\'\'') + 'type=\''.length,
        filter: undefined,
        expected: true,
      },
      {
        desc: 'description with existing text inside quotes',
        line: '<Variable description="Accents" />',
        calcChar: (l: string) => l.indexOf('Accents'),
        filter: ['description'],
        expected: false,
      },
      {
        desc: 'type with existing text in b:widget',
        line: '<b:widget type="Blog" />',
        calcChar: (l: string) => l.indexOf('Blog'),
        filter: undefined,
        expected: false,
      },
      {
        desc: 'cursor in other empty attribute when filtering for specific attributes',
        line: '<Variable name="" description="foo" />',
        calcChar: (l: string) => l.indexOf('name=""') + 'name="'.length,
        filter: ['description'],
        expected: false,
      },
      {
        desc: 'out of bounds negative character',
        line: '<Variable description="" />',
        calcChar: () => -1,
        filter: undefined,
        expected: false,
      },
      {
        desc: 'out of bounds past line length',
        line: '<Variable description="" />',
        calcChar: (l: string) => l.length + 10,
        filter: undefined,
        expected: false,
      },
      {
        desc: 'plain lines without matching attributes',
        line: '<b:include name="main" />',
        calcChar: () => 5,
        filter: undefined,
        expected: false,
      },
    ])('should return $expected for $desc', ({ line, calcChar, filter, expected }) => {
      const char = calcChar(line);
      expect(isCursorInsideEmptyAttribute(line, char, filter)).toBe(expected);
    });
  });

  describe('isBloggerAttributeContext', () => {
    it.each([
      { desc: '<Variable description="">', line: '<Variable description="" />', expected: true },
      { desc: '<Group description="">', line: '<Group description="" />', expected: true },
      { desc: '<b:widget type="">', line: '<b:widget id="main" type="" />', expected: true },
      { desc: '<b:defaultmarkup type="">', line: '<b:defaultmarkup type="" />', expected: true },
      { desc: '<Variable type="">', line: '<Variable name="test" type="" />', expected: true },
      { desc: '<b:section tag="">', line: '<b:section id="main" tag="" />', expected: true },
      { desc: '<b:loop reverse="">', line: '<b:loop values="data:posts" reverse="" />', expected: true },
      { desc: '<b:comment render="">', line: '<b:comment render="" />', expected: true },
      { desc: '<b:section showaddelement="">', line: '<b:section id="main" showaddelement="" />', expected: true },
      { desc: '<b:widget locked="">', line: '<b:widget id="main" locked="" />', expected: true },
      { desc: '<b:widget visible="">', line: '<b:widget id="main" visible="" />', expected: true },
      { desc: '<b:widget version="">', line: '<b:widget id="main" version="" />', expected: true },
      { desc: '<b:include name="">', line: '<b:include name="" />', expected: true },
      { desc: '<b:tag name="">', line: '<b:tag name="" />', expected: true },
      { desc: '<b:message name="">', line: '<b:message name="" />', expected: true },
      { desc: '<b:param name="">', line: '<b:param name="" />', expected: true },
      { desc: '<b:widget-setting name="">', line: '<b:widget-setting name="" />', expected: true },
      { desc: 'standard HTML <input type="">', line: '<input type="" />', expected: false },
      { desc: 'standard HTML <meta description="">', line: '<meta description="" />', expected: false },
      { desc: 'standard HTML <div tag="">', line: '<div tag="" />', expected: false },
      { desc: 'standard HTML <div name="">', line: '<div name="" />', expected: false },
    ])('should return $expected for $desc', ({ line, expected }) => {
      const doc = createMockDocument(line);
      const pos = new vscode.Position(0, line.indexOf('""') + 1);
      expect(isBloggerAttributeContext(doc, pos)).toBe(expected);
    });

    it('should support multi-line <b:widget> tags', () => {
      const lines = [
        '<b:widget',
        '  id="Blog1"',
        '  type="" />',
      ];
      const doc = createMockDocument(lines);
      const pos = new vscode.Position(2, lines[2]!.indexOf('""') + 1);
      expect(isBloggerAttributeContext(doc, pos)).toBe(true);
    });
  });

  describe('registerCursorSuggestListener', () => {
    it('should return a disposable object', () => {
      const disposable = registerCursorSuggestListener();
      expect(disposable).toBeDefined();
      expect(typeof disposable.dispose).toBe('function');
      expect(() => disposable.dispose()).not.toThrow();
    });

    it('should trigger suggest command when cursor is inside empty attribute and setting is enabled', () => {
      vi.useFakeTimers();

      let selectionHandler: ((e: any) => void) | undefined;
      vi.spyOn(vscode.window, 'onDidChangeTextEditorSelection').mockImplementation((cb: any) => {
        selectionHandler = cb;
        return new (vscode as any).Disposable(() => {});
      });

      const executeSpy = vi.spyOn(vscode.commands, 'executeCommand').mockResolvedValue(undefined as any);

      const line = '<b:widget id="main" type="" />';
      const doc = createMockDocument(line);
      const pos = new vscode.Position(0, line.indexOf('""') + 1);

      const mockEditor = {
        document: doc,
        selection: { active: pos },
      };
      (vscode.window as any).activeTextEditor = mockEditor;

      const disposable = registerCursorSuggestListener(100);
      expect(selectionHandler).toBeDefined();

      selectionHandler!({
        textEditor: mockEditor,
        selections: [{ isEmpty: true }],
      });

      vi.advanceTimersByTime(150);

      expect(executeSpy).toHaveBeenCalledWith('editor.action.triggerSuggest');

      disposable.dispose();
      vi.useRealTimers();
      (vscode.window as any).activeTextEditor = undefined;
    });

    it('should NOT trigger suggest command when disabled via configuration', () => {
      vi.useFakeTimers();

      let selectionHandler: ((e: any) => void) | undefined;
      vi.spyOn(vscode.window, 'onDidChangeTextEditorSelection').mockImplementation((cb: any) => {
        selectionHandler = cb;
        return new (vscode as any).Disposable(() => {});
      });

      const executeSpy = vi.spyOn(vscode.commands, 'executeCommand').mockResolvedValue(undefined as any);
      vi.spyOn(vscode.workspace, 'getConfiguration').mockReturnValue({
        get: () => false,
      } as any);

      const line = '<b:widget id="main" type="" />';
      const doc = createMockDocument(line);
      const pos = new vscode.Position(0, line.indexOf('""') + 1);

      const mockEditor = {
        document: doc,
        selection: { active: pos },
      };
      (vscode.window as any).activeTextEditor = mockEditor;

      const disposable = registerCursorSuggestListener(100);

      selectionHandler!({
        textEditor: mockEditor,
        selections: [{ isEmpty: true }],
      });

      vi.advanceTimersByTime(150);

      expect(executeSpy).not.toHaveBeenCalled();

      disposable.dispose();
      vi.useRealTimers();
      (vscode.window as any).activeTextEditor = undefined;
    });
  });
});
