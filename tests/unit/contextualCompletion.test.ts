import { describe, expect, it } from 'vitest';
import * as vscode from 'vscode';
import { BloggerPathResolver } from '../../src/core/resolver/pathResolver.js';
import { BloggerScopeTracker } from '../../src/core/scope/scopeTracker.js';
import { BloggerCompletionProvider } from '../../src/vscode/providers/completionProvider.js';
import { BloggerHoverProvider } from '../../src/vscode/providers/hoverProvider.js';
import { createMockDocument } from '../helpers/mockDocument.js';

describe('contextualCompletion and Hover', () => {
  const pathResolver = new BloggerPathResolver();
  const scopeTracker = new BloggerScopeTracker();
  const completionProvider = new BloggerCompletionProvider(pathResolver, scopeTracker);
  const hoverProvider = new BloggerHoverProvider(pathResolver, scopeTracker);
  const getItemLabel = (item: vscode.CompletionItem): string => typeof item.label === 'string' ? item.label : item.label.label;

  describe('b:loop with custom variable name (item)', () => {
    const lines = [
      '<b:widget id="Blog1" type="Blog">',
      '  <b:includable id="main">',
      '    <b:loop values="data:posts" var="item">',
      '      <data:item.',
      '    </b:loop>',
      '  </b:includable>',
      '</b:widget>',
    ];

    it('should suggest post properties for data:item. inside loop', () => {
      const doc = createMockDocument(lines, 'file:///loopItem.xml');
      const position = new vscode.Position(3, '      <data:item.'.length);

      const items = completionProvider.provideCompletionItems(doc, position) as vscode.CompletionItem[];
      expect(items).toBeDefined();
      expect(items.length).toBeGreaterThan(0);

      const labels = items.map(getItemLabel);
      expect(labels).toContain('title');
      expect(labels).toContain('body');
      expect(labels).toContain('snippets');
      expect(labels).toContain('author');
      expect(labels).toContain('url');
    });

    it('should suggest nested post author properties for data:item.author.', () => {
      const customLines = [
        '<b:widget id="Blog1" type="Blog">',
        '  <b:includable id="main">',
        '    <b:loop values="data:posts" var="item">',
        '      <data:item.author.',
        '    </b:loop>',
        '  </b:includable>',
        '</b:widget>',
      ];
      const doc = createMockDocument(customLines, 'file:///loopAuthor.xml');
      const position = new vscode.Position(3, '      <data:item.author.'.length);

      const items = completionProvider.provideCompletionItems(doc, position) as vscode.CompletionItem[];
      expect(items).toBeDefined();
      const labels = items.map(getItemLabel);
      expect(labels).toEqual(['name', 'profileUrl', 'authorPhoto', 'aboutMe']);
    });

    it('should provide correct replacement range when typing mid-word data:item.tit', () => {
      const customLines = [
        '<b:widget id="Blog1" type="Blog">',
        '  <b:includable id="main">',
        '    <b:loop values="data:posts" var="item">',
        '      <data:item.tit',
        '    </b:loop>',
        '  </b:includable>',
        '</b:widget>',
      ];
      const doc = createMockDocument(customLines, 'file:///loopTit.xml');
      const position = new vscode.Position(3, '      <data:item.tit'.length);

      const items = completionProvider.provideCompletionItems(doc, position) as vscode.CompletionItem[];
      expect(items).toBeDefined();

      const titleItem = items.find(item => getItemLabel(item) === 'title');
      expect(titleItem).toBeDefined();
      expect(titleItem?.range).toBeDefined();
      const range = titleItem?.range as vscode.Range;
      expect(range.start.character).toBe('      <data:item.'.length);
      expect(range.end.character).toBe('      <data:item.tit'.length);
    });

    it('should NOT suggest post properties for data:item. outside the loop', () => {
      const customLines = [
        '<b:widget id="Blog1" type="Blog">',
        '  <b:includable id="main">',
        '    <b:loop values="data:posts" var="item">',
        '      <div>In loop</div>',
        '    </b:loop>',
        '    <data:item.',
        '  </b:includable>',
        '</b:widget>',
      ];
      const doc = createMockDocument(customLines, 'file:///outsideLoop.xml');
      const position = new vscode.Position(5, '    <data:item.'.length);

      const items = completionProvider.provideCompletionItems(doc, position);
      expect(items).toBeUndefined();
    });

    it('should NOT suggest widget properties like data:posts. outside widget scope', () => {
      const outsideLines = [
        '<b:widget id="Blog1" type="Blog">',
        '</b:widget>',
        '<data:posts.',
      ];
      const doc = createMockDocument(outsideLines, 'file:///outsideWidget.xml');
      const position = new vscode.Position(2, '<data:posts.'.length);

      const items = completionProvider.provideCompletionItems(doc, position);
      expect(items).toBeUndefined();
    });
  });

  describe('nested b:loop with multiple variables (a and b)', () => {
    const lines = [
      '<b:widget id="Blog1" type="Blog">',
      '  <b:includable id="main">',
      '    <b:loop values="data:posts" var="a">',
      '      <data:a.title/>',
      '      <b:loop values="data:posts" var="b">',
      '        <data:a.',
      '        <data:b.',
      '      </b:loop>',
      '    </b:loop>',
      '  </b:includable>',
      '</b:widget>',
    ];

    it('should suggest properties for both "a" and "b" inside nested loop', () => {
      const doc = createMockDocument(lines, 'file:///nestedLoops.xml');

      // Inside inner loop, typing data:a.
      const posA = new vscode.Position(5, '        <data:a.'.length);
      const itemsA = completionProvider.provideCompletionItems(doc, posA) as vscode.CompletionItem[];
      expect(itemsA).toBeDefined();
      expect(itemsA.map(getItemLabel)).toContain('title');

      // Inside inner loop, typing data:b.
      const posB = new vscode.Position(6, '        <data:b.'.length);
      const itemsB = completionProvider.provideCompletionItems(doc, posB) as vscode.CompletionItem[];
      expect(itemsB).toBeDefined();
      expect(itemsB.map(getItemLabel)).toContain('title');
    });

    it('should suggest both "a" and "b" at root data: trigger inside nested loop', () => {
      const customLines = [
        '<b:widget id="Blog1" type="Blog">',
        '  <b:includable id="main">',
        '    <b:loop values="data:posts" var="a">',
        '      <b:loop values="data:posts" var="b">',
        '        <data:',
        '      </b:loop>',
        '    </b:loop>',
        '  </b:includable>',
        '</b:widget>',
      ];
      const doc = createMockDocument(customLines, 'file:///nestedRoot.xml');
      const position = new vscode.Position(4, '        <data:'.length);

      const items = completionProvider.provideCompletionItems(doc, position) as vscode.CompletionItem[];
      expect(items).toBeDefined();
      const labels = items.map(getItemLabel);
      expect(labels).toContain('a');
      expect(labels).toContain('b');
      expect(labels).toContain('blog');
    });
  });

  describe('b:with alias scopes', () => {
    it('should suggest post properties for data:alias. when using b:with with data:posts.first', () => {
      const lines = [
        '<b:widget id="Blog1" type="Blog">',
        '  <b:includable id="main">',
        '    <b:with value="data:posts.first" var="alias">',
        '      <data:alias.',
        '    </b:with>',
        '  </b:includable>',
        '</b:widget>',
      ];
      const doc = createMockDocument(lines, 'file:///withAlias.xml');
      const position = new vscode.Position(3, '      <data:alias.'.length);

      const items = completionProvider.provideCompletionItems(doc, position) as vscode.CompletionItem[];
      expect(items).toBeDefined();
      const labels = items.map(getItemLabel);
      expect(labels).toContain('title');
      expect(labels).toContain('body');
      expect(labels).toContain('snippets');
    });

    it('should suggest author properties for data:writer. when using b:with with data:post.author', () => {
      const lines = [
        '<b:widget id="Blog1" type="Blog">',
        '  <b:includable id="main">',
        '    <b:loop values="data:posts" var="post">',
        '      <b:with value="data:post.author" var="writer">',
        '        <data:writer.',
        '      </b:with>',
        '    </b:loop>',
        '  </b:includable>',
        '</b:widget>',
      ];
      const doc = createMockDocument(lines, 'file:///withWriter.xml');
      const position = new vscode.Position(4, '        <data:writer.'.length);

      const items = completionProvider.provideCompletionItems(doc, position) as vscode.CompletionItem[];
      expect(items).toBeDefined();
      const labels = items.map(getItemLabel);
      expect(labels).toEqual(['name', 'profileUrl', 'authorPhoto', 'aboutMe']);
    });

    it('should suggest object literal properties anywhere using b:with without widget', () => {
      const lines = [
        '<b:with value="{ maxItems: 10, label: \'Destacados\' }" var="cfg">',
        '  <data:cfg.',
        '</b:with>',
      ];
      const doc = createMockDocument(lines, 'file:///withLiteral.xml');
      const position = new vscode.Position(1, '  <data:cfg.'.length);

      const items = completionProvider.provideCompletionItems(doc, position) as vscode.CompletionItem[];
      expect(items).toBeDefined();
      const labels = items.map(getItemLabel);
      expect(labels).toContain('maxItems');
      expect(labels).toContain('label');
    });
  });

  describe('b:loop index variable', () => {
    it('should suggest index variable "i" with number type inside loop', () => {
      const lines = [
        '<b:loop values="data:posts" var="post" index="i">',
        '  <data:i',
        '</b:loop>',
      ];
      const doc = createMockDocument(lines, 'file:///loopIndex.xml');
      const position = new vscode.Position(1, '  <data:i'.length);

      const items = completionProvider.provideCompletionItems(doc, position) as vscode.CompletionItem[];
      expect(items).toBeDefined();
      const itemI = items.find(item => getItemLabel(item) === 'i');
      expect(itemI).toBeDefined();
      expect(itemI?.detail).toBe('(Blogger Data: Number)');
    });
  });

  describe('contextual HoverProvider', () => {
    it('should provide hover information for contextual loop variable property (data:item.title)', () => {
      const lines = [
        '<b:widget id="Blog1" type="Blog">',
        '  <b:includable id="main">',
        '    <b:loop values="data:posts" var="item">',
        '      <data:item.title/>',
        '    </b:loop>',
        '  </b:includable>',
        '</b:widget>',
      ];
      const doc = createMockDocument(lines, 'file:///hoverLoop.xml');
      const position = new vscode.Position(3, '      <data:item.tit'.length);

      const hover = hoverProvider.provideHover(doc, position) as vscode.Hover;
      expect(hover).toBeDefined();
      expect(hover.contents).toBeDefined();
      const contentStr = hover.contents.map(c => typeof c === 'string' ? c : c.value).join('\n');
      expect(contentStr).toContain('data:item.title');
      expect(contentStr).toContain('Post title.');
    });

    it('should provide hover information for contextual with variable (data:writer.name)', () => {
      const lines = [
        '<b:widget id="Blog1" type="Blog">',
        '  <b:includable id="main">',
        '    <b:loop values="data:posts" var="post">',
        '      <b:with value="data:post.author" var="writer">',
        '        <data:writer.name/>',
        '      </b:with>',
        '    </b:loop>',
        '  </b:includable>',
        '</b:widget>',
      ];
      const doc = createMockDocument(lines, 'file:///hoverWith.xml');
      const position = new vscode.Position(4, '        <data:writer.nam'.length);

      const hover = hoverProvider.provideHover(doc, position) as vscode.Hover;
      expect(hover).toBeDefined();
      const contentStr = hover.contents.map(c => typeof c === 'string' ? c : c.value).join('\n');
      expect(contentStr).toContain('data:writer.name');
      expect(contentStr).toContain('Display name of the post author.');
    });
  });

  describe('b:widget Blog array item completion', () => {
    it('should suggest array modifiers for data:feedLinks. and item properties for data:feedLinks.first. inside Blog widget', () => {
      const lines = [
        '<b:widget id="Blog1" type="Blog">',
        '  <b:includable id="main">',
        '    <data:feedLinks.',
        '    <data:feedLinks.first.',
        '  </b:includable>',
        '</b:widget>',
      ];
      const doc = createMockDocument(lines, 'file:///blogFeedLinks.xml');
      const arrayPosition = new vscode.Position(2, '    <data:feedLinks.'.length);

      const arrayItems = completionProvider.provideCompletionItems(doc, arrayPosition) as vscode.CompletionItem[];
      expect(arrayItems).toBeDefined();
      expect(arrayItems.length).toBeGreaterThan(0);

      const arrayLabels = arrayItems.map(getItemLabel);
      expect(arrayLabels).toContain('first');
      expect(arrayLabels).toContain('last');
      expect(arrayLabels).toContain('size');
      expect(arrayLabels).toContain('length');
      expect(arrayLabels).not.toContain('feedType');
      expect(arrayLabels).not.toContain('mimeType');

      const itemPosition = new vscode.Position(3, '    <data:feedLinks.first.'.length);
      const itemResults = completionProvider.provideCompletionItems(doc, itemPosition) as vscode.CompletionItem[];
      expect(itemResults).toBeDefined();

      const itemLabels = itemResults.map(getItemLabel);
      expect(itemLabels).toContain('feedType');
      expect(itemLabels).toContain('mimeType');
      expect(itemLabels).toContain('name');
    });
  });

  describe('scalar variables in b:loop and b:with', () => {
    it('should NOT suggest any members for loop numeric range variable <data:i.', () => {
      const lines = [
        '<b:loop values="1 to 10" var="i">',
        '  <data:i.',
        '</b:loop>',
      ];
      const doc = createMockDocument(lines, 'file:///loopRange.xml');
      const position = new vscode.Position(1, '  <data:i.'.length);

      const items = completionProvider.provideCompletionItems(doc, position);
      expect(items).toBeUndefined();
    });

    it('should NOT suggest array modifiers for count scalar variable <data:total.', () => {
      const lines = [
        '<b:with value="data:posts count (p => p.allowComments)" var="total">',
        '  <data:total.',
        '</b:with>',
      ];
      const doc = createMockDocument(lines, 'file:///withCount.xml');
      const position = new vscode.Position(1, '  <data:total.'.length);

      const items = completionProvider.provideCompletionItems(doc, position);
      expect(items).toBeUndefined();
    });
  });

  describe('data: prefix autocompletion inside expression attributes', () => {
    it('should suggest root data objects and ZERO operators inside <b:eval expr="data:">', () => {
      const lines = ['<b:eval expr="data:" />'];
      const doc = createMockDocument(lines, 'file:///evalExprData.xml');
      const position = new vscode.Position(0, '<b:eval expr="data:'.length);

      const items = completionProvider.provideCompletionItems(doc, position) as vscode.CompletionList;
      expect(items).toBeDefined();
      expect(items.items.length).toBeGreaterThan(0);

      const labels = items.items.map(getItemLabel);
      expect(labels).toContain('blog');
      expect(labels).toContain('view');
      expect(labels).toContain('skin');
      expect(items.items.every(item => item.kind !== vscode.CompletionItemKind.Operator)).toBe(true);
    });

    it('should suggest root data objects and ZERO operators inside <b:loop values="data:"> inside Blog widget', () => {
      const lines = [
        '<b:widget id="Blog1" type="Blog">',
        '  <b:includable id="main">',
        '    <b:loop values="data:" var="i">',
        '    </b:loop>',
        '  </b:includable>',
        '</b:widget>',
      ];
      const doc = createMockDocument(lines, 'file:///loopValuesData.xml');
      const position = new vscode.Position(2, '    <b:loop values="data:'.length);

      const items = completionProvider.provideCompletionItems(doc, position) as vscode.CompletionList;
      expect(items).toBeDefined();
      expect(items.items.length).toBeGreaterThan(0);

      const labels = items.items.map(getItemLabel);
      expect(labels).toContain('posts');
      expect(items.items.every(item => item.kind !== vscode.CompletionItemKind.Operator)).toBe(true);
    });

    it('should suggest root data objects and ZERO operators inside <b:with value="data:">', () => {
      const lines = [
        '<b:with value="data:" var="total">',
        '</b:with>',
      ];
      const doc = createMockDocument(lines, 'file:///withValueData.xml');
      const position = new vscode.Position(0, '<b:with value="data:'.length);

      const items = completionProvider.provideCompletionItems(doc, position) as vscode.CompletionList;
      expect(items).toBeDefined();
      expect(items.items.length).toBeGreaterThan(0);

      const labels = items.items.map(getItemLabel);
      expect(labels).toContain('blog');
      expect(items.items.every(item => item.kind !== vscode.CompletionItemKind.Operator)).toBe(true);
    });
  });
});
