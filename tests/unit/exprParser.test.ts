import { describe, expect, it } from 'vitest';
import { singlePostProperties } from '../../src/core/data/widgetsData.js';
import {
  detectLambdaPreArrowContext,
  getArrayElementProperty,
  inferExpressionType,
  inferSingularParamName,
  resolveCollectionProperty,
  resolveLambdaContextAtCursor,
  resolveLambdaHoverAtPosition,
} from '../../src/core/parser/exprParser.js';

describe('exprParser - Expression Parsing & Lambda Scopes', () => {
  describe('getArrayElementProperty', () => {
    it('returns post properties for posts array', () => {
      const postsProp = { name: 'posts', type: 'array' as const };
      const elem = getArrayElementProperty(postsProp);
      expect(elem).toBeDefined();
      expect(elem?.children?.title).toBeDefined();
      expect(elem?.children?.body).toBeDefined();
    });

    it('returns label properties for labels array', () => {
      const labelsProp = { name: 'labels', type: 'array' as const };
      const elem = getArrayElementProperty(labelsProp);
      expect(elem).toBeDefined();
      expect(elem?.children?.name).toBeDefined();
      expect(elem?.children?.url).toBeDefined();
      expect(elem?.children?.count).toBeUndefined(); // canonical post.labels only has name, url
    });

    it('returns custom itemChildren if defined on array', () => {
      const customProp = {
        name: 'customList',
        type: 'array' as const,
        itemChildren: {
          foo: { name: 'foo', type: 'string' as const },
        },
      };
      const elem = getArrayElementProperty(customProp);
      expect(elem).toBeDefined();
      expect(elem?.children?.foo).toBeDefined();
    });
  });

  describe('resolveCollectionProperty', () => {
    it('resolves data:posts from global blog widget', () => {
      const prop = resolveCollectionProperty('data:posts');
      expect(prop).toBeDefined();
      expect(prop?.type).toBe('array');
    });

    it('resolves collection from lambda parameter scope', () => {
      const postProp = {
        name: 'post',
        type: 'object' as const,
        children: singlePostProperties,
      };
      const lambdaScope = { p: postProp };
      const prop = resolveCollectionProperty('p.labels', undefined, lambdaScope);
      expect(prop).toBeDefined();
      expect(prop?.name).toBe('labels');
      expect(prop?.type).toBe('array');
    });

    it('strips XML attribute quotes when present', () => {
      const prop = resolveCollectionProperty('<b:eval expr="data:posts');
      expect(prop).toBeDefined();
      expect(prop?.type).toBe('array');
    });
  });

  describe('resolveLambdaContextAtCursor', () => {
    it('detects simple lambda parameter and suggests members on p.', () => {
      const text = '<b:eval expr="data:posts filter (p => p.';
      const ctx = resolveLambdaContextAtCursor(text, text.length);
      expect(ctx).toBeDefined();
      expect(ctx?.activeParam).toBe('p');
      expect(ctx?.isNavigatingMember).toBe(true);
      expect(ctx?.currentToken).toBe('');
      expect(ctx?.targetProperty?.children?.title).toBeDefined();
      expect(ctx?.targetProperty?.children?.body).toBeDefined();
    });

    it('detects partial property token on p.au', () => {
      const text = '<b:eval expr="data:posts filter (p => p.au';
      const ctx = resolveLambdaContextAtCursor(text, text.length);
      expect(ctx).toBeDefined();
      expect(ctx?.isNavigatingMember).toBe(true);
      expect(ctx?.currentToken).toBe('au');
      expect(ctx?.targetProperty?.children?.author).toBeDefined();
    });

    it('detects nested member navigation on p.author.', () => {
      const text = '<b:eval expr="data:posts filter (p => p.author.';
      const ctx = resolveLambdaContextAtCursor(text, text.length);
      expect(ctx).toBeDefined();
      expect(ctx?.isNavigatingMember).toBe(true);
      expect(ctx?.typedChain).toEqual(['author']);
      expect(ctx?.currentToken).toBe('');
      expect(ctx?.targetProperty?.children?.name).toBeDefined();
    });

    it('suggests lambda variable p right after arrow (p => )', () => {
      const text = '<b:eval expr="data:posts filter (p => ';
      const ctx = resolveLambdaContextAtCursor(text, text.length);
      expect(ctx).toBeDefined();
      expect(ctx?.isNavigatingMember).toBe(false);
      expect(ctx?.currentToken).toBe('');
      expect(ctx?.activeScopes.p).toBeDefined();
    });

    it('handles nested lambdas: data:posts filter (p => p.labels any (l => l.', () => {
      const text = '<b:eval expr="data:posts filter (p => p.labels any (l => l.';
      const ctx = resolveLambdaContextAtCursor(text, text.length);
      expect(ctx).toBeDefined();
      expect(ctx?.activeParam).toBe('l');
      expect(ctx?.isNavigatingMember).toBe(true);
      expect(ctx?.targetProperty?.children?.name).toBeDefined();
      expect(ctx?.targetProperty?.children?.url).toBeDefined();
      expect(ctx?.targetProperty?.children?.count).toBeUndefined(); // label item canonical
    });

    it('allows accessing outer lambda parameter p inside inner lambda', () => {
      const text = '<b:eval expr="data:posts filter (p => p.labels any (l => p.';
      const ctx = resolveLambdaContextAtCursor(text, text.length);
      expect(ctx).toBeDefined();
      expect(ctx?.isNavigatingMember).toBe(true);
      expect(ctx?.targetProperty?.children?.title).toBeDefined();
    });

    it('returns undefined if lambda is already closed before cursor', () => {
      const text = '<b:eval expr="data:posts filter (p => p.title != \'\') and ';
      const ctx = resolveLambdaContextAtCursor(text, text.length);
      expect(ctx).toBeUndefined();
    });
  });

  describe('resolveLambdaHoverAtPosition', () => {
    it('returns hover for lambda parameter variable p', () => {
      const line = '<b:eval expr="data:posts filter (p => p.title)" />';
      const hover = resolveLambdaHoverAtPosition(line, 33); // on 'p'
      expect(hover).toBeDefined();
      expect(hover?.category).toBe('variable');
      expect(hover?.title).toContain('p');
    });

    it('returns hover for lambda property access p.title', () => {
      const line = '<b:eval expr="data:posts filter (p => p.title)" />';
      const hover = resolveLambdaHoverAtPosition(line, 40); // on 'p.title'
      expect(hover).toBeDefined();
      expect(hover?.category).toBe('data');
      expect(hover?.title).toBe('(property) p.title');
      expect(hover?.type).toBe('string');
      expect(hover?.description).toBeDefined();
    });
  });

  describe('inferExpressionType', () => {
    it('infers numeric range "1 to 10" as array', () => {
      const res = inferExpressionType('1 to 10');
      expect(res.type).toBe('array');
    });

    it('infers count operation as number', () => {
      const res = inferExpressionType('data:posts count (p => p.allowComments)');
      expect(res.type).toBe('number');
    });

    it('infers any/all/none as boolean', () => {
      expect(inferExpressionType('data:posts any (p => p.allowComments)').type).toBe('boolean');
      expect(inferExpressionType('data:posts all (p => p.allowComments)').type).toBe('boolean');
      expect(inferExpressionType('data:posts none (p => p.allowComments)').type).toBe('boolean');
    });

    it('infers in and contains as boolean', () => {
      expect(inferExpressionType('data:view.search.label in data:post.labels map (l => l.name)').type).toBe('boolean');
      expect(inferExpressionType('data:blog.url contains "https"').type).toBe('boolean');
    });

    it('infers ternary expression branch type', () => {
      const res = inferExpressionType('data:post.hasOlderPage ? "Yes" : "No"');
      expect(res.type).toBe('string');

      const resNum = inferExpressionType('data:post.hasOlderPage ? 10 : 20');
      expect(resNum.type).toBe('number');
    });

    it('infers string/number/boolean literals', () => {
      expect(inferExpressionType('"hello"').type).toBe('string');
      expect(inferExpressionType('42').type).toBe('number');
      expect(inferExpressionType('true').type).toBe('boolean');
    });

    it('infers collection data path', () => {
      const res = inferExpressionType('data:posts');
      expect(res.type).toBe('array');
    });
  });

  describe('inferSingularParamName', () => {
    it('infers canonical singular letters for standard collections', () => {
      expect(inferSingularParamName('data:posts')).toBe('p');
      expect(inferSingularParamName('p.labels')).toBe('l');
      expect(inferSingularParamName('post.comments')).toBe('c');
      expect(inferSingularParamName('data:links')).toBe('l');
      expect(inferSingularParamName('data:widgets')).toBe('w');
      expect(inferSingularParamName('data:items')).toBe('item');
    });

    it('infers from property object if provided', () => {
      const prop = { name: 'posts', type: 'array' as const };
      expect(inferSingularParamName('expr', prop)).toBe('p');
    });

    it('falls back to "item" for unknown collections', () => {
      expect(inferSingularParamName('customCollection')).toBe('item');
      expect(inferSingularParamName('data:tags')).toBe('t');
    });
  });

  describe('detectLambdaPreArrowContext', () => {
    it('detects pre-arrow context right after open parenthesis', () => {
      const ctx = detectLambdaPreArrowContext('data:posts first (');
      expect(ctx).toBeDefined();
      expect(ctx?.operator).toBe('first');
      expect(ctx?.paramName).toBeUndefined();
      expect(ctx?.isWaitingForArrow).toBe(false);
      expect(ctx?.collectionOperand).toBe('data:posts');
    });

    it('detects pre-arrow context after typing parameter and space', () => {
      const ctx = detectLambdaPreArrowContext('data:posts first (p ');
      expect(ctx).toBeDefined();
      expect(ctx?.operator).toBe('first');
      expect(ctx?.paramName).toBe('p');
      expect(ctx?.isWaitingForArrow).toBe(true);
      expect(ctx?.collectionOperand).toBe('data:posts');
    });

    it('detects pre-arrow context in nested lambdas', () => {
      const ctx = detectLambdaPreArrowContext('data:posts filter (p => p.labels any (l ');
      expect(ctx).toBeDefined();
      expect(ctx?.operator).toBe('any');
      expect(ctx?.paramName).toBe('l');
      expect(ctx?.isWaitingForArrow).toBe(true);
      expect(ctx?.collectionOperand).toBe('p.labels');
    });

    it('returns undefined if arrow is already present', () => {
      expect(detectLambdaPreArrowContext('data:posts first (p => ')).toBeUndefined();
      expect(detectLambdaPreArrowContext('data:posts first (p => p.id)')).toBeUndefined();
    });

    it('returns undefined for non-lambda expressions', () => {
      expect(detectLambdaPreArrowContext('data:posts take 5')).toBeUndefined();
      expect(detectLambdaPreArrowContext('data:posts.size + 1')).toBeUndefined();
    });
  });
});
