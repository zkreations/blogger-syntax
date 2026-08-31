import { describe, expect, it } from 'vitest';
import { isCursorInsideEmptyDescription } from '../../src/vscode/utils/cursorDetector.js';

describe('cursorDetector', () => {
  describe('isCursorInsideEmptyDescription', () => {
    it('should return true when cursor is between empty double quotes description=""', () => {
      const line = '<Variable name="test" description="" type="color"/>';
      const cursorChar = line.indexOf('description=""') + 'description="'.length;
      expect(isCursorInsideEmptyDescription(line, cursorChar)).toBe(true);
    });

    it('should return true when cursor is between empty single quotes description=\'\'', () => {
      const line = '<Group description=\'\' selector=".main">';
      const cursorChar = line.indexOf('description=\'\'') + 'description=\''.length;
      expect(isCursorInsideEmptyDescription(line, cursorChar)).toBe(true);
    });

    it('should return true when spaces exist around equals sign in description = ""', () => {
      const line = '<Variable description = "" />';
      const cursorChar = line.indexOf('""') + 1;
      expect(isCursorInsideEmptyDescription(line, cursorChar)).toBe(true);
    });

    it('should return false when description has text inside quotes', () => {
      const line = '<Variable description="Accents" />';
      const cursorChar = line.indexOf('Accents');
      expect(isCursorInsideEmptyDescription(line, cursorChar)).toBe(false);
    });

    it('should return false when cursor is in other empty attributes like name=""', () => {
      const line = '<Variable name="" description="foo" />';
      const cursorChar = line.indexOf('name=""') + 'name="'.length;
      expect(isCursorInsideEmptyDescription(line, cursorChar)).toBe(false);
    });

    it('should return false when character position is out of bounds', () => {
      const line = '<Variable description="" />';
      expect(isCursorInsideEmptyDescription(line, -1)).toBe(false);
      expect(isCursorInsideEmptyDescription(line, line.length + 10)).toBe(false);
    });

    it('should return false for plain lines without description', () => {
      const line = '<b:include name="main" />';
      expect(isCursorInsideEmptyDescription(line, 5)).toBe(false);
    });
  });
});
