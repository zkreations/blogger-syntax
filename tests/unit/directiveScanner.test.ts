import { describe, expect, it } from 'vitest';
import {
  getUnclosedDirectiveStack,
  isStrictlySelfClosingTag,
  maskXmlCommentsAndCdata,
  parseAttributes,
  scanDirectiveTokens,
} from '../../src/core/parser/directiveScanner.js';

describe('directiveScanner', () => {
  describe('isStrictlySelfClosingTag', () => {
    it('should recognize strictly self-closing tags', () => {
      expect(isStrictlySelfClosingTag('b:include')).toBe(true);
      expect(isStrictlySelfClosingTag('b:eval')).toBe(true);
      expect(isStrictlySelfClosingTag('Variable')).toBe(true);
      expect(isStrictlySelfClosingTag('b:widget')).toBe(false);
      expect(isStrictlySelfClosingTag('b:loop')).toBe(false);
      expect(isStrictlySelfClosingTag('img')).toBe(true);
      expect(isStrictlySelfClosingTag('data:')).toBe(true);
    });
  });

  describe('maskXmlCommentsAndCdata', () => {
    it('should mask standard comments and b:comment', () => {
      const input = '<!-- secret comment --> <b:comment>another</b:comment>';
      const masked = maskXmlCommentsAndCdata(input);
      expect(masked.length).toBe(input.length);
      expect(masked).not.toContain('secret');
      expect(masked).not.toContain('another');
    });

    it('should preserve Variable tags inside CDATA blocks', () => {
      const input = '<![CDATA[ body { color: red; } <Variable name="mainColor" type="color"/> ]]>';
      const masked = maskXmlCommentsAndCdata(input);
      expect(masked.length).toBe(input.length);
      expect(masked).toContain('<Variable name="mainColor" type="color"/>');
      expect(masked).not.toContain('body');
    });
  });

  describe('parseAttributes', () => {
    it('should extract double-quoted, single-quoted and unquoted attributes with spans', () => {
      const attrText = ' id="myWidget" type=\'Blog\' locked=true';
      const parsed = parseAttributes(attrText, 10);

      expect(parsed.id).toBeDefined();
      expect(parsed.id?.value).toBe('myWidget');
      expect(parsed.id?.quote).toBe('"');
      expect(parsed.id?.valueStart).toBe(15);
      expect(parsed.id?.valueEnd).toBe(23);

      expect(parsed.type).toBeDefined();
      expect(parsed.type?.value).toBe('Blog');
      expect(parsed.type?.quote).toBe('\'');

      expect(parsed.locked).toBeDefined();
      expect(parsed.locked?.value).toBe('true');
      expect(parsed.locked?.quote).toBeUndefined();
    });
  });

  describe('scanDirectiveTokens', () => {
    it('should correctly handle tags with ">" inside attribute quotes', () => {
      const xml = '<b:with var="gt" value="data:count > 5">\n  <b:eval expr="1"/>\n</b:with>';
      const tokens = scanDirectiveTokens(xml);

      expect(tokens.length).toBe(3);
      expect(tokens[0]?.tagName).toBe('b:with');
      expect(tokens[0]?.attributes.value?.value).toBe('data:count > 5');
      expect(tokens[0]?.isSelfClosing).toBe(false);

      expect(tokens[1]?.tagName).toBe('b:eval');
      expect(tokens[1]?.isSelfClosing).toBe(true);
      expect(tokens[1]?.hasSelfClosingSlash).toBe(true);
      expect(tokens[1]?.rawAttributesText).toBe(' expr="1"/');

      expect(tokens[2]?.tagName).toBe('b:with');
      expect(tokens[2]?.isClosing).toBe(true);
    });
  });

  describe('getUnclosedDirectiveStack', () => {
    it('should return active unclosed containers ignoring self-closing elements', () => {
      const xml = `
        <b:widget id="Blog1" type="Blog">
          <b:includable id="main">
            <b:include name="sub"/>
            <b:loop values="data:posts" var="post">
              <b:if cond="data:post.title">
      `;
      const stack = getUnclosedDirectiveStack(xml);
      expect(stack).toEqual(['b:widget', 'b:includable', 'b:loop', 'b:if']);
    });

    it('should pop matching containers when closed', () => {
      const xml = `
        <b:widget id="Blog1" type="Blog">
          <b:includable id="main">
            <b:if cond="true">
            </b:if>
      `;
      const stack = getUnclosedDirectiveStack(xml);
      expect(stack).toEqual(['b:widget', 'b:includable']);
    });
  });
});
