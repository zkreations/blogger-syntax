import { describe, expect, it } from 'vitest';
import { blogWidgetProperties, singlePostProperties } from '../../src/core/data/widgetsData.js';
import {
  inferLoopVariables,
  inferWithVariables,
} from '../../src/core/scope/typeInferencer.js';

describe('typeInferencer - Loop and With Variable Inference', () => {
  describe('inferLoopVariables', () => {
    it('infers number type for numeric range "1 to 10"', () => {
      const vars = inferLoopVariables('1 to 10', 'num');
      expect(vars.num).toBeDefined();
      expect(vars.num?.type).toBe('number');
      expect(vars.num?.description).toContain('range');
    });

    it('infers element properties for data:posts loop inside Blog widget', () => {
      const vars = inferLoopVariables('data:posts', 'post', undefined, blogWidgetProperties);
      expect(vars.post).toBeDefined();
      expect(vars.post?.type).toBe('object');
      expect(vars.post?.children?.title).toBeDefined();
      expect(vars.post?.children?.body).toBeDefined();
    });

    it('does not infer element properties for data:posts loop without widget context', () => {
      const vars = inferLoopVariables('data:posts', 'post');
      expect(vars.post).toBeDefined();
      expect(vars.post?.children).toBeUndefined();
    });

    it('infers index variable as number', () => {
      const vars = inferLoopVariables('data:posts', 'post', 'i', blogWidgetProperties);
      expect(vars.i).toBeDefined();
      expect(vars.i?.type).toBe('number');
    });
  });

  describe('inferWithVariables', () => {
    it('infers number type and undefined children for count operation inside Blog widget', () => {
      const vars = inferWithVariables('data:posts count (p => p.allowComments)', 'commentCount', blogWidgetProperties);
      expect(vars.commentCount).toBeDefined();
      expect(vars.commentCount?.type).toBe('number');
      expect(vars.commentCount?.children).toBeUndefined();
      expect(vars.commentCount?.itemChildren).toBeUndefined();
    });

    it('infers boolean type and undefined children for any predicate inside Blog widget', () => {
      const vars = inferWithVariables('data:posts any (p => p.allowComments)', 'hasComments', blogWidgetProperties);
      expect(vars.hasComments).toBeDefined();
      expect(vars.hasComments?.type).toBe('boolean');
      expect(vars.hasComments?.children).toBeUndefined();
      expect(vars.hasComments?.itemChildren).toBeUndefined();
    });

    it('infers string type for string ternary expression with post in scope', () => {
      const postContext = {
        post: {
          name: 'post',
          type: 'object' as const,
          children: singlePostProperties,
        },
      };
      const vars = inferWithVariables('data:post.hasOlderPage ? "Yes" : "No"', 'hasOlder', postContext);
      expect(vars.hasOlder).toBeDefined();
      expect(vars.hasOlder?.type).toBe('string');
      expect(vars.hasOlder?.children).toBeUndefined();
    });

    it('infers element properties for data:posts.first inside Blog widget', () => {
      const vars = inferWithVariables('data:posts.first', 'firstPost', blogWidgetProperties);
      expect(vars.firstPost).toBeDefined();
      expect(vars.firstPost?.children?.title).toBeDefined();
      expect(vars.firstPost?.children?.author).toBeDefined();
    });

    it('infers array and itemChildren for data:posts inside Blog widget', () => {
      const vars = inferWithVariables('data:posts', 'allPosts', blogWidgetProperties);
      expect(vars.allPosts).toBeDefined();
      expect(vars.allPosts?.type).toBe('array');
    });

    it('infers object literal properties for b:with value="{ maxItems: 10, label: \'Destacados\' }"', () => {
      const vars = inferWithVariables('{ maxItems: 10, label: "Destacados" }', 'cfg');
      expect(vars.cfg).toBeDefined();
      expect(vars.cfg?.type).toBe('object');
      expect(vars.cfg?.children?.maxItems).toBeDefined();
      expect(vars.cfg?.children?.maxItems?.type).toBe('number');
      expect(vars.cfg?.children?.label).toBeDefined();
      expect(vars.cfg?.children?.label?.type).toBe('string');
    });
  });
});
