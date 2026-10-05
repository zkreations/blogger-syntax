import { describe, expect, it } from 'vitest';
import { BloggerPathResolver } from '../../src/core/resolver/pathResolver.js';

describe('widget settings autocompletion and hover', () => {
  const resolver = new BloggerPathResolver();

  it('should suggest canonical settings for Blog widget and exclude deprecated settings', () => {
    const result = resolver.resolveFromLinePrefix('<b:widget-setting name="', {
      widgetType: 'Blog',
    });
    expect(result).toBeDefined();
    const names = result!.suggestions.map(s => s.name);

    expect(names).toContain('authorLabel');
    expect(names).toContain('commentLabel');
    expect(names).toContain('postLabelsLabel');
    expect(names).toContain('postLocationLabel');
    expect(names).toContain('postsPerAd');
    expect(names).toContain('showAuthor');
    expect(names).toContain('showCommentLink');
    expect(names).toContain('showDateHeader');
    expect(names).toContain('showInlineAds');
    expect(names).toContain('showLabels');
    expect(names).toContain('showLocation');
    expect(names).toContain('showShareButtons');
    expect(names).toContain('showTimestamp');
    expect(names).toContain('style.layout');

    // Strict exclusion of deprecated settings
    expect(names).not.toContain('style.bgcolor');
    expect(names).not.toContain('style.bordercolor');
    expect(names).not.toContain('style.linkcolor');
    expect(names).not.toContain('style.textcolor');
    expect(names).not.toContain('style.unittype');
    expect(names).not.toContain('style.urlcolor');
    expect(names).not.toContain('reactionsLabel');
    expect(names).not.toContain('showReactions');
    expect(names).not.toContain('backlinksLabel');
    expect(names).not.toContain('showBacklinks');
    expect(names).not.toContain('disableGooglePlusShare');
  });

  it('should suggest canonical settings for AdSense widget and exclude deprecated settings', () => {
    const result = resolver.resolveFromLinePrefix('<b:widget-setting name="', {
      widgetType: 'AdSense',
    });
    expect(result).toBeDefined();
    const names = result!.suggestions.map(s => s.name);

    expect(names).toEqual(['style.layout']);
    expect(names).not.toContain('style.bgcolor');
    expect(names).not.toContain('style.bordercolor');
    expect(names).not.toContain('style.linkcolor');
    expect(names).not.toContain('style.textcolor');
  });

  it('should suggest canonical settings for PopularPosts widget', () => {
    const result = resolver.resolveFromLinePrefix('<b:widget-setting name="', {
      widgetType: 'PopularPosts',
    });
    expect(result).toBeDefined();
    const names = result!.suggestions.map(s => s.name);

    expect(names).toContain('numItemsToShow');
    expect(names).toContain('showSnippets');
    expect(names).toContain('showThumbnails');
    expect(names).toContain('timeRange');
  });

  it('should suggest canonical settings for FeaturedPost widget', () => {
    const result = resolver.resolveFromLinePrefix('<b:widget-setting name="', {
      widgetType: 'FeaturedPost',
    });
    expect(result).toBeDefined();
    const names = result!.suggestions.map(s => s.name);

    expect(names).toContain('postId');
    expect(names).toContain('showFirstImage');
    expect(names).toContain('showPostTitle');
    expect(names).toContain('showSnippet');
    expect(names).toContain('useMostRecentPost');
  });

  it('should show hover card for widget-setting name value', () => {
    const line = '<b:widget-setting name="showDateHeader">true</b:widget-setting>';
    const hover = resolver.resolveHoverAtPosition(line, line.indexOf('showDateHeader') + 2, undefined, {
      widgetType: 'Blog',
    });
    expect(hover).toBeDefined();
    expect(hover?.hover.title).toContain('showDateHeader');
    expect(hover?.hover.title).toContain('Blog Setting');
    expect(hover?.hover.description).toContain('Toggle grouping and display of post date headers');
  });
});
