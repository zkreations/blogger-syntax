import { describe, expect, it } from 'vitest';
import { findIncludableDefinition } from '../../src/core/navigation/definitionResolver.js';
import { BloggerDefinitionProvider } from '../../src/vscode/providers/definitionProvider.js';
import { MockTextDocument } from './__mocks__/vscode.js';

describe('definition resolver (F12 Go to Definition)', () => {
  const xml = `
    <b:defaultmarkups>
      <b:defaultmarkup type='Blog'>
        <b:includable id='sharedHeader'>
          <h1>Shared</h1>
        </b:includable>
      </b:defaultmarkup>
    </b:defaultmarkups>

    <b:section id='main' tag='main'>
      <b:widget id='Blog1' type='Blog' title='Blog Posts'>
        <b:includable id='main' var='this'>
          <b:include name='postComments' data='post'/>
          <b:include name='sharedHeader'/>
          <b:include name='super.main'/>
        </b:includable>
        <b:includable id='postComments' var='post'>
          <div class='comments'>Comments</div>
        </b:includable>
      </b:widget>

      <b:widget id='Header1' type='Header' title='Site Header'>
        <b:includable id='main'>
          <h2>Header</h2>
        </b:includable>
      </b:widget>
    </b:section>
  `;

  it('jumps from <b:include name="postComments"/> to <b:includable id="postComments"> in the same widget', () => {
    const includeIndex = xml.indexOf('name=\'postComments\'');
    expect(includeIndex).toBeGreaterThan(-1);

    const cursorOffset = includeIndex + 8; // inside 'postComments'
    const result = findIncludableDefinition(xml, cursorOffset);

    expect(result).toBeDefined();
    expect(result?.targetId).toBe('postComments');

    const expectedIncludable = xml.indexOf('<b:includable id=\'postComments\'');
    expect(result?.targetSpan.start).toBe(expectedIncludable);

    const expectedIdStart = xml.indexOf('\'postComments\'', expectedIncludable) + 1;
    expect(result?.targetSelectionSpan.start).toBe(expectedIdStart);
  });

  it('resolves widget-local includable when multiple widgets have the same includable id="main"', () => {
    // In Header1, find an include (let's test with a simulated include inside Header1)
    const xmlHeader = `
      <b:widget id='Blog1' type='Blog'>
        <b:includable id='main'>Blog Main</b:includable>
      </b:widget>
      <b:widget id='Header1' type='Header'>
        <b:includable id='main'>Header Main</b:includable>
        <b:includable id='sub'>
          <b:include name='main'/>
        </b:includable>
      </b:widget>
    `;

    const includePos = xmlHeader.indexOf('name=\'main\'');
    const result = findIncludableDefinition(xmlHeader, includePos + 7);

    expect(result).toBeDefined();
    expect(result?.targetId).toBe('main');

    // Must jump to Header1's main, not Blog1's main
    const headerMainPos = xmlHeader.indexOf('<b:includable id=\'main\'>Header Main');
    expect(result?.targetSpan.start).toBe(headerMainPos);
  });

  it('falls back to <b:defaultmarkup type="Blog"> when includable is not declared in widget', () => {
    const includeIndex = xml.indexOf('name=\'sharedHeader\'');
    const cursorOffset = includeIndex + 8;
    const result = findIncludableDefinition(xml, cursorOffset);

    expect(result).toBeDefined();
    expect(result?.targetId).toBe('sharedHeader');

    const sharedHeaderPos = xml.indexOf('<b:includable id=\'sharedHeader\'');
    expect(result?.targetSpan.start).toBe(sharedHeaderPos);
  });

  it('returns undefined for native platform calls starting with super.', () => {
    const includeIndex = xml.indexOf('name=\'super.main\'');
    const cursorOffset = includeIndex + 8;
    const result = findIncludableDefinition(xml, cursorOffset);

    expect(result).toBeUndefined();
  });

  it('returns undefined when cursor is outside any <b:include> tag', () => {
    const result = findIncludableDefinition(xml, 10);
    expect(result).toBeUndefined();
  });

  it('falls back to <b:defaultmarkup type="Common"> when includable is not declared in widget or typed markup', () => {
    const xmlWithCommon = `
      <b:defaultmarkups>
        <b:defaultmarkup type='Common'>
          <b:includable id='universalHeader'>
            <header>Universal</header>
          </b:includable>
        </b:defaultmarkup>
      </b:defaultmarkups>
      <b:widget id='Blog1' type='Blog'>
        <b:includable id='main'>
          <b:include name='universalHeader'/>
        </b:includable>
      </b:widget>
    `;
    const includeIndex = xmlWithCommon.indexOf('name=\'universalHeader\'');
    const result = findIncludableDefinition(xmlWithCommon, includeIndex + 8);

    expect(result).toBeDefined();
    expect(result?.targetId).toBe('universalHeader');
    const expectedPos = xmlWithCommon.indexOf('<b:includable id=\'universalHeader\'');
    expect(result?.targetSpan.start).toBe(expectedPos);
  });

  it('ignores definitions commented out via <b:comment>', () => {
    const xmlWithComment = `
      <b:comment>
        <b:widget id='Ghost' type='Blog'>
          <b:includable id='ghostSub'>Ghost</b:includable>
        </b:widget>
      </b:comment>
      <b:widget id='Real' type='Blog'>
        <b:includable id='main'>
          <b:include name='ghostSub'/>
        </b:includable>
      </b:widget>
    `;
    const includeIndex = xmlWithComment.indexOf('name=\'ghostSub\'');
    const result = findIncludableDefinition(xmlWithComment, includeIndex + 8);
    expect(result).toBeUndefined();
  });

  it('integrates with VS Code BloggerDefinitionProvider returning LocationLinks', () => {
    const doc = new MockTextDocument(xml) as any;
    const provider = new BloggerDefinitionProvider();

    const includeIndex = xml.indexOf('name=\'postComments\'');
    const pos = doc.positionAt(includeIndex + 8);

    const locations = provider.provideDefinition(doc, pos) as any[];
    expect(locations).toBeDefined();
    expect(locations).toHaveLength(1);

    const loc = locations[0];
    expect(loc.originSelectionRange).toBeDefined();
    expect(loc.targetRange).toBeDefined();
    expect(loc.targetSelectionRange).toBeDefined();
  });

  it('resolves <b:include name="test"/> to the latest definition when overridden across multiple <b:defaultmarkups> blocks', () => {
    const xmlOverride = `
      <b:defaultmarkups>
        <b:defaultmarkup type='Common'>
          <b:includable id="test">
            <!-- Esto es una prueba -->
          </b:includable>
        </b:defaultmarkup>
      </b:defaultmarkups>

      <b:include name="test"/>

      <b:defaultmarkups>
        <b:defaultmarkup type='Common'>
          <b:includable id="test">
            <!-- Sobreescritura -->
          </b:includable>
        </b:defaultmarkup>
      </b:defaultmarkups>
    `;

    const includePos = xmlOverride.indexOf('name="test"');
    const result = findIncludableDefinition(xmlOverride, includePos + 7);

    expect(result).toBeDefined();
    expect(result?.targetId).toBe('test');

    const lastIncludablePos = xmlOverride.lastIndexOf('<b:includable id="test"');
    expect(result?.targetSpan.start).toBe(lastIncludablePos);
  });

  it('resolves typed defaultmarkup overrides across separate <b:defaultmarkups> blocks for matching widgets', () => {
    const xmlTypedOverride = `
      <b:defaultmarkups>
        <b:defaultmarkup type='Blog'>
          <b:includable id="postHelper">
            <div>Old Helper</div>
          </b:includable>
        </b:defaultmarkup>
      </b:defaultmarkups>

      <b:widget id='Blog1' type='Blog'>
        <b:includable id='main'>
          <b:include name="postHelper"/>
        </b:includable>
      </b:widget>

      <b:defaultmarkups>
        <b:defaultmarkup type='Blog'>
          <b:includable id="postHelper">
            <div>New Helper (Override)</div>
          </b:includable>
        </b:defaultmarkup>
      </b:defaultmarkups>
    `;

    const includePos = xmlTypedOverride.indexOf('name="postHelper"');
    const result = findIncludableDefinition(xmlTypedOverride, includePos + 7);

    expect(result).toBeDefined();
    expect(result?.targetId).toBe('postHelper');

    const expectedPos = xmlTypedOverride.lastIndexOf('<b:includable id="postHelper"');
    expect(result?.targetSpan.start).toBe(expectedPos);
  });

  it('preserves local widget includable priority over subsequent <b:defaultmarkups> blocks', () => {
    const xmlLocalPriority = `
      <b:widget id='Blog1' type='Blog'>
        <b:includable id='header'>
          <div>Widget Local Header</div>
        </b:includable>
        <b:includable id='main'>
          <b:include name="header"/>
        </b:includable>
      </b:widget>

      <b:defaultmarkups>
        <b:defaultmarkup type='Blog'>
          <b:includable id="header">
            <div>Defaultmarkup Header</div>
          </b:includable>
        </b:defaultmarkup>
      </b:defaultmarkups>
    `;

    const includePos = xmlLocalPriority.indexOf('name="header"');
    const result = findIncludableDefinition(xmlLocalPriority, includePos + 7);

    expect(result).toBeDefined();
    expect(result?.targetId).toBe('header');

    const localHeaderPos = xmlLocalPriority.indexOf('<b:includable id=\'header\'>');
    expect(result?.targetSpan.start).toBe(localHeaderPos);
  });

  it('returns undefined for dynamic inclusions using expr:name', () => {
    const xmlExpr = `
      <b:widget id='Blog1' type='Blog'>
        <b:includable id='main'>
          <b:include expr:name='data:post.format'/>
        </b:includable>
      </b:widget>
    `;
    const includePos = xmlExpr.indexOf('expr:name');
    const result = findIncludableDefinition(xmlExpr, includePos + 12);
    expect(result).toBeUndefined();
  });
});
