import { describe, expect, it } from 'vitest';
import {
  getNearestUnclosedTag,
  getUnclosedTagStack,
  isStrictlySelfClosingTag,
} from '../../src/core/parser/tagTreeTracker.js';

describe('tagTreeTracker', () => {
  describe('isStrictlySelfClosingTag', () => {
    it('identifies strictly self-closing Blogger tags', () => {
      expect(isStrictlySelfClosingTag('b:eval')).toBe(true);
      expect(isStrictlySelfClosingTag('b:include')).toBe(true);
      expect(isStrictlySelfClosingTag('b:else')).toBe(true);
      expect(isStrictlySelfClosingTag('b:elseif')).toBe(true);
      expect(isStrictlySelfClosingTag('b:attr')).toBe(true);
      expect(isStrictlySelfClosingTag('b:class')).toBe(true);
      expect(isStrictlySelfClosingTag('b:param')).toBe(true);
      expect(isStrictlySelfClosingTag('b:case')).toBe(true);
      expect(isStrictlySelfClosingTag('b:default')).toBe(true);
      expect(isStrictlySelfClosingTag('Variable')).toBe(true);
      expect(isStrictlySelfClosingTag('data:')).toBe(true);
      expect(isStrictlySelfClosingTag('data:blog.title')).toBe(true);
    });

    it('identifies container / paired Blogger tags as not strictly self-closing', () => {
      expect(isStrictlySelfClosingTag('b:if')).toBe(false);
      expect(isStrictlySelfClosingTag('b:loop')).toBe(false);
      expect(isStrictlySelfClosingTag('b:widget')).toBe(false);
      expect(isStrictlySelfClosingTag('b:includable')).toBe(false);
      expect(isStrictlySelfClosingTag('b:switch')).toBe(false);
      expect(isStrictlySelfClosingTag('Group')).toBe(false);
    });

    it('identifies HTML void elements as self-closing', () => {
      expect(isStrictlySelfClosingTag('img')).toBe(true);
      expect(isStrictlySelfClosingTag('br')).toBe(true);
      expect(isStrictlySelfClosingTag('input')).toBe(true);
      expect(isStrictlySelfClosingTag('div')).toBe(false);
    });
  });

  describe('getUnclosedTagStack', () => {
    it('tracks nested open container tags', () => {
      const xml = `
        <b:widget id='Blog1' type='Blog'>
          <b:includable id='main'>
            <b:if cond='data:view.isPost'>
              <b:loop values='data:posts' var='post'>
      `;
      const stack = getUnclosedTagStack(xml);
      expect(stack).toEqual(['b:widget', 'b:includable', 'b:if', 'b:loop']);
    });

    it('pops closed tags properly in order', () => {
      const xml = `
        <b:widget id='Blog1' type='Blog'>
          <b:includable id='main'>
            <b:if cond='data:view.isPost'>
            </b:if>
      `;
      const stack = getUnclosedTagStack(xml);
      expect(stack).toEqual(['b:widget', 'b:includable']);
    });

    it('ignores self-closing tags ending with "/>"', () => {
      const xml = `
        <b:widget id='Blog1' type='Blog'>
          <b:include name='header' />
          <b:eval expr='data:blog.title' />
      `;
      const stack = getUnclosedTagStack(xml);
      expect(stack).toEqual(['b:widget']);
    });

    it('ignores strictly self-closing tags even if unclosed with "/>"', () => {
      const xml = `
        <b:widget id='Blog1' type='Blog'>
          <b:eval expr='data:blog.title'>
          <b:include name='header'>
      `;
      const stack = getUnclosedTagStack(xml);
      expect(stack).toEqual(['b:widget']);
    });

    it('ignores HTML void tags without "/>"', () => {
      const xml = `
        <b:widget id='Blog1' type='Blog'>
          <div>
            <img src='logo.png'>
            <br>
      `;
      const stack = getUnclosedTagStack(xml);
      expect(stack).toEqual(['b:widget', 'div']);
    });

    it('strips incomplete closing tag at the end when typing "</"', () => {
      const xml = `
        <b:widget id='Blog1' type='Blog'>
          <b:loop values='data:posts' var='post'>
            </
      `;
      const stack = getUnclosedTagStack(xml);
      expect(stack).toEqual(['b:widget', 'b:loop']);
    });

    it('strips incomplete closing tag at the end when typing "</b:lo"', () => {
      const xml = `
        <b:widget id='Blog1' type='Blog'>
          <b:loop values='data:posts' var='post'>
            </b:lo
      `;
      const stack = getUnclosedTagStack(xml);
      expect(stack).toEqual(['b:widget', 'b:loop']);
    });

    it('ignores tags inside comments and CDATA', () => {
      const xml = `
        <b:widget id='Blog1' type='Blog'>
          <!-- <b:if cond='data:view.isPost'> -->
          <![CDATA[ <b:loop values='data:posts'> ]]>
      `;
      const stack = getUnclosedTagStack(xml);
      expect(stack).toEqual(['b:widget']);
    });

    it('returns empty array when all tags are closed', () => {
      const xml = `
        <b:widget id='Blog1' type='Blog'>
        </b:widget>
      `;
      const stack = getUnclosedTagStack(xml);
      expect(stack).toEqual([]);
    });
  });

  describe('getNearestUnclosedTag', () => {
    it('returns the innermost unclosed tag', () => {
      const xml = `
        <b:widget id='Blog1' type='Blog'>
          <b:includable id='main'>
            <b:if cond='data:view.isPost'>
              </
      `;
      expect(getNearestUnclosedTag(xml)).toBe('b:if');
    });

    it('returns the parent tag after an inner tag has been closed', () => {
      const xml = `
        <b:widget id='Blog1' type='Blog'>
          <b:includable id='main'>
            <b:if cond='data:view.isPost'>
            </b:if>
            </
      `;
      expect(getNearestUnclosedTag(xml)).toBe('b:includable');
    });

    it('returns undefined if no tags are open', () => {
      const xml = `
        <b:section id='main'></b:section>
        </
      `;
      expect(getNearestUnclosedTag(xml)).toBeUndefined();
    });
  });
});
