import { describe, expect, it } from 'vitest';
import { indexDocumentSymbols } from '../../src/core/navigation/symbolIndexer.js';
import { BloggerDocumentSymbolProvider } from '../../src/vscode/providers/documentSymbolProvider.js';
import { MockTextDocument, SymbolKind } from './__mocks__/vscode.js';

describe('document symbol indexer (Outline & Breadcrumbs)', () => {
  const xml = `
    <b:skin><![CDATA[body { margin: 0; }]]></b:skin>

    <b:defaultmarkups>
      <b:defaultmarkup type='Blog'>
        <b:includable id='header'>Header</b:includable>
      </b:defaultmarkup>
    </b:defaultmarkups>

    <b:section id='main' tag='main'>
      <b:widget id='Blog1' type='Blog' title='Main Blog'>
        <b:widget-settings>
          <b:widget-setting name='postsPerPage'>10</b:widget-setting>
        </b:widget-settings>
        <b:includable id='main' var='this'>
          <div>Content</div>
        </b:includable>
        <b:includable id='comments' var='post'>
          <div>Comments</div>
        </b:includable>
      </b:widget>

      <b:widget id='Header1' type='Header' title='Site Header'>
        <b:includable id='main'>
          <h1>Title</h1>
        </b:includable>
      </b:widget>
    </b:section>
  `;

  it('indexes document symbols hierarchically from sections down to includables', () => {
    const symbols = indexDocumentSymbols(xml);

    // Root nodes: skin, defaultmarkups, section
    expect(symbols.map(s => s.kind)).toEqual(['skin', 'defaultmarkups', 'section']);

    const skinNode = symbols[0]!;
    expect(skinNode.name).toBe('b:skin');
    expect(skinNode.children).toHaveLength(0);

    const defaultMarkups = symbols[1]!;
    expect(defaultMarkups.kind).toBe('defaultmarkups');
    expect(defaultMarkups.children).toHaveLength(1);

    const defaultMarkupBlog = defaultMarkups.children[0]!;
    expect(defaultMarkupBlog.kind).toBe('defaultmarkup');
    expect(defaultMarkupBlog.name).toBe('defaultmarkup (Blog)');
    expect(defaultMarkupBlog.children).toHaveLength(1);
    expect(defaultMarkupBlog.children[0]?.name).toBe('header');

    const section = symbols[2]!;
    expect(section.kind).toBe('section');
    expect(section.name).toBe('main');
    expect(section.detail).toBe('<b:section tag="main">');
    expect(section.children).toHaveLength(2); // Blog1, Header1

    const blogWidget = section.children[0]!;
    expect(blogWidget.kind).toBe('widget');
    expect(blogWidget.name).toBe('Blog1 (Blog)');
    expect(blogWidget.detail).toBe('"Main Blog"');
    expect(blogWidget.children).toHaveLength(3); // settings, main, comments

    const settings = blogWidget.children[0]!;
    expect(settings.kind).toBe('settings');

    const mainInc = blogWidget.children[1]!;
    expect(mainInc.kind).toBe('includable');
    expect(mainInc.name).toBe('main(this)');

    const commentsInc = blogWidget.children[2]!;
    expect(commentsInc.kind).toBe('includable');
    expect(commentsInc.name).toBe('comments(post)');

    const headerWidget = section.children[1]!;
    expect(headerWidget.kind).toBe('widget');
    expect(headerWidget.name).toBe('Header1 (Header)');
    expect(headerWidget.children).toHaveLength(1);
    expect(headerWidget.children[0]?.name).toBe('main');
  });

  it('masks comments and CDATA preventing false positive symbols', () => {
    const commentedXml = `
      <!-- <b:section id='commentedSec'></b:section> -->
      <b:section id='activeSec'>
        <b:widget id='W1' type='HTML'>
          <![CDATA[ <b:includable id='cdataInc'/> ]]>
          <b:includable id='realInc'/>
        </b:widget>
      </b:section>
    `;

    const symbols = indexDocumentSymbols(commentedXml);
    expect(symbols).toHaveLength(1);
    expect(symbols[0]?.name).toBe('activeSec');

    const widget = symbols[0]?.children[0];
    expect(widget?.children).toHaveLength(1);
    expect(widget?.children[0]?.name).toBe('realInc');
  });

  it('ignores directives commented out via <b:comment>', () => {
    const xmlComment = `
      <b:comment>
        <b:section id='ghostSec'>
          <b:widget id='ghostWidget' type='Blog'/>
        </b:section>
      </b:comment>
      <b:section id='realSec'/>
    `;
    const symbols = indexDocumentSymbols(xmlComment);
    expect(symbols).toHaveLength(1);
    expect(symbols[0]?.name).toBe('realSec');
  });

  it('integrates with VS Code BloggerDocumentSymbolProvider mapping correct SymbolKinds', () => {
    const doc = new MockTextDocument(xml) as any;
    const provider = new BloggerDocumentSymbolProvider();

    const result = provider.provideDocumentSymbols(doc) as any[];
    expect(result).toBeDefined();
    expect(result).toHaveLength(3);

    const skinSymbol = result[0];
    expect(skinSymbol.kind).toBe(SymbolKind.Property);

    const sectionSymbol = result[2];
    expect(sectionSymbol.kind).toBe(SymbolKind.Namespace);
    expect(sectionSymbol.children).toHaveLength(2);

    const widgetSymbol = sectionSymbol.children[0];
    expect(widgetSymbol.kind).toBe(SymbolKind.Class);
    expect(widgetSymbol.children).toHaveLength(3);

    const includableSymbol = widgetSymbol.children[1];
    expect(includableSymbol.kind).toBe(SymbolKind.Function);
  });
});
