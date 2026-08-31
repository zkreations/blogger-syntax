import type { BloggerProperty } from '../models/types.js';

export const postAuthorPhotoProperties: Record<string, BloggerProperty> = {
  image: { name: 'image', type: 'image', description: 'Author profile photo image URL.' },
  width: { name: 'width', type: 'number', description: 'Author photo width in pixels.' },
  height: { name: 'height', type: 'number', description: 'Author photo height in pixels.' },
  alt: { name: 'alt', type: 'string', description: 'Author photo alternative text.' },
};

export const postAuthorProperties: Record<string, BloggerProperty> = {
  name: { name: 'name', type: 'string', description: 'Author display name.' },
  profileUrl: { name: 'profileUrl', type: 'string', description: 'Author profile page URL.' },
  authorPhoto: {
    name: 'authorPhoto',
    type: 'object',
    description: 'Author avatar photo metadata.',
    children: postAuthorPhotoProperties,
  },
  aboutMe: { name: 'aboutMe', type: 'string', description: 'Author bio / about me text.' },
};

export const postSnippetProperties: Record<string, BloggerProperty> = {
  short: { name: 'short', type: 'string', description: 'Short plain-text snippet summary of post content.' },
  long: { name: 'long', type: 'string', description: 'Long plain-text snippet summary of post content.' },
};

export const postLocationProperties: Record<string, BloggerProperty> = {
  mapsUrl: { name: 'mapsUrl', type: 'string', description: 'Google Maps URL for post geotagged location.' },
  name: { name: 'name', type: 'string', description: 'Post geotagged location name.' },
};

export const singlePostProperties: Record<string, BloggerProperty> = {
  id: { name: 'id', type: 'string', description: 'Unique post ID.' },
  title: { name: 'title', type: 'string', description: 'Post title.' },
  body: { name: 'body', type: 'string', description: 'HTML content body of the post.' },
  snippets: {
    name: 'snippets',
    type: 'object',
    description: 'Post text snippets.',
    children: postSnippetProperties,
  },
  url: { name: 'url', type: 'url', description: 'Permanent canonical URL of the post.' },
  link: { name: 'link', type: 'string', description: 'Post URL or external link URL.' },
  thumbnailUrl: { name: 'thumbnailUrl', type: 'string', description: 'URL of post thumbnail.' },
  featuredImage: { name: 'featuredImage', type: 'image', description: 'Featured image URL for the post.' },
  date: { name: 'date', type: 'date', description: 'Post publication date.' },
  lastUpdated: { name: 'lastUpdated', type: 'date', description: 'Post last updated modification date.' },
  author: {
    name: 'author',
    type: 'object',
    description: 'Post author information.',
    children: postAuthorProperties,
  },
  hasJumpLink: { name: 'hasJumpLink', type: 'boolean', description: 'True if post contains a <!--more--> jump break link.' },
  isFirstPost: { name: 'isFirstPost', type: 'boolean', description: 'True if post is the first post rendered on the page.' },
  isDateStart: { name: 'isDateStart', type: 'boolean', description: 'True if post is the first post published on this date header.' },
  postAuthorClass: { name: 'postAuthorClass', type: 'string', description: 'CSS class for post author styling.' },
  adminClass: { name: 'adminClass', type: 'string', description: 'CSS class for post author admin tools.' },
  commentSource: { name: 'commentSource', type: 'number', description: 'Comment system source type identifier.' },
  commentConfig: { name: 'commentConfig', type: 'string', description: 'JSON configuration for comments.' },
  commentJso: { name: 'commentJso', type: 'string', description: 'Comment JavaScript object string.' },
  commentMsgs: { name: 'commentMsgs', type: 'string', description: 'Comment localized messages string.' },
  commentSrc: { name: 'commentSrc', type: 'string', description: 'URL source for comment iframe.' },
  allowComments: { name: 'allowComments', type: 'boolean', description: 'True if comments are allowed on this post.' },
  allowNewComments: { name: 'allowNewComments', type: 'boolean', description: 'True if new comments can currently be submitted.' },
  noNewCommentsText: { name: 'noNewCommentsText', type: 'string', description: 'Message displayed when new comments are closed.' },
  numberOfComments: { name: 'numberOfComments', type: 'number', description: 'Total number of comments published on the post.' },
  commentsUrl: { name: 'commentsUrl', type: 'url', description: 'Direct URL to view post comments.' },
  commentsUrlOnclick: { name: 'commentsUrlOnclick', type: 'string', description: 'JavaScript click handler for comment popup.' },
  commentPagingRequired: { name: 'commentPagingRequired', type: 'boolean', description: 'True if comment pagination is required.' },
  hasOlderLinks: { name: 'hasOlderLinks', type: 'boolean', description: 'True if older posts pagination links exist.' },
  oldLinkClass: { name: 'oldLinkClass', type: 'string', description: 'CSS class for older posts link.' },
  oldestLinkUrl: { name: 'oldestLinkUrl', type: 'url', description: 'URL to the oldest page of comments.' },
  olderLinkUrl: { name: 'olderLinkUrl', type: 'url', description: 'URL to older comments page.' },
  hasNewerLinks: { name: 'hasNewerLinks', type: 'boolean', description: 'True if newer posts pagination links exist.' },
  newLinkClass: { name: 'newLinkClass', type: 'string', description: 'CSS class for newer posts link.' },
  newerLinkUrl: { name: 'newerLinkUrl', type: 'url', description: 'URL to newer comments page.' },
  newestLinkUrl: { name: 'newestLinkUrl', type: 'url', description: 'URL to the newest page of comments.' },
  commentRangeText: { name: 'commentRangeText', type: 'string', description: 'Text describing the range of comments currently visible.' },
  commentFormIframeSrc: { name: 'commentFormIframeSrc', type: 'string', description: 'URL for comment submission iframe form.' },
  embedCommentForm: { name: 'embedCommentForm', type: 'boolean', description: 'True if comment form should be embedded inline.' },
  showThreadedComments: { name: 'showThreadedComments', type: 'boolean', description: 'True if nested/threaded replies are enabled.' },
  commentHtml: { name: 'commentHtml', type: 'string', description: 'Raw HTML of comments.' },
  avatarIndentClass: { name: 'avatarIndentClass', type: 'string', description: 'CSS class for avatar indentation level.' },
  includeAd: { name: 'includeAd', type: 'boolean', description: 'True if an inline AdSense ad should be displayed after this post.' },
  adNumber: { name: 'adNumber', type: 'number', description: 'Sequential inline ad index number.' },
  emailPostUrl: { name: 'emailPostUrl', type: 'string', description: 'URL for the email-this-post feature.' },
  shareUrl: { name: 'shareUrl', type: 'string', description: 'URL for post social sharing dialog.' },
  cmtfpIframe: { name: 'cmtfpIframe', type: 'string', description: 'Comment popup iframe URL.' },
  appRpcRelayPath: { name: 'appRpcRelayPath', type: 'string', description: 'RPC relay path for comment authentication.' },
  location: {
    name: 'location',
    type: 'object',
    description: 'Post geotagged location.',
    children: postLocationProperties,
  },
  labels: { name: 'labels', type: 'array', description: 'Array of labels/categories assigned to this post.' },
  feedLinks: { name: 'feedLinks', type: 'array', description: 'Array of RSS/Atom feed links for the post.' },
  comments: { name: 'comments', type: 'array', description: 'Array of comments submitted on this post.' },
  enclosures: { name: 'enclosures', type: 'array', description: 'Array of podcast/media enclosure attachments.' },
};

