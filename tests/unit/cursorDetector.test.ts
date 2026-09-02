import { describe, expect, it } from 'vitest';
import * as vscode from 'vscode';
import {
  isBloggerAttributeContext,
  isCursorInsideEmptyAttribute,
  registerCursorSuggestListener,
} from '../../src/vscode/listeners/cursorListener.js';

describe('cursorListener', () => {
  describe('isCursorInsideEmptyAttribute', () => {
    it('should return true when cursor is between empty double quotes description=""', () => {
      const line = '<Variable name="test" description="" type="color"/>';
      const cursorChar = line.indexOf('description=""') + 'description="'.length;
      expect(isCursorInsideEmptyAttribute(line, cursorChar, ['description'])).toBe(true);
      expect(isCursorInsideEmptyAttribute(line, cursorChar)).toBe(true);
    });

    it('should return true when cursor is between empty single quotes description=\'\'', () => {
      const line = '<Group description=\'\' selector=".main">';
      const cursorChar = line.indexOf('description=\'\'') + 'description=\''.length;
      expect(isCursorInsideEmptyAttribute(line, cursorChar, ['description'])).toBe(true);
    });

    it('should return true when spaces exist around equals sign in description = ""', () => {
      const line = '<Variable description = "" />';
      const cursorChar = line.indexOf('""') + 1;
      expect(isCursorInsideEmptyAttribute(line, cursorChar, ['description'])).toBe(true);
    });

    it('should return false when description has text inside quotes', () => {
      const line = '<Variable description="Accents" />';
      const cursorChar = line.indexOf('Accents');
      expect(isCursorInsideEmptyAttribute(line, cursorChar, ['description'])).toBe(false);
    });

    it('should return false when cursor is in other empty attributes when filtering for specific attributes', () => {
      const line = '<Variable name="" description="foo" />';
      const cursorChar = line.indexOf('name=""') + 'name="'.length;
      expect(isCursorInsideEmptyAttribute(line, cursorChar, ['description'])).toBe(false);
    });

    it('should return false when character position is out of bounds', () => {
      const line = '<Variable description="" />';
      expect(isCursorInsideEmptyAttribute(line, -1)).toBe(false);
      expect(isCursorInsideEmptyAttribute(line, line.length + 10)).toBe(false);
    });

    it('should return false for plain lines without matching attributes', () => {
      const line = '<b:include name="main" />';
      expect(isCursorInsideEmptyAttribute(line, 5)).toBe(false);
    });

    it('should return true when cursor is inside empty type="" in b:widget', () => {
      const line = '<b:widget id="main" type="" />';
      const cursorChar = line.indexOf('type=""') + 'type="'.length;
      expect(isCursorInsideEmptyAttribute(line, cursorChar)).toBe(true);
    });

    it('should return true when cursor is inside empty type=\'\' in b:defaultmarkup', () => {
      const line = '<b:defaultmarkup type=\'\' />';
      const cursorChar = line.indexOf('type=\'\'') + 'type=\''.length;
      expect(isCursorInsideEmptyAttribute(line, cursorChar)).toBe(true);
    });

    it('should return false when attribute has content', () => {
      const line = '<b:widget type="Blog" />';
      const cursorChar = line.indexOf('Blog');
      expect(isCursorInsideEmptyAttribute(line, cursorChar)).toBe(false);
    });
  });

  describe('isBloggerAttributeContext', () => {
    function createDoc(lines: string | string[]): vscode.TextDocument {
      return new (vscode as any).MockTextDocument(lines) as vscode.TextDocument;
    }

    it('should return true for <Variable description="">', () => {
      const line = '<Variable description="" />';
      const doc = createDoc(line);
      const pos = new vscode.Position(0, line.indexOf('""') + 1);
      expect(isBloggerAttributeContext(doc, pos)).toBe(true);
    });

    it('should return true for <Group description="">', () => {
      const line = '<Group description="" />';
      const doc = createDoc(line);
      const pos = new vscode.Position(0, line.indexOf('""') + 1);
      expect(isBloggerAttributeContext(doc, pos)).toBe(true);
    });

    it('should return true for <b:widget type="">', () => {
      const line = '<b:widget id="main" type="" />';
      const doc = createDoc(line);
      const pos = new vscode.Position(0, line.indexOf('""') + 1);
      expect(isBloggerAttributeContext(doc, pos)).toBe(true);
    });

    it('should return true for <b:defaultmarkup type="">', () => {
      const line = '<b:defaultmarkup type="" />';
      const doc = createDoc(line);
      const pos = new vscode.Position(0, line.indexOf('""') + 1);
      expect(isBloggerAttributeContext(doc, pos)).toBe(true);
    });

    it('should return false for standard HTML <input type="">', () => {
      const line = '<input type="" />';
      const doc = createDoc(line);
      const pos = new vscode.Position(0, line.indexOf('""') + 1);
      expect(isBloggerAttributeContext(doc, pos)).toBe(false);
    });

    it('should return false for standard HTML <meta description="">', () => {
      const line = '<meta description="" />';
      const doc = createDoc(line);
      const pos = new vscode.Position(0, line.indexOf('""') + 1);
      expect(isBloggerAttributeContext(doc, pos)).toBe(false);
    });

    it('should support multi-line <b:widget> tags', () => {
      const lines = [
        '<b:widget',
        '  id="Blog1"',
        '  type="" />',
      ];
      const doc = createDoc(lines);
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
