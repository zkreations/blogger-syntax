import { describe, expect, it } from 'vitest';
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

    it('infers element properties for data:posts loop', () => {
      const vars = inferLoopVariables('data:posts', 'post');
      expect(vars.post).toBeDefined();
      expect(vars.post?.type).toBe('object');
      expect(vars.post?.children?.title).toBeDefined();
      expect(vars.post?.children?.body).toBeDefined();
    });

    it('infers index variable as number', () => {
      const vars = inferLoopVariables('data:posts', 'post', 'i');
      expect(vars.i).toBeDefined();
      expect(vars.i?.type).toBe('number');
    });
  });

  describe('inferWithVariables', () => {
    it('infers number type and undefined children for count operation', () => {
      const vars = inferWithVariables('data:posts count (p => p.allowComments)', 'commentCount');
      expect(vars.commentCount).toBeDefined();
      expect(vars.commentCount?.type).toBe('number');
      expect(vars.commentCount?.children).toBeUndefined();
      expect(vars.commentCount?.itemChildren).toBeUndefined();
    });

    it('infers boolean type and undefined children for any predicate', () => {
      const vars = inferWithVariables('data:posts any (p => p.allowComments)', 'hasComments');
      expect(vars.hasComments).toBeDefined();
      expect(vars.hasComments?.type).toBe('boolean');
      expect(vars.hasComments?.children).toBeUndefined();
      expect(vars.hasComments?.itemChildren).toBeUndefined();
    });

    it('infers string type for string ternary expression', () => {
      const vars = inferWithVariables('data:post.hasOlderPage ? "Yes" : "No"', 'hasOlder');
      expect(vars.hasOlder).toBeDefined();
      expect(vars.hasOlder?.type).toBe('string');
      expect(vars.hasOlder?.children).toBeUndefined();
    });

    it('infers element properties for data:posts.first', () => {
      const vars = inferWithVariables('data:posts.first', 'firstPost');
      expect(vars.firstPost).toBeDefined();
      expect(vars.firstPost?.children?.title).toBeDefined();
      expect(vars.firstPost?.children?.author).toBeDefined();
    });

    it('infers array and itemChildren for data:posts', () => {
      const vars = inferWithVariables('data:posts', 'allPosts');
      expect(vars.allPosts).toBeDefined();
      expect(vars.allPosts?.type).toBe('array');
    });
  });
});
