import { describe, expect, it } from 'vitest';
import { PARAMETERIZED_MESSAGE_KEYS } from '../../src/core/data/messagesCatalog.js';
import { BloggerPathResolver } from '../../src/core/resolver/pathResolver.js';
import { BloggerScopeTracker } from '../../src/core/scope/scopeTracker.js';

describe('system messages and b:param contextual autocompletion', () => {
  const resolver = new BloggerPathResolver();
  const tracker = new BloggerScopeTracker();

  it('should suggest system messages in canonical format messages.<token> for <b:message name="', () => {
    const result = resolver.resolveFromLinePrefix('<b:message name="');
    expect(result).toBeDefined();
    const names = result!.suggestions.map(s => s.name);

    expect(names).toContain('messages.home');
    expect(names).toContain('messages.postedByAuthor');
    expect(names).toContain('messages.authorSaidWithLink');
    expect(names).toContain('messages.numberOfComments');
    expect(names).toContain('messages.templateImagesByLink');
    expect(names.length).toBe(95);

    const homeSugg = result!.suggestions.find(s => s.name === 'messages.home');
    expect(homeSugg?.detail).toBe('(System Message)');

    const paramSugg = result!.suggestions.find(s => s.name === 'messages.postedByAuthor');
    expect(paramSugg?.detail).toBe('(Parameterized System Message)');
  });

  it('should suggest authorName for messages.postedByAuthor and messages.authorSaid', () => {
    const postedResult = resolver.resolveFromLinePrefix('<b:param name="', {
      enclosingMessageName: 'messages.postedByAuthor',
    });
    expect(postedResult).toBeDefined();
    const postedNames = postedResult!.suggestions.map(s => s.name);
    expect(postedNames).toEqual(['authorName']);

    const saidResult = resolver.resolveFromLinePrefix('<b:param name="', {
      enclosingMessageName: 'messages.authorSaid',
    });
    expect(saidResult).toBeDefined();
    const saidNames = saidResult!.suggestions.map(s => s.name);
    expect(saidNames).toEqual(['authorName']);
  });

  it('should suggest authorName (pos 1) and authorUrl (pos 2) for messages.authorSaidWithLink', () => {
    const result = resolver.resolveFromLinePrefix('<b:param name="', {
      enclosingMessageName: 'messages.authorSaidWithLink',
    });
    expect(result).toBeDefined();
    const names = result!.suggestions.map(s => s.name);
    expect(names).toEqual(['authorName', 'authorUrl']);

    const p1 = result!.suggestions[0]!;
    const p2 = result!.suggestions[1]!;
    expect(p1.detail).toContain('Pos 1');
    expect(p2.detail).toContain('Pos 2');
  });

  it('should strictly suggest authorUrl (pos 1) and authorName (pos 2) in inverted order for messages.templateImagesByLink', () => {
    const result = resolver.resolveFromLinePrefix('<b:param name="', {
      enclosingMessageName: 'messages.templateImagesByLink',
    });
    expect(result).toBeDefined();
    const names = result!.suggestions.map(s => s.name);
    expect(names).toEqual(['authorUrl', 'authorName']);

    const p1 = result!.suggestions[0]!;
    const p2 = result!.suggestions[1]!;
    expect(p1.name).toBe('authorUrl');
    expect(p1.detail).toContain('Pos 1');
    expect(p2.name).toBe('authorName');
    expect(p2.detail).toContain('Pos 2');
  });

  it('should suggest numComments for messages.numberOfComments', () => {
    const result = resolver.resolveFromLinePrefix('<b:param name="', {
      enclosingMessageName: 'messages.numberOfComments',
    });
    expect(result).toBeDefined();
    expect(result!.suggestions.map(s => s.name)).toEqual(['numComments']);
  });

  it('should suggest bloggerUrl for messages.poweredByBloggerLink', () => {
    const result = resolver.resolveFromLinePrefix('<b:param name="', {
      enclosingMessageName: 'messages.poweredByBloggerLink',
    });
    expect(result).toBeDefined();
    expect(result!.suggestions.map(s => s.name)).toEqual(['bloggerUrl']);
  });

  it('should correctly detect enclosing message name from document text in tracker', () => {
    const text = `
<b:message name='messages.authorSaidWithLink'>
  <b:param name="
</b:message>
`;
    const offset = text.indexOf('<b:param name="') + '<b:param name="'.length;
    const detectedName = tracker.getEnclosingMessageName(text, offset);
    expect(detectedName).toBe('messages.authorSaidWithLink');
  });

  it('should verify that all 10 parameterized messages contain the prohibition note in data:messages.', () => {
    const suggestions = resolver.resolveDataPath(['messages']);
    expect(suggestions.length).toBe(95);

    for (const key of PARAMETERIZED_MESSAGE_KEYS) {
      const found = suggestions.find(s => s.name === key);
      expect(found).toBeDefined();
      expect(found?.description).toContain('direct invocation via <data:messages.');
      expect(found?.description).toContain('prohibited');
    }
  });

  it('should show hover cards for b:message and b:param attribute values', () => {
    const line1 = '<b:message name="messages.postedByAuthor">';
    const hover1 = resolver.resolveHoverAtPosition(line1, line1.indexOf('messages.postedByAuthor') + 2);
    expect(hover1).toBeDefined();
    expect(hover1?.hover.title).toContain('messages.postedByAuthor');
    expect(hover1?.hover.category).toBe('message');

    const line2 = '<b:param name="authorName" value="John">';
    const hover2 = resolver.resolveHoverAtPosition(line2, line2.indexOf('authorName') + 2, undefined, {
      enclosingMessageName: 'messages.postedByAuthor',
    });
    expect(hover2).toBeDefined();
    expect(hover2?.hover.title).toContain('authorName');
    expect(hover2?.hover.title).toContain('Pos 1');
  });
});
