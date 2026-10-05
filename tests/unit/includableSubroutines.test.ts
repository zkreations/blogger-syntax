import { describe, expect, it } from 'vitest';
import { BloggerPathResolver } from '../../src/core/resolver/pathResolver.js';
import { BloggerScopeTracker } from '../../src/core/scope/scopeTracker.js';

describe('includable subroutines completion', () => {
  const tracker = new BloggerScopeTracker();
  const resolver = new BloggerPathResolver();

  const xmlContent = `
<b:widget id="Blog1" type="Blog">
  <b:includable id="main">
    <b:include name=""
  </b:includable>
  <b:includable id="postList">
    <div>Posts</div>
  </b:includable>
  <b:includable id="postComments" var="post">
    <div>Comments</div>
  </b:includable>
</b:widget>

<b:widget id="Header1" type="Header">
  <b:includable id="main">
    <h1>Header</h1>
  </b:includable>
  <b:includable id="headerLogo">
    <img src="logo.png"/>
  </b:includable>
</b:widget>

<b:defaultmarkup type="Blog">
  <b:includable id="blogDefaultHelper">
    <div>Helper</div>
  </b:includable>
</b:defaultmarkup>
`;

  it('should suggest local includables from the enclosing widget and defaultmarkup', () => {
    const offset = xmlContent.indexOf('<b:include name=""') + '<b:include name="'.length;
    const includables = tracker.getAvailableIncludables('test.xml', 1, xmlContent, offset);
    const widgetType = tracker.getEnclosingWidgetType('test.xml', 1, xmlContent, offset);

    expect(widgetType).toBe('Blog');
    expect(includables.local).toContain('main');
    expect(includables.local).toContain('postList');
    expect(includables.local).toContain('postComments');
    expect(includables.defaultMarkups).toContain('blogDefaultHelper');

    // Header1's unique includables should NOT be in local
    expect(includables.local).not.toContain('headerLogo');

    const result = resolver.resolveFromLinePrefix('<b:include name="', {
      widgetType,
      includables,
    });

    expect(result).toBeDefined();
    const names = result!.suggestions.map(s => s.name);
    expect(names).toContain('main');
    expect(names).toContain('postList');
    expect(names).toContain('postComments');
    expect(names).toContain('blogDefaultHelper');
    expect(names).not.toContain('headerLogo');
  });

  it('should STRICTLY EXCLUDE super.* from all includable suggestions', () => {
    const mockIncludables = {
      local: ['main', 'customHelper', 'super.main', 'super.postList'],
      defaultMarkups: ['defaultSection', 'super.defaultSection'],
    };

    const result = resolver.resolveFromLinePrefix('<b:include name="', {
      widgetType: 'Blog',
      includables: mockIncludables,
    });

    expect(result).toBeDefined();
    const names = result!.suggestions.map(s => s.name);
    expect(names).toContain('main');
    expect(names).toContain('customHelper');
    expect(names).toContain('defaultSection');

    // Absolutely no super.* allowed
    expect(names).not.toContain('super.main');
    expect(names).not.toContain('super.postList');
    expect(names).not.toContain('super.defaultSection');
    expect(names.some(n => n.startsWith('super.'))).toBe(false);
  });
});
