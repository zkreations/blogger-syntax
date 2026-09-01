import { describe, expect, it } from 'vitest';
import * as vscode from 'vscode';
import { BloggerPathResolver } from '../../src/core/resolver/pathResolver.js';
import { BloggerHoverProvider } from '../../src/vscode/providers/hoverProvider.js';

describe('bloggerHoverProvider', () => {
  const pathResolver = new BloggerPathResolver();
  const provider = new BloggerHoverProvider(pathResolver);

  function createMockDocument(lineText: string): vscode.TextDocument {
    return {
      lineAt: () => ({ text: lineText }),
    } as unknown as vscode.TextDocument;
  }

  it('should provide Hover for data: expression in document', () => {
    const text = '<b:eval expr="data:blog.title" />';
    const document = createMockDocument(text);
    const position = new vscode.Position(0, text.indexOf('blog.title'));

    const hover = provider.provideHover(document, position) as vscode.Hover;
    expect(hover).toBeDefined();
    expect(hover.range).toBeDefined();
    expect(hover.range?.start.character).toBe(text.indexOf('data:blog.title'));
    expect(hover.range?.end.character).toBe(text.indexOf('data:blog.title') + 'data:blog.title'.length);

    const markdown = hover.contents[0] as vscode.MarkdownString;
    expect(markdown.value).toContain('(data: String) **`data:blog.title`**');
    expect(markdown.value).toContain('The general name / main title of the blog.');
    expect(markdown.value).toContain('[BloggerCode Reference](https://bloggercode.orbiona.com/1978/11/data-blog-title.html)');
  });

  it('should provide Hover for <b:if> tag', () => {
    const text = '<b:if cond="data:view.isHomepage">';
    const document = createMockDocument(text);
    const position = new vscode.Position(0, text.indexOf('b:if'));

    const hover = provider.provideHover(document, position) as vscode.Hover;
    expect(hover).toBeDefined();
    const markdown = hover.contents[0] as vscode.MarkdownString;
    expect(markdown.value).toContain('(tag) **`<b:if>`**');
    expect(markdown.value).toContain('Renders child content if the condition evaluates to true.');
  });

  it('should return undefined when cursor is on non-Blogger text or standard HTML attributes', () => {
    const text = '<div class="container"><span id="title">Some plain text</span></div>';
    const document = createMockDocument(text);
    const position = new vscode.Position(0, text.indexOf('class'));

    const hover = provider.provideHover(document, position);
    expect(hover).toBeUndefined();
  });

  it('should provide hover for multi-line Blogger widget attributes', () => {
    const lines = [
      '<b:widget',
      '  id="Blog1"',
      '  type="Blog">',
    ];
    const multiDoc = {
      lineAt: (lineOrPos: number | vscode.Position) => {
        const lineNum = typeof lineOrPos === 'number' ? lineOrPos : lineOrPos.line;
        return { text: lines[lineNum] ?? '' };
      },
    } as unknown as vscode.TextDocument;

    const position = new vscode.Position(2, lines[2]!.indexOf('type'));
    const hover = provider.provideHover(multiDoc, position) as vscode.Hover;
    expect(hover).toBeDefined();
    const markdown = hover.contents[0] as vscode.MarkdownString;
    expect(markdown.value).toContain('(attribute: string) **`type`**');
  });
});
