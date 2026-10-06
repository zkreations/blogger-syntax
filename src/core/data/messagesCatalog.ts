import type { BloggerDataType, BloggerSuggestion } from '../models/types.js';

export interface SystemMessageParamDefinition {
  readonly name: string;
  readonly position: number;
  readonly description: string;
  readonly exampleValue: string;
}

export interface SystemMessageDefinition {
  readonly key: string;
  readonly canonicalName: string;
  readonly description: string;
  readonly isParameterized: boolean;
  readonly params?: readonly SystemMessageParamDefinition[];
}

export const PARAMETERIZED_MESSAGE_KEYS = new Set<string>([
  'authorSaid',
  'postedByAuthor',
  'authorSaidWithLink',
  'postedByAuthorLink',
  'byAuthor',
  'poweredByBloggerLink',
  'byAuthorLink',
  'templateImagesBy',
  'numberOfComments',
  'templateImagesByLink',
]);

export const systemMessagesCatalog: Record<string, SystemMessageDefinition> = {
  adsGoHere: {
    key: 'adsGoHere',
    canonicalName: 'messages.adsGoHere',
    description: 'Ad placeholder banner notice.',
    isParameterized: false,
  },
  archive: {
    key: 'archive',
    canonicalName: 'messages.archive',
    description: 'Blog archive label (\'Archive\').',
    isParameterized: false,
  },
  at: {
    key: 'at',
    canonicalName: 'messages.at',
    description: 'Time preposition (\'at\').',
    isParameterized: false,
  },
  authorSaid: {
    key: 'authorSaid',
    canonicalName: 'messages.authorSaid',
    description: 'Comment author attribution quote (\'Author said...\'). Direct tag invocation prohibited; requires <b:message>.',
    isParameterized: true,
    params: [{ name: 'authorName', position: 1, description: 'Author display name placeholder.', exampleValue: 'Author' }],
  },
  authorSaidWithLink: {
    key: 'authorSaidWithLink',
    canonicalName: 'messages.authorSaidWithLink',
    description: 'Comment author quote with HTML anchor markup. Direct tag invocation prohibited; requires <b:message>.',
    isParameterized: true,
    params: [{ name: 'authorName', position: 1, description: 'Author display name placeholder.', exampleValue: 'Author' }, { name: 'authorUrl', position: 2, description: 'Author profile URL placeholder.', exampleValue: 'https://www.blogger.com/profile/...' }],
  },
  blogArchive: {
    key: 'blogArchive',
    canonicalName: 'messages.blogArchive',
    description: 'BlogArchive widget title (\'Blog Archive\').',
    isParameterized: false,
  },
  blogAuthors: {
    key: 'blogAuthors',
    canonicalName: 'messages.blogAuthors',
    description: 'Blog authors header label.',
    isParameterized: false,
  },
  by: {
    key: 'by',
    canonicalName: 'messages.by',
    description: 'Author preposition (\'by\').',
    isParameterized: false,
  },
  byAuthor: {
    key: 'byAuthor',
    canonicalName: 'messages.byAuthor',
    description: 'Attribution phrase (\'by author\'). Direct tag invocation prohibited; requires <b:message>.',
    isParameterized: true,
    params: [{ name: 'authorName', position: 1, description: 'Author display name placeholder.', exampleValue: 'Author' }],
  },
  byAuthorLink: {
    key: 'byAuthorLink',
    canonicalName: 'messages.byAuthorLink',
    description: 'Attribution phrase with author profile anchor. Direct tag invocation prohibited; requires <b:message>.',
    isParameterized: true,
    params: [{ name: 'authorName', position: 1, description: 'Author display name placeholder.', exampleValue: 'Author' }, { name: 'authorUrl', position: 2, description: 'Author profile URL placeholder.', exampleValue: 'https://www.blogger.com/profile/...' }],
  },
  comments: {
    key: 'comments',
    canonicalName: 'messages.comments',
    description: 'Comments count or section title (\'Comments\').',
    isParameterized: false,
  },
  configurationRequired: {
    key: 'configurationRequired',
    canonicalName: 'messages.configurationRequired',
    description: 'Widget setup requirement prompt.',
    isParameterized: false,
  },
  copy: {
    key: 'copy',
    canonicalName: 'messages.copy',
    description: 'Copy action button label.',
    isParameterized: false,
  },
  copyToClipboard: {
    key: 'copyToClipboard',
    canonicalName: 'messages.copyToClipboard',
    description: 'Copy to clipboard action label.',
    isParameterized: false,
  },
  deleteComment: {
    key: 'deleteComment',
    canonicalName: 'messages.deleteComment',
    description: 'Delete comment moderation button label.',
    isParameterized: false,
  },
  dynamicViewsNotAvailable: {
    key: 'dynamicViewsNotAvailable',
    canonicalName: 'messages.dynamicViewsNotAvailable',
    description: 'Dynamic Views unavailable warning text.',
    isParameterized: false,
  },
  edit: {
    key: 'edit',
    canonicalName: 'messages.edit',
    description: 'Quick-edit item action link.',
    isParameterized: false,
  },
  emailAddress: {
    key: 'emailAddress',
    canonicalName: 'messages.emailAddress',
    description: 'Email input field label / placeholder.',
    isParameterized: false,
  },
  emailPost: {
    key: 'emailPost',
    canonicalName: 'messages.emailPost',
    description: 'Share via email button label.',
    isParameterized: false,
  },
  euCookieNotice: {
    key: 'euCookieNotice',
    canonicalName: 'messages.euCookieNotice',
    description: 'European Union cookie consent banner text.',
    isParameterized: false,
  },
  euCookieNotice2018: {
    key: 'euCookieNotice2018',
    canonicalName: 'messages.euCookieNotice2018',
    description: 'Updated EU cookie notice text.',
    isParameterized: false,
  },
  euCookieNoticeCloseButton: {
    key: 'euCookieNoticeCloseButton',
    canonicalName: 'messages.euCookieNoticeCloseButton',
    description: 'Cookie consent banner close button label.',
    isParameterized: false,
  },
  euCookieResponsibility: {
    key: 'euCookieResponsibility',
    canonicalName: 'messages.euCookieResponsibility',
    description: 'Cookie compliance disclaimer statement.',
    isParameterized: false,
  },
  euCookieResponsibility2018: {
    key: 'euCookieResponsibility2018',
    canonicalName: 'messages.euCookieResponsibility2018',
    description: 'Updated cookie compliance disclaimer statement.',
    isParameterized: false,
  },
  featured: {
    key: 'featured',
    canonicalName: 'messages.featured',
    description: 'Featured post badge / header label.',
    isParameterized: false,
  },
  getEmailNotifications: {
    key: 'getEmailNotifications',
    canonicalName: 'messages.getEmailNotifications',
    description: 'Email subscription call to action.',
    isParameterized: false,
  },
  gotIt: {
    key: 'gotIt',
    canonicalName: 'messages.gotIt',
    description: 'Confirmation dismissal button (\'Got it\').',
    isParameterized: false,
  },
  hidden: {
    key: 'hidden',
    canonicalName: 'messages.hidden',
    description: 'Hidden state label.',
    isParameterized: false,
  },
  home: {
    key: 'home',
    canonicalName: 'messages.home',
    description: 'Root homepage navigation label (\'Home\').',
    isParameterized: false,
  },
  image: {
    key: 'image',
    canonicalName: 'messages.image',
    description: 'Generic image label / alt placeholder.',
    isParameterized: false,
  },
  joinTheConversation: {
    key: 'joinTheConversation',
    canonicalName: 'messages.joinTheConversation',
    description: 'Comment section header invitation.',
    isParameterized: false,
  },
  keepReading: {
    key: 'keepReading',
    canonicalName: 'messages.keepReading',
    description: 'Post continuation teaser link (\'Keep reading\').',
    isParameterized: false,
  },
  labels: {
    key: 'labels',
    canonicalName: 'messages.labels',
    description: 'Post labels / tags header label.',
    isParameterized: false,
  },
  latestPosts: {
    key: 'latestPosts',
    canonicalName: 'messages.latestPosts',
    description: 'Latest posts widget heading.',
    isParameterized: false,
  },
  learnMore: {
    key: 'learnMore',
    canonicalName: 'messages.learnMore',
    description: 'Informational link label (\'Learn more\').',
    isParameterized: false,
  },
  linkCopiedToClipboard: {
    key: 'linkCopiedToClipboard',
    canonicalName: 'messages.linkCopiedToClipboard',
    description: 'Copy confirmation toast notice.',
    isParameterized: false,
  },
  loadMorePosts: {
    key: 'loadMorePosts',
    canonicalName: 'messages.loadMorePosts',
    description: 'Infinite scroll / load more button label.',
    isParameterized: false,
  },
  loading: {
    key: 'loading',
    canonicalName: 'messages.loading',
    description: 'Asynchronous loading status text.',
    isParameterized: false,
  },
  moreEllipsis: {
    key: 'moreEllipsis',
    canonicalName: 'messages.moreEllipsis',
    description: 'Truncation ellipsis continuation (\'...\').',
    isParameterized: false,
  },
  morePosts: {
    key: 'morePosts',
    canonicalName: 'messages.morePosts',
    description: 'Pagination action label (\'More posts\').',
    isParameterized: false,
  },
  myBlogList: {
    key: 'myBlogList',
    canonicalName: 'messages.myBlogList',
    description: 'BlogList widget default title.',
    isParameterized: false,
  },
  myFavoriteSites: {
    key: 'myFavoriteSites',
    canonicalName: 'messages.myFavoriteSites',
    description: 'Favorite sites widget heading.',
    isParameterized: false,
  },
  myPhoto: {
    key: 'myPhoto',
    canonicalName: 'messages.myPhoto',
    description: 'Author profile avatar label.',
    isParameterized: false,
  },
  newer: {
    key: 'newer',
    canonicalName: 'messages.newer',
    description: 'Newer pagination link label (\'Newer\').',
    isParameterized: false,
  },
  newerPosts: {
    key: 'newerPosts',
    canonicalName: 'messages.newerPosts',
    description: 'Newer posts pagination link (\'Newer posts\').',
    isParameterized: false,
  },
  newest: {
    key: 'newest',
    canonicalName: 'messages.newest',
    description: 'Newest pagination link label (\'Newest\').',
    isParameterized: false,
  },
  noResultsFound: {
    key: 'noResultsFound',
    canonicalName: 'messages.noResultsFound',
    description: 'Empty search results notice.',
    isParameterized: false,
  },
  noTitle: {
    key: 'noTitle',
    canonicalName: 'messages.noTitle',
    description: 'Fallback title for untitled posts (\'No title\').',
    isParameterized: false,
  },
  numberOfComments: {
    key: 'numberOfComments',
    canonicalName: 'messages.numberOfComments',
    description: 'Comment counter display template. Direct tag invocation prohibited; requires <b:message>.',
    isParameterized: true,
    params: [{ name: 'numComments', position: 1, description: 'Total number of comments placeholder.', exampleValue: '1' }],
  },
  ok: {
    key: 'ok',
    canonicalName: 'messages.ok',
    description: 'Confirmation button label (\'OK\').',
    isParameterized: false,
  },
  older: {
    key: 'older',
    canonicalName: 'messages.older',
    description: 'Older pagination link label (\'Older\').',
    isParameterized: false,
  },
  olderPosts: {
    key: 'olderPosts',
    canonicalName: 'messages.olderPosts',
    description: 'Older posts pagination link (\'Older posts\').',
    isParameterized: false,
  },
  oldest: {
    key: 'oldest',
    canonicalName: 'messages.oldest',
    description: 'Oldest pagination link label (\'Oldest\').',
    isParameterized: false,
  },
  on: {
    key: 'on',
    canonicalName: 'messages.on',
    description: 'Date preposition (\'on\').',
    isParameterized: false,
  },
  onlyTeamMembersCanComment: {
    key: 'onlyTeamMembersCanComment',
    canonicalName: 'messages.onlyTeamMembersCanComment',
    description: 'Restricted commenting notice.',
    isParameterized: false,
  },
  photo: {
    key: 'photo',
    canonicalName: 'messages.photo',
    description: 'Generic photo label.',
    isParameterized: false,
  },
  popularPosts: {
    key: 'popularPosts',
    canonicalName: 'messages.popularPosts',
    description: 'PopularPosts widget header label.',
    isParameterized: false,
  },
  popularPostsFromThisBlog: {
    key: 'popularPostsFromThisBlog',
    canonicalName: 'messages.popularPostsFromThisBlog',
    description: 'Popular posts descriptive header.',
    isParameterized: false,
  },
  postAComment: {
    key: 'postAComment',
    canonicalName: 'messages.postAComment',
    description: 'Comment form submission header.',
    isParameterized: false,
  },
  postLink: {
    key: 'postLink',
    canonicalName: 'messages.postLink',
    description: 'Post permalink action link label.',
    isParameterized: false,
  },
  postedBy: {
    key: 'postedBy',
    canonicalName: 'messages.postedBy',
    description: 'Post author attribution prefix (\'Posted by\').',
    isParameterized: false,
  },
  postedByAuthor: {
    key: 'postedByAuthor',
    canonicalName: 'messages.postedByAuthor',
    description: 'Author attribution display string. Direct tag invocation prohibited; requires <b:message>.',
    isParameterized: true,
    params: [{ name: 'authorName', position: 1, description: 'Author display name placeholder.', exampleValue: 'Author' }],
  },
  postedByAuthorLink: {
    key: 'postedByAuthorLink',
    canonicalName: 'messages.postedByAuthorLink',
    description: 'Author attribution with HTML anchor. Direct tag invocation prohibited; requires <b:message>.',
    isParameterized: true,
    params: [{ name: 'authorName', position: 1, description: 'Author display name placeholder.', exampleValue: 'Author' }, { name: 'authorUrl', position: 2, description: 'Author profile URL placeholder.', exampleValue: 'https://www.blogger.com/profile/...' }],
  },
  posts: {
    key: 'posts',
    canonicalName: 'messages.posts',
    description: 'Generic posts label (\'Posts\').',
    isParameterized: false,
  },
  poweredByBlogger: {
    key: 'poweredByBlogger',
    canonicalName: 'messages.poweredByBlogger',
    description: 'Platform attribution text (\'Powered by Blogger\').',
    isParameterized: false,
  },
  poweredByBloggerLink: {
    key: 'poweredByBloggerLink',
    canonicalName: 'messages.poweredByBloggerLink',
    description: 'Platform attribution with Blogger anchor. Direct tag invocation prohibited; requires <b:message>.',
    isParameterized: true,
    params: [{ name: 'bloggerUrl', position: 1, description: 'Blogger platform URL placeholder.', exampleValue: 'https://www.blogger.com/' }],
  },
  readMore: {
    key: 'readMore',
    canonicalName: 'messages.readMore',
    description: 'Post jump link action (\'Read more\').',
    isParameterized: false,
  },
  recentPosts: {
    key: 'recentPosts',
    canonicalName: 'messages.recentPosts',
    description: 'Recent posts widget heading.',
    isParameterized: false,
  },
  reportAbuse: {
    key: 'reportAbuse',
    canonicalName: 'messages.reportAbuse',
    description: 'Abuse reporting action link.',
    isParameterized: false,
  },
  search: {
    key: 'search',
    canonicalName: 'messages.search',
    description: 'Search button / action label (\'Search\').',
    isParameterized: false,
  },
  searchBlog: {
    key: 'searchBlog',
    canonicalName: 'messages.searchBlog',
    description: 'Search input placeholder (\'Search blog\').',
    isParameterized: false,
  },
  searchThisBlog: {
    key: 'searchThisBlog',
    canonicalName: 'messages.searchThisBlog',
    description: 'SearchThisBlog widget header.',
    isParameterized: false,
  },
  share: {
    key: 'share',
    canonicalName: 'messages.share',
    description: 'Social sharing action button label.',
    isParameterized: false,
  },
  shareOtherApps: {
    key: 'shareOtherApps',
    canonicalName: 'messages.shareOtherApps',
    description: 'Share to external applications label.',
    isParameterized: false,
  },
  shareToOtherApps: {
    key: 'shareToOtherApps',
    canonicalName: 'messages.shareToOtherApps',
    description: 'Share to external apps button label.',
    isParameterized: false,
  },
  showAll: {
    key: 'showAll',
    canonicalName: 'messages.showAll',
    description: 'Expand all items button label.',
    isParameterized: false,
  },
  showLess: {
    key: 'showLess',
    canonicalName: 'messages.showLess',
    description: 'Collapse items button label.',
    isParameterized: false,
  },
  showMore: {
    key: 'showMore',
    canonicalName: 'messages.showMore',
    description: 'Show more items button label.',
    isParameterized: false,
  },
  skipToMainContent: {
    key: 'skipToMainContent',
    canonicalName: 'messages.skipToMainContent',
    description: 'Accessibility skip link navigation label.',
    isParameterized: false,
  },
  someOfMyFavoriteSites: {
    key: 'someOfMyFavoriteSites',
    canonicalName: 'messages.someOfMyFavoriteSites',
    description: 'Alternate favorite sites widget title.',
    isParameterized: false,
  },
  subscribe: {
    key: 'subscribe',
    canonicalName: 'messages.subscribe',
    description: 'Feed subscription action label.',
    isParameterized: false,
  },
  subscribeTo: {
    key: 'subscribeTo',
    canonicalName: 'messages.subscribeTo',
    description: 'Feed subscription prefix label.',
    isParameterized: false,
  },
  subscribeToThisBlog: {
    key: 'subscribeToThisBlog',
    canonicalName: 'messages.subscribeToThisBlog',
    description: 'Blog feed subscription title.',
    isParameterized: false,
  },
  templateImagesBy: {
    key: 'templateImagesBy',
    canonicalName: 'messages.templateImagesBy',
    description: 'Theme image designer attribution. Direct tag invocation prohibited; requires <b:message>.',
    isParameterized: true,
    params: [{ name: 'authorName', position: 1, description: 'Template imagery author name placeholder.', exampleValue: 'Artist' }],
  },
  templateImagesByLink: {
    key: 'templateImagesByLink',
    canonicalName: 'messages.templateImagesByLink',
    description: 'Theme image designer attribution with link. Direct tag invocation prohibited; requires <b:message>.',
    isParameterized: true,
    params: [{ name: 'authorUrl', position: 1, description: 'Template imagery author URL placeholder (position 1).', exampleValue: 'https://...' }, { name: 'authorName', position: 2, description: 'Template imagery author name placeholder (position 2).', exampleValue: 'Artist' }],
  },
  theresNothingHere: {
    key: 'theresNothingHere',
    canonicalName: 'messages.theresNothingHere',
    description: 'Empty state message (\'There\'s nothing here\').',
    isParameterized: false,
  },
  title: {
    key: 'title',
    canonicalName: 'messages.title',
    description: 'Generic title label.',
    isParameterized: false,
  },
  viewAll: {
    key: 'viewAll',
    canonicalName: 'messages.viewAll',
    description: 'View all items action link.',
    isParameterized: false,
  },
  viewMyCompleteProfile: {
    key: 'viewMyCompleteProfile',
    canonicalName: 'messages.viewMyCompleteProfile',
    description: 'Profile widget link to author details.',
    isParameterized: false,
  },
  visible: {
    key: 'visible',
    canonicalName: 'messages.visible',
    description: 'Visible state label.',
    isParameterized: false,
  },
  visitProfile: {
    key: 'visitProfile',
    canonicalName: 'messages.visitProfile',
    description: 'Author profile link label.',
    isParameterized: false,
  },
  visitSite: {
    key: 'visitSite',
    canonicalName: 'messages.visitSite',
    description: 'External website link label.',
    isParameterized: false,
  },
  widget: {
    key: 'widget',
    canonicalName: 'messages.widget',
    description: 'Generic widget indicator.',
    isParameterized: false,
  },
  widgetNotAvailableInPreview: {
    key: 'widgetNotAvailableInPreview',
    canonicalName: 'messages.widgetNotAvailableInPreview',
    description: 'Theme designer preview warning text.',
    isParameterized: false,
  },
  youMayLikeThesePosts: {
    key: 'youMayLikeThesePosts',
    canonicalName: 'messages.youMayLikeThesePosts',
    description: 'Related posts recommendation heading.',
    isParameterized: false,
  },
};

