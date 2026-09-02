import { describe, expect, it } from 'vitest';
import * as vscode from 'vscode';
import {
  isBloggerAttributeContext,
  isCursorInsideEmptyAttribute,
  registerCursorSuggestListener,
} from '../../src/vscode/listeners/cursorListener.js';
import { createMockDocument } from '../helpers/mockDocument.js';

describe('cursorListener', () => {
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
      { desc: 'standard HTML <input type="">', line: '<input type="" />', expected: false },
      { desc: 'standard HTML <meta description="">', line: '<meta description="" />', expected: false },
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
  });
});
