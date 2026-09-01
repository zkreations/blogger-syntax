import { describe, expect, it } from 'vitest';
import { BloggerScopeTracker } from '../../src/core/scope/scopeTracker.js';
import { extractDataPathSegments, inferLoopVariables, inferWithVariables } from '../../src/core/scope/typeInferencer.js';

describe('typeInferencer', () => {
  it('should extract data path segments from various expressions', () => {
    expect(extractDataPathSegments('data:posts')).toEqual(['posts']);
    expect(extractDataPathSegments('data:posts.first')).toEqual(['posts', 'first']);
    expect(extractDataPathSegments('data:post.author.name')).toEqual(['post', 'author', 'name']);
    expect(extractDataPathSegments('posts')).toEqual(['posts']);
    expect(extractDataPathSegments('data:posts filter (p => p.hasJumpLink)')).toEqual(['posts']);
  });

  it('should infer loop item properties for data:posts', () => {
    const vars = inferLoopVariables('data:posts', 'item');
    expect(vars.item).toBeDefined();
    expect(vars.item?.type).toBe('object');
    expect(vars.item?.children).toBeDefined();
    expect(vars.item?.children?.title).toBeDefined();
    expect(vars.item?.children?.title?.type).toBe('string');
  });

  it('should infer index variable with number type for b:loop', () => {
    const vars = inferLoopVariables('data:posts', 'item', 'i');
    expect(vars.i).toBeDefined();
    expect(vars.i?.type).toBe('number');
  });

  it('should infer alias properties for b:with with data:posts.first', () => {
    const vars = inferWithVariables('data:posts.first', 'alias');
    expect(vars.alias).toBeDefined();
    expect(vars.alias?.children?.title).toBeDefined();
    expect(vars.alias?.children?.author).toBeDefined();
  });

  it('should infer alias properties for b:with with data:post.author', () => {
    const vars = inferWithVariables('data:post.author', 'author');
    expect(vars.author).toBeDefined();
    expect(vars.author?.children?.name).toBeDefined();
    expect(vars.author?.children?.profileUrl).toBeDefined();
  });
});

describe('bloggerScopeTracker', () => {
  const tracker = new BloggerScopeTracker();

  it('should parse single b:loop scope and locate active variables', () => {
    const code = [
      '<b:loop values="data:posts" var="item">',
      '  <data:item.title/>',
      '</b:loop>',
    ].join('\n');

    const blocks = tracker.parseScopes(code);
    expect(blocks.length).toBe(1);
    expect(blocks[0]?.tag).toBe('b:loop');
    expect(blocks[0]?.variables.item).toBeDefined();

    // Inside loop (line 1)
    const insideOffset = code.indexOf('<data:item.title/>');
    const insideVars = tracker.getActiveVariables('doc1', 1, code, insideOffset);
    expect(insideVars.item).toBeDefined();
    expect(insideVars.item?.children?.title).toBeDefined();

    // Outside loop (after </b:loop>)
    const outsideOffset = code.length;
    const outsideVars = tracker.getActiveVariables('doc1', 1, code, outsideOffset);
    expect(outsideVars.item).toBeUndefined();
  });

  it('should handle nested b:loop scopes with multiple variables (a and b)', () => {
    const code = [
      '<b:loop values="data:posts" var="a">',
      '  <data:a.title/>',
      '  <b:loop values="data:posts" var="b">',
      '    <data:a.title/>',
      '    <data:b.title/>',
      '  </b:loop>',
      '  <data:a.title/>',
      '</b:loop>',
    ].join('\n');

    const outerOffset = code.indexOf('<data:a.title/>');
    const innerOffset = code.indexOf('<data:b.title/>');
    const afterInnerOffset = code.lastIndexOf('<data:a.title/>');

    // In outer scope: only 'a' is active
    const outerVars = tracker.getActiveVariables('nestedDoc', 1, code, outerOffset);
    expect(outerVars.a).toBeDefined();
    expect(outerVars.b).toBeUndefined();

    // In inner scope: both 'a' and 'b' are active
    const innerVars = tracker.getActiveVariables('nestedDoc', 1, code, innerOffset);
    expect(innerVars.a).toBeDefined();
    expect(innerVars.b).toBeDefined();

    // After inner loop ends (back in outer loop): 'a' is active, 'b' is gone
    const afterInnerVars = tracker.getActiveVariables('nestedDoc', 1, code, afterInnerOffset);
    expect(afterInnerVars.a).toBeDefined();
    expect(afterInnerVars.b).toBeUndefined();
  });

  it('should parse b:with scopes and aliases correctly', () => {
    const code = [
      '<b:with value="data:posts.first" var="alias">',
      '  <data:alias.title/>',
      '</b:with>',
    ].join('\n');

    const insideOffset = code.indexOf('<data:alias.title/>');
    const vars = tracker.getActiveVariables('withDoc', 1, code, insideOffset);
    expect(vars.alias).toBeDefined();
    expect(vars.alias?.children?.title).toBeDefined();
  });

  it('should support multi-line b:loop and b:with tags', () => {
    const code = [
      '<b:loop',
      '  values="data:posts"',
      '  var="entry"',
      '  index="i">',
      '  <data:entry.title/>',
      '</b:loop>',
    ].join('\n');

    const insideOffset = code.indexOf('<data:entry.title/>');
    const vars = tracker.getActiveVariables('multiLineDoc', 1, code, insideOffset);
    expect(vars.entry).toBeDefined();
    expect(vars.i).toBeDefined();
    expect(vars.i?.type).toBe('number');
  });

  it('should ignore self-closing b:loop and b:with tags', () => {
    const code = [
      '<b:loop values="data:posts" var="temp" />',
      '<div>Content</div>',
    ].join('\n');

    const blocks = tracker.parseScopes(code);
    expect(blocks.length).toBe(0);

    const offset = code.indexOf('<div>');
    const vars = tracker.getActiveVariables('selfCloseDoc', 1, code, offset);
    expect(vars.temp).toBeUndefined();
  });

  it('should handle sibling loops without leaking variables', () => {
    const code = [
      '<b:loop values="data:posts" var="loopOne">',
      '  <span>One</span>',
      '</b:loop>',
      '<b:loop values="data:posts" var="loopTwo">',
      '  <span>Two</span>',
      '</b:loop>',
    ].join('\n');

    const insideOne = code.indexOf('<span>One</span>');
    const insideTwo = code.indexOf('<span>Two</span>');

    const varsOne = tracker.getActiveVariables('siblingDoc', 1, code, insideOne);
    expect(varsOne.loopOne).toBeDefined();
    expect(varsOne.loopTwo).toBeUndefined();

    const varsTwo = tracker.getActiveVariables('siblingDoc', 1, code, insideTwo);
    expect(varsTwo.loopOne).toBeUndefined();
    expect(varsTwo.loopTwo).toBeDefined();
  });

  it('should leverage caching for matching document version and support clearCache', () => {
    const code = '<b:loop values="data:posts" var="cachedVar"><div/></b:loop>';
    const offset = code.indexOf('<div/>');

    const vars1 = tracker.getActiveVariables('cachedDoc', 1, code, offset);
    expect(vars1.cachedVar).toBeDefined();

    // Same version -> hits cache
    const vars2 = tracker.getActiveVariables('cachedDoc', 1, code, offset);
    expect(vars2.cachedVar).toBeDefined();

    tracker.clearCache('cachedDoc');
    tracker.clearCache();
  });
});