export function getSystemMessageSuggestions(): readonly BloggerSuggestion[] {
  return Object.values(systemMessagesCatalog).map((msg): BloggerSuggestion => ({
    name: msg.canonicalName,
    type: 'string' as BloggerDataType,
    kind: 'property',
    detail: msg.isParameterized ? '(Parameterized System Message)' : '(System Message)',
    description: msg.isParameterized
      ? `${msg.description} [Requires <b:param> tags; direct <data:messages...> output is prohibited.]`
      : msg.description,
    insertText: msg.canonicalName,
    isSnippet: false,
    example: msg.isParameterized
      ? `<b:message name="${msg.canonicalName}">\n  <b:param name="${msg.params?.[0]?.name ?? 'param'}" value="..."/>\n</b:message>`
      : `<b:message name="${msg.canonicalName}"/>`,
    docUrl: 'https://bloggercode.orbiona.com/1979/12/Ressource-data-messages.html',
  }));
}

export function getMessageParamSuggestions(messageName?: string): readonly BloggerSuggestion[] {
  if (messageName) {
    const cleanKey = messageName.replace(/^messages\./, '');
    const msg = systemMessagesCatalog[cleanKey];
    if (msg && msg.params) {
      return msg.params.map((param): BloggerSuggestion => ({
        name: param.name,
        type: 'string' as BloggerDataType,
        kind: 'property',
        detail: `(Param Pos ${param.position} for ${msg.canonicalName})`,
        description: `${param.description} Positional replacement order: ${param.position}.`,
        example: `<b:param name="${param.name}" value="${param.exampleValue}"/>`,
      }));
    }
  }

  const defaultParams: readonly SystemMessageParamDefinition[] = [
    { name: 'authorName', position: 1, description: 'Author display name placeholder.', exampleValue: 'Author' },
    { name: 'authorUrl', position: 2, description: 'Author profile URL placeholder.', exampleValue: 'https://www.blogger.com/profile/...' },
    { name: 'bloggerUrl', position: 1, description: 'Blogger platform URL placeholder.', exampleValue: 'https://www.blogger.com/' },
    { name: 'numComments', position: 1, description: 'Total number of comments placeholder.', exampleValue: '1' },
  ];

  return defaultParams.map((param): BloggerSuggestion => ({
    name: param.name,
    type: 'string' as BloggerDataType,
    kind: 'property',
    detail: '(System Message Parameter)',
    description: param.description,
    example: `<b:param name="${param.name}" value="${param.exampleValue}"/>`,
  }));
}
