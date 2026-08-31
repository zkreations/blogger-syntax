/**
 * Blogger Widget types supported by Blogger themes
 * Reference: https://bloggercode.orbiona.com/2016/03/tag-b-widget.html
 */
export const bloggerWidgetTypes: readonly string[] = [
  'AdSense',
  'Attribution',
  'Blog',
  'BlogArchive',
  'BloggerButton',
  'BlogList',
  'BlogSearch',
  'ContactForm',
  'FeaturedPost',
  'Feed',
  'Followers',
  'Header',
  'HTML',
  'Image',
  'Label',
  'LinkList',
  'PageList',
  'PopularPosts',
  'Profile',
  'Stats',
  'Subscribe',
  'Text',
  'TextList',
  'Translate',
  'Wikipedia',
] as const;

/**
 * Blogger Default Markup types supported by b:defaultmarkup
 * Reference: https://bloggercode.orbiona.com/2017/05/tag-b-defaultmarkups.html
 */
export const bloggerDefaultMarkupTypes: readonly string[] = [
  'All',
  'Common',
  ...bloggerWidgetTypes,
] as const;

export interface WidgetTypeInfo {
  readonly description: string;
  readonly docUrl?: string | readonly string[];
}

export const bloggerWidgetTypeDetails: Record<string, WidgetTypeInfo> = {
  AdSense: {
    description: 'AdSense widget for displaying Google advertisement units.',
    docUrl: 'https://bloggercode.orbiona.com/1979/08/Ressource-AdSense.html',
  },
  Attribution: {
    description: 'Attribution widget displaying copyright and template attribution.',
    docUrl: 'https://bloggercode.orbiona.com/1979/08/Ressource-Attribution.html',
  },
  Blog: {
    description: 'Main Blog widget displaying post listings, articles, comments, and pager.',
    docUrl: 'https://bloggercode.orbiona.com/1979/07/Ressource-Blog.html',
  },
  BlogArchive: {
    description: 'BlogArchive widget displaying chronological post history and monthly archives.',
    docUrl: 'https://bloggercode.orbiona.com/1979/07/Ressource-BlogArchive.html',
  },
  BloggerButton: {
    description: 'BloggerButton widget displaying the official Blogger logo badge.',
    docUrl: 'https://bloggercode.orbiona.com/1979/07/Ressource-BloggerButton.html',
  },
  BlogList: {
    description: 'BlogList widget displaying a list of bookmarked blogs and recent updates.',
    docUrl: 'https://bloggercode.orbiona.com/1979/07/Ressource-BlogList.html',
  },
  BlogSearch: {
    description: 'BlogSearch widget for search queries within the blog.',
    docUrl: 'https://bloggercode.orbiona.com/1979/07/Ressources-CustomSearch.html',
  },
  ContactForm: {
    description: 'ContactForm widget enabling visitors to send messages directly to blog admins.',
    docUrl: 'https://bloggercode.orbiona.com/1979/07/Ressource-ContactForm.html',
  },
  FeaturedPost: {
    description: 'FeaturedPost widget displaying a pinned or highlighted article.',
    docUrl: 'https://bloggercode.orbiona.com/1979/07/Ressource-FeaturedPost.html',
  },
  Feed: {
    description: 'Feed widget aggregating and rendering external RSS or Atom feed entries.',
    docUrl: 'https://bloggercode.orbiona.com/1979/07/Ressources-Feed.html',
  },
  Followers: {
    description: 'Followers widget showing blog subscriber avatars via Google Friend Connect.',
    docUrl: 'https://bloggercode.orbiona.com/1979/07/Ressource-Followers.html',
  },
  Header: {
    description: 'Header widget displaying the blog title, description, and header image.',
    docUrl: 'https://bloggercode.orbiona.com/1979/07/Ressource-Header.html',
  },
  HTML: {
    description: 'HTML widget containing custom HTML, CSS, and JavaScript snippets.',
    docUrl: 'https://bloggercode.orbiona.com/1979/08/Ressource-HTML-Text.html',
  },
  Image: {
    description: 'Image widget for rendering a standalone image with optional caption and link.',
    docUrl: 'https://bloggercode.orbiona.com/1979/07/Ressource-Image.html',
  },
  Label: {
    description: 'Label widget displaying categories/tags as a list or cloud.',
    docUrl: 'https://bloggercode.orbiona.com/1979/07/Ressource-Label.html',
  },
  LinkList: {
    description: 'LinkList widget displaying a collection of custom navigational hyperlinks.',
    docUrl: 'https://bloggercode.orbiona.com/1979/07/Ressource-LinkList.html',
  },
  PageList: {
    description: 'PageList widget rendering navigation links for static standalone pages.',
    docUrl: 'https://bloggercode.orbiona.com/1979/07/Ressource-PageList.html',
  },
  PopularPosts: {
    description: 'PopularPosts widget displaying top-performing or most viewed articles.',
    docUrl: 'https://bloggercode.orbiona.com/1979/07/Ressource-PopularPosts.html',
  },
  Profile: {
    description: 'Profile widget rendering blog author biographical details and avatar.',
    docUrl: 'https://bloggercode.orbiona.com/1979/07/Ressource-Profile.html',
  },
  Stats: {
    description: 'Stats widget rendering total visitor counts and pageview statistics.',
    docUrl: 'https://bloggercode.orbiona.com/1979/07/Ressource-Stats.html',
  },
  Subscribe: {
    description: 'Subscribe widget for newsletter and feed subscription links.',
    docUrl: 'https://bloggercode.orbiona.com/1979/07/Ressource-Subscribe.html',
  },
  Text: {
    description: 'Text widget displaying formatted text paragraphs or notices.',
    docUrl: 'https://bloggercode.orbiona.com/1979/08/Ressource-HTML-Text.html',
  },
  TextList: {
    description: 'TextList widget displaying a bulleted list of text items.',
    docUrl: 'https://bloggercode.orbiona.com/1979/07/Ressource-TextList.html',
  },
  Translate: {
    description: 'Translate widget integrating Google Translate dropdown switcher.',
    docUrl: 'https://bloggercode.orbiona.com/1979/07/Ressource-Translate.html',
  },
  Wikipedia: {
    description: 'Wikipedia widget offering an in-page search lookup box for Wikipedia.',
    docUrl: 'https://bloggercode.orbiona.com/1979/07/Ressource-Wikipedia.html',
  },
};

export const bloggerDefaultMarkupTypeDetails: Record<string, WidgetTypeInfo> = {
  All: {
    description: 'Defines default includables applied globally to all widget types.',
    docUrl: 'https://bloggercode.orbiona.com/2017/05/tag-b-defaultmarkups.html',
  },
  Common: {
    description: 'Defines common default includables shared across multiple widgets.',
    docUrl: 'https://bloggercode.orbiona.com/2017/05/tag-b-defaultmarkups.html',
  },
};