export const blogWidgetProperties: Record<string, BloggerProperty> = {
  title: { name: 'title', type: 'string', description: 'Blog widget title.' },
  description: { name: 'description', type: 'string', description: 'Blog widget description.' },
  numPosts: { name: 'numPosts', type: 'number', description: 'Number of posts configured to display per page.' },
  olderPageUrl: { name: 'olderPageUrl', type: 'url', description: 'URL to older posts page.' },
  newerPageUrl: { name: 'newerPageUrl', type: 'url', description: 'URL to newer posts page.' },
  navMessage: { name: 'navMessage', type: 'string', description: 'Navigation status message.' },
  adCode: { name: 'adCode', type: 'string', description: 'AdSense script code.' },
  adClientId: { name: 'adClientId', type: 'string', description: 'AdSense client ID.' },
  cmtIframeInitialHeight: { name: 'cmtIframeInitialHeight', type: 'string', description: 'Initial height in px for comment iframe.' },
  showCmtPopup: { name: 'showCmtPopup', type: 'boolean', description: 'Whether comments open in a popup window.' },
  backgroundColor: { name: 'backgroundColor', type: 'string', description: 'Configured background color hex.' },
  linkColor: { name: 'linkColor', type: 'string', description: 'Configured link color hex.' },
  textColor: { name: 'textColor', type: 'string', description: 'Configured text color hex.' },
  languageCode: { name: 'languageCode', type: 'string', description: 'Language code configured for blog widget.' },
  messages: {
    name: 'messages',
    type: 'object',
    description: 'Blog widget localized messages.',
    children: {
      blogComment: { name: 'blogComment', type: 'string', description: 'Localized blog comment label.' },
    },
  },
  feedLinks: { name: 'feedLinks', type: 'array', description: 'Blog feed links array.' },
  posts: {
    name: 'posts',
    type: 'object',
    description: 'Posts collection or current post context properties.',
    children: singlePostProperties,
  },
};

export const bloggerWidgetsSchema: Record<string, BloggerProperty> = {
  Blog: {
    name: 'Blog',
    type: 'object',
    description: 'Main Blog widget containing posts, comments, and pager.',
    children: blogWidgetProperties,
  },
};
