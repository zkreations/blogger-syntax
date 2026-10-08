import type { BloggerProperty } from '../models/types.js';
import { createArrayProperties } from './typeMembers.js';

export const postAuthorPhotoProperties: Record<string, BloggerProperty> = {
  image: {
    name: 'image',
    type: 'image',
    description: 'Image resource associated with the author\'s profile photo.',
    docUrl: 'https://bloggercode.orbiona.com/1971/03/data-posts-author-authorPhoto-image.html',
  },
  width: {
    name: 'width',
    type: 'number',
    description: 'Width of the author\'s profile image.',
    docUrl: 'https://bloggercode.orbiona.com/1971/03/data-posts-author-authorPhoto-width.html',
  },
  height: {
    name: 'height',
    type: 'number',
    description: 'Height of the author\'s profile image.',
    docUrl: 'https://bloggercode.orbiona.com/2021/10/posts-author-authorPhoto-height.html',
  },
  alt: {
    name: 'alt',
    type: 'string',
    description: 'Alternative text associated with the author\'s profile image.',
    docUrl: 'https://bloggercode.orbiona.com/2021/10/posts-author-authorPhoto-alt.html',
  },
};

export const postAuthorProperties: Record<string, BloggerProperty> = {
  name: {
    name: 'name',
    type: 'string',
    description: 'Display name of the post author.',
    docUrl: 'https://bloggercode.orbiona.com/1971/03/data-posts-author-name.html',
  },
  profileUrl: {
    name: 'profileUrl',
    type: 'string',
    description: 'URL of the author\'s profile.',
    docUrl: 'https://bloggercode.orbiona.com/1971/03/data-posts-author-profileUrl.html',
  },
  authorPhoto: {
    name: 'authorPhoto',
    type: 'object',
    description: 'Author profile image object associated with the post.',
    docUrl: 'https://bloggercode.orbiona.com/1971/03/data-posts-author-authorPhoto.html',
    children: postAuthorPhotoProperties,
  },
  aboutMe: {
    name: 'aboutMe',
    type: 'string',
    description: 'Author bio / about me text.',
  },
};

export const postSnippetProperties: Record<string, BloggerProperty> = {
  short: {
    name: 'short',
    type: 'string',
    description: 'Short excerpt generated from the post content.',
    docUrl: 'https://bloggercode.orbiona.com/2021/10/posts-snippets-short.html',
  },
  long: {
    name: 'long',
    type: 'string',
    description: 'Long excerpt generated from the post content.',
    docUrl: 'https://bloggercode.orbiona.com/1970/07/data-posts-snippets-long.html',
  },
};

export const postLocationProperties: Record<string, BloggerProperty> = {
  mapsUrl: {
    name: 'mapsUrl',
    type: 'string',
    description: 'Google Maps URL for the location associated with the post.',
    docUrl: 'https://bloggercode.orbiona.com/1973/06/Blog-data-posts-location-mapsUrl.html',
  },
  name: {
    name: 'name',
    type: 'string',
    description: 'Name of the location associated with the post.',
    docUrl: 'https://bloggercode.orbiona.com/1973/06/Blog-data-posts-location-name.html',
  },
};

export const commentAuthorPhotoProperties: Record<string, BloggerProperty> = {
  height: {
    name: 'height',
    type: 'number',
    description: 'Pixel height of commenter avatar.',
  },
  thumbHeight: {
    name: 'thumbHeight',
    type: 'number',
    description: 'Pixel height of thumbnail avatar.',
  },
  thumbUrl: {
    name: 'thumbUrl',
    type: 'string',
    description: 'Thumbnail avatar image URL.',
  },
  thumbWidth: {
    name: 'thumbWidth',
    type: 'number',
    description: 'Pixel width of thumbnail avatar.',
  },
  url: {
    name: 'url',
    type: 'string',
    description: 'Full-size avatar image URL.',
  },
  width: {
    name: 'width',
    type: 'number',
    description: 'Pixel width of commenter avatar.',
  },
};

export const commentProperties: Record<string, BloggerProperty> = {
  id: {
    name: 'id',
    type: 'string',
    description: 'Unique comment identifier string.',
  },
  anchorName: {
    name: 'anchorName',
    type: 'string',
    description: 'DOM anchor identifier string (e.g. \'c123456789\').',
  },
  author: {
    name: 'author',
    type: 'string',
    description: 'Display name of comment author.',
  },
  authorAvatarImage: {
    name: 'authorAvatarImage',
    type: 'string',
    description: 'Pre-formatted HTML img markup of commenter avatar.',
  },
  authorAvatarSrc: {
    name: 'authorAvatarSrc',
    type: 'image',
    description: 'Avatar profile image source URL for the comment author.',
  },
  authorPhoto: {
    name: 'authorPhoto',
    type: 'object',
    description: 'Avatar photo dimension model (url, width, height).',
    children: commentAuthorPhotoProperties,
  },
  authorUrl: {
    name: 'authorUrl',
    type: 'url',
    description: 'Web address or profile URL of the comment author.',
  },
  authorUserType: {
    name: 'authorUserType',
    type: 'string',
    description: 'Classification type string (\'BLOGGER\', \'ANONYMOUS\', \'OPENID\').',
  },
  body: {
    name: 'body',
    type: 'string',
    description: 'HTML content body of the comment.',
  },
  cmtBodyIdPostfix: {
    name: 'cmtBodyIdPostfix',
    type: 'string',
    description: 'DOM ID postfix integer for comment body container.',
  },
  extraIconClass: {
    name: 'extraIconClass',
    type: 'string',
    description: 'CSS icon badge class string for registered author comments.',
  },
  timestamp: {
    name: 'timestamp',
    type: 'string',
    description: 'Formatted submission timestamp string.',
  },
  timestampAbs: {
    name: 'timestampAbs',
    type: 'number',
    description: 'Absolute timestamp integer value.',
  },
  timestampValue: {
    name: 'timestampValue',
    type: 'number',
    description: 'Unix epoch timestamp in milliseconds.',
  },
  date: {
    name: 'date',
    type: 'date',
    description: 'Native date object for the comment submission time.',
  },
  isDeleted: {
    name: 'isDeleted',
    type: 'boolean',
    description: 'True if the comment was marked as deleted.',
  },
  inReplyTo: {
    name: 'inReplyTo',
    type: 'string',
    description: 'Identifier of parent comment this comment replies to.',
  },
  deleteUrl: {
    name: 'deleteUrl',
    type: 'url',
    description: 'Administrative action URL to delete the comment.',
  },
  adminClass: {
    name: 'adminClass',
    type: 'string',
    description: 'CSS class applied to admin author comments.',
  },
  url: {
    name: 'url',
    type: 'string',
    description: 'Direct permalink anchor URL to comment.',
  },
};

export const postLabelItemProperties: Record<string, BloggerProperty> = {
  name: {
    name: 'name',
    type: 'string',
    description: 'Tag label name text.',
    docUrl: 'https://bloggercode.orbiona.com/1970/09/data-posts-labels.html',
  },
  url: {
    name: 'url',
    type: 'url',
    description: 'Category archive URL for this label.',
    docUrl: 'https://bloggercode.orbiona.com/1970/09/data-posts-labels.html',
  },
};

export const labelItemProperties: Record<string, BloggerProperty> = {
  name: {
    name: 'name',
    type: 'string',
    description: 'Display name of the label category.',
  },
  count: {
    name: 'count',
    type: 'number',
    description: 'Total published posts assigned to this label.',
  },
  url: {
    name: 'url',
    type: 'url',
    description: 'Target search URL for posts tagged with this label.',
  },
  cssSize: {
    name: 'cssSize',
    type: 'number',
    description: 'Relative frequency rank/weight (1-5) used for font scaling in cloud mode.',
  },
};

export const linkItemProperties: Record<string, BloggerProperty> = {
  name: {
    name: 'name',
    type: 'string',
    description: 'Anchor label or link text.',
  },
  target: {
    name: 'target',
    type: 'url',
    description: 'Destination hyperlink URL.',
  },
};

export const pageLinkItemProperties: Record<string, BloggerProperty> = {
  id: {
    name: 'id',
    type: 'string',
    description: 'Unique page identifier (numeric ID string or \'c0\' for Home).',
  },
  title: {
    name: 'title',
    type: 'string',
    description: 'Visible navigation label or page title.',
  },
  href: {
    name: 'href',
    type: 'url',
    description: 'Destination page or external link URL.',
  },
  isCurrentPage: {
    name: 'isCurrentPage',
    type: 'boolean',
    description: 'True if the link matches the current view URL request.',
  },
};

export const enclosureItemProperties: Record<string, BloggerProperty> = {
  mimeType: {
    name: 'mimeType',
    type: 'string',
    description: 'MIME type string of enclosure asset.',
  },
  url: {
    name: 'url',
    type: 'string',
    description: 'Direct link URL to media enclosure.',
  },
};

export const feedLinkItemProperties: Record<string, BloggerProperty> = {
  feedType: {
    name: 'feedType',
    type: 'string',
    description: 'Feed protocol standard (\'atom\' or \'rss\').',
  },
  mimeType: {
    name: 'mimeType',
    type: 'string',
    description: 'MIME type string (\'application/atom+xml\' or \'application/rss+xml\').',
  },
  name: {
    name: 'name',
    type: 'string',
    description: 'Localized feed title or descriptor.',
  },
  url: {
    name: 'url',
    type: 'url',
    description: 'Public URL for syndicated feed.',
  },
};

export const singlePostProperties: Record<string, BloggerProperty> = {
  id: {
    name: 'id',
    type: 'string',
    description: 'Unique post ID.',
  },
  title: {
    name: 'title',
    type: 'string',
    description: 'Post title.',
  },
  body: {
    name: 'body',
    type: 'string',
    description: 'HTML content body of the post.',
  },
  snippets: {
    name: 'snippets',
    type: 'object',
    description: 'Object containing the available post excerpts.',
    docUrl: 'https://bloggercode.orbiona.com/1970/07/data-posts-snippets.html',
    children: postSnippetProperties,
  },
  url: {
    name: 'url',
    type: 'url',
    description: 'Permanent canonical URL of the post.',
  },
  absoluteUrl: {
    name: 'absoluteUrl',
    type: 'url',
    description: 'Absolute URL of the post.',
    docUrl: 'https://bloggercode.orbiona.com/2021/10/posts-absoluteUrl.html',
  },
  link: {
    name: 'link',
    type: 'string',
    description: 'Post URL or external link URL.',
  },
  thumbnailUrl: {
    name: 'thumbnailUrl',
    type: 'string',
    description: 'URL of post thumbnail.',
  },
  featuredImage: {
    name: 'featuredImage',
    type: 'image',
    description: 'Featured image URL for the post.',
  },
  date: {
    name: 'date',
    type: 'date',
    description: 'Post publication date.',
  },
  lastUpdated: {
    name: 'lastUpdated',
    type: 'date',
    description: 'Date and time when the post was last updated.',
    docUrl: 'https://bloggercode.orbiona.com/1971/05/data-posts-lastUpdated.html',
  },
  author: {
    name: 'author',
    type: 'object',
    description: 'Author information associated with the post.',
    docUrl: 'https://bloggercode.orbiona.com/1971/03/data-posts-author.html',
    children: postAuthorProperties,
  },
  hasJumpLink: {
    name: 'hasJumpLink',
    type: 'boolean',
    description: 'Indicates whether the post has a jump link to the full content.',
    docUrl: 'https://bloggercode.orbiona.com/1971/06/data-posts-hasJumpLink.html',
  },
  isFirstPost: {
    name: 'isFirstPost',
    type: 'boolean',
    description: 'Indicates whether the post is the first post in the current collection or context.',
    docUrl: 'https://bloggercode.orbiona.com/1973/08/Blog-data-posts-isFirstPost.html',
  },
  isDateStart: {
    name: 'isDateStart',
    type: 'boolean',
    description: 'Indicates whether the post begins a new date grouping.',
    docUrl: 'https://bloggercode.orbiona.com/1973/08/Blog-data-posts-isDateStart.html',
  },
  postAuthorClass: {
    name: 'postAuthorClass',
    type: 'string',
    description: 'CSS class for post author styling.',
  },
  adminClass: {
    name: 'adminClass',
    type: 'string',
    description: 'CSS class used to identify an administrative post state.',
    docUrl: 'https://bloggercode.orbiona.com/2021/10/posts-adminClass.html',
  },
  commentSource: {
    name: 'commentSource',
    type: 'number',
    description: 'Comment system source type identifier.',
  },
  commentConfig: {
    name: 'commentConfig',
    type: 'string',
    description: 'JSON configuration for comments.',
  },
  commentJso: {
    name: 'commentJso',
    type: 'string',
    description: 'Comment JavaScript object string.',
  },
  commentMsgs: {
    name: 'commentMsgs',
    type: 'string',
    description: 'Comment localized messages string.',
  },
  commentSrc: {
    name: 'commentSrc',
    type: 'string',
    description: 'URL source for comment iframe.',
  },
  allowComments: {
    name: 'allowComments',
    type: 'boolean',
    description: 'True if comments are allowed on this post.',
  },
  allowNewComments: {
    name: 'allowNewComments',
    type: 'boolean',
    description: 'Indicates whether new comments are allowed on the post.',
    docUrl: 'https://bloggercode.orbiona.com/1973/08/Blog-data-posts-allowNewComments.html',
  },
  noNewCommentsText: {
    name: 'noNewCommentsText',
    type: 'string',
    description: 'Message displayed when new comments are closed.',
  },
  numberOfComments: {
    name: 'numberOfComments',
    type: 'number',
    description: 'Total number of comments associated with the post.',
    docUrl: 'https://bloggercode.orbiona.com/1971/05/data-posts-numberOfComments.html',
  },
  commentsUrl: {
    name: 'commentsUrl',
    type: 'url',
    description: 'URL for the comments associated with the post.',
    docUrl: 'https://bloggercode.orbiona.com/1971/07/data-posts-commentsUrl.html',
  },
  commentsUrlOnclick: {
    name: 'commentsUrlOnclick',
    type: 'string',
    description: 'JavaScript click handler for comment popup.',
  },
  commentPagingRequired: {
    name: 'commentPagingRequired',
    type: 'boolean',
    description: 'Indicates whether comment pagination is required.',
    docUrl: 'https://bloggercode.orbiona.com/1973/08/Blog-data-posts-commentPagingRequired.html',
  },
  hasOlderLinks: {
    name: 'hasOlderLinks',
    type: 'boolean',
    description: 'Indicates whether older posts are available for navigation.',
    docUrl: 'https://bloggercode.orbiona.com/2021/10/posts-hasOlderLinks.html',
  },
  oldLinkClass: {
    name: 'oldLinkClass',
    type: 'string',
    description: 'CSS class for older posts link.',
  },
  oldestLinkUrl: {
    name: 'oldestLinkUrl',
    type: 'url',
    description: 'URL for navigating to the oldest posts.',
    docUrl: 'https://bloggercode.orbiona.com/2021/10/posts-oldestLinkUrl.html',
  },
  olderLinkUrl: {
    name: 'olderLinkUrl',
    type: 'url',
    description: 'URL for navigating to older posts.',
    docUrl: 'https://bloggercode.orbiona.com/2021/10/posts-olderLinkUrl.html',
  },
  hasNewerLinks: {
    name: 'hasNewerLinks',
    type: 'boolean',
    description: 'Indicates whether newer posts are available for navigation.',
    docUrl: 'https://bloggercode.orbiona.com/1973/08/Blog-data-posts-hasNewerLinks.html',
  },
  newLinkClass: {
    name: 'newLinkClass',
    type: 'string',
    description: 'CSS class for newer posts link.',
  },
  newerLinkUrl: {
    name: 'newerLinkUrl',
    type: 'url',
    description: 'URL for navigating to newer posts.',
    docUrl: 'https://bloggercode.orbiona.com/1973/08/Blog-data-posts-newerLinkUrl.html',
  },
  newestLinkUrl: {
    name: 'newestLinkUrl',
    type: 'url',
    description: 'URL for navigating to the newest posts.',
    docUrl: 'https://bloggercode.orbiona.com/2021/10/posts-newestLinkUrl.html',
  },
  commentRangeText: {
    name: 'commentRangeText',
    type: 'string',
    description: 'Text describing the range of comments currently visible.',
  },
  commentFormIframeSrc: {
    name: 'commentFormIframeSrc',
    type: 'string',
    description: 'URL for comment submission iframe form.',
  },
  embedCommentForm: {
    name: 'embedCommentForm',
    type: 'boolean',
    description: 'Indicates whether the comment form should be embedded with the post.',
    docUrl: 'https://bloggercode.orbiona.com/1973/08/Blog-data-posts-embedCommentForm.html',
  },
  showThreadedComments: {
    name: 'showThreadedComments',
    type: 'boolean',
    description: 'Indicates whether threaded comments should be displayed.',
    docUrl: 'https://bloggercode.orbiona.com/1973/08/Blog-data-posts-showThreadedComments.html',
  },
  commentHtml: {
    name: 'commentHtml',
    type: 'string',
    description: 'Raw HTML of comments.',
  },
  avatarIndentClass: {
    name: 'avatarIndentClass',
    type: 'string',
    description: 'CSS class used to control comment avatar indentation.',
    docUrl: 'https://bloggercode.orbiona.com/1973/07/Blog-data-posts-avatarIndentClass.html',
  },
  includeAd: {
    name: 'includeAd',
    type: 'boolean',
    description: 'Indicates whether an advertisement should be included with the post.',
    docUrl: 'https://bloggercode.orbiona.com/1973/08/Blog-data-posts-includeAd.html',
  },
  adNumber: {
    name: 'adNumber',
    type: 'number',
    description: 'Sequential inline ad index number.',
  },
  emailPostUrl: {
    name: 'emailPostUrl',
    type: 'string',
    description: 'URL for the email-this-post feature.',
  },
  shareUrl: {
    name: 'shareUrl',
    type: 'string',
    description: 'URL used to share the post.',
    docUrl: 'https://bloggercode.orbiona.com/1971/04/data-posts-shareUrl.html',
  },
  cmtfpIframe: {
    name: 'cmtfpIframe',
    type: 'string',
    description: 'Comment popup iframe URL.',
  },
  appRpcRelayPath: {
    name: 'appRpcRelayPath',
    type: 'string',
    description: 'RPC relay path for comment authentication.',
  },
  location: {
    name: 'location',
    type: 'object',
    description: 'Post geotagged location.',
    children: postLocationProperties,
  },
  labels: {
    name: 'labels',
    type: 'array',
    description: 'Collection of labels assigned to the post.',
    docUrl: 'https://bloggercode.orbiona.com/1970/09/data-posts-labels.html',
    itemChildren: postLabelItemProperties,
    children: createArrayProperties(postLabelItemProperties),
  },
  feedLinks: {
    name: 'feedLinks',
    type: 'array',
    description: 'Collection of feed links associated with the post.',
    docUrl: 'https://bloggercode.orbiona.com/2021/10/posts-feedLinks.html',
    itemChildren: feedLinkItemProperties,
    children: createArrayProperties(feedLinkItemProperties),
  },
  comments: {
    name: 'comments',
    type: 'array',
    description: 'Collection of comments associated with the post.',
    docUrl: 'https://bloggercode.orbiona.com/1973/03/Blog-data-posts-comments.html',
    itemChildren: commentProperties,
    children: createArrayProperties(commentProperties),
  },
  enclosures: {
    name: 'enclosures',
    type: 'array',
    description: 'Collection of media enclosures associated with the post.',
    docUrl: 'https://bloggercode.orbiona.com/1973/01/Blog-data-posts-enclosures.html',
    itemChildren: enclosureItemProperties,
    children: createArrayProperties(enclosureItemProperties),
  },
};

export const blogWidgetProperties: Record<string, BloggerProperty> = {
  title: {
    name: 'title',
    type: 'string',
    description: 'Blog widget title.',
  },
  description: {
    name: 'description',
    type: 'string',
    description: 'Blog widget description.',
  },
  numPosts: {
    name: 'numPosts',
    type: 'number',
    description: 'Number of posts configured to display per page.',
  },
  olderPageUrl: {
    name: 'olderPageUrl',
    type: 'url',
    description: 'URL to older posts page.',
  },
  newerPageUrl: {
    name: 'newerPageUrl',
    type: 'url',
    description: 'URL to newer posts page.',
  },
  navMessage: {
    name: 'navMessage',
    type: 'string',
    description: 'Navigation status message.',
  },
  adCode: {
    name: 'adCode',
    type: 'string',
    description: 'AdSense script code.',
  },
  adClientId: {
    name: 'adClientId',
    type: 'string',
    description: 'AdSense client ID.',
  },
  cmtIframeInitialHeight: {
    name: 'cmtIframeInitialHeight',
    type: 'string',
    description: 'Initial height in px for comment iframe.',
  },
  showCmtPopup: {
    name: 'showCmtPopup',
    type: 'boolean',
    description: 'Whether comments open in a popup window.',
  },
  backgroundColor: {
    name: 'backgroundColor',
    type: 'string',
    description: 'Configured background color hex.',
  },
  linkColor: {
    name: 'linkColor',
    type: 'string',
    description: 'Configured link color hex.',
  },
  textColor: {
    name: 'textColor',
    type: 'string',
    description: 'Configured text color hex.',
  },
  languageCode: {
    name: 'languageCode',
    type: 'string',
    description: 'Language code configured for blog widget.',
  },
  messages: {
    name: 'messages',
    type: 'object',
    description: 'Blog widget localized messages.',
    children: {
      blogComment: {
        name: 'blogComment',
        type: 'string',
        description: 'Localized blog comment label.',
      },
    },
  },
  feedLinks: {
    name: 'feedLinks',
    type: 'array',
    description: 'Blog feed links array.',
    itemChildren: feedLinkItemProperties,
    children: createArrayProperties(feedLinkItemProperties),
  },
  posts: {
    name: 'posts',
    type: 'array',
    description: 'Collection of posts available in the current widget context.',
    docUrl: 'https://bloggercode.orbiona.com/1971/08/data-posts.html',
    itemChildren: singlePostProperties,
    children: createArrayProperties(singlePostProperties),
  },
};

export const adSenseWidgetProperties: Record<string, BloggerProperty> = {
  adClientId: {
    name: 'adClientId',
    type: 'string',
    description: 'AdSense publisher ID (`ca-pub-XXXXXXXXXXXXXXXX`). Gadget v2 only.',
  },
  adCode: {
    name: 'adCode',
    type: 'string',
    description: 'Raw HTML/JavaScript snippet for the AdSense ad unit.',
  },
};

export const imageAuthorProperties: Record<string, BloggerProperty> = {
  name: {
    name: 'name',
    type: 'string',
    description: 'Name of the theme background image creator/photographer.',
  },
  url: {
    name: 'url',
    type: 'url',
    description: 'Portfolio or source link for the background image creator.',
  },
};

export const attributionWidgetProperties: Record<string, BloggerProperty> = {
  bloggerUrl: {
    name: 'bloggerUrl',
    type: 'url',
    description: 'Blogger platform URL (`https://www.blogger.com`).',
  },
  copyright: {
    name: 'copyright',
    type: 'string',
    description: 'Custom copyright notice entered in Layout UI.',
  },
  imageAuthor: {
    name: 'imageAuthor',
    type: 'object',
    description: 'Credit details for template background image designer.',
    children: imageAuthorProperties,
  },
};

export const archivePostItemProperties: Record<string, BloggerProperty> = {
  title: {
    name: 'title',
    type: 'string',
    description: 'Post headline title string.',
  },
  url: {
    name: 'url',
    type: 'url',
    description: 'Canonical permalink URL of the post.',
  },
};

export const archiveIntervalNodeProperties: Record<string, BloggerProperty> = {
  'expclass': {
    name: 'expclass',
    type: 'string',
    description: 'Collapsible CSS state class (\'expanded\' or \'collapsed\').',
  },
  'name': {
    name: 'name',
    type: 'string',
    description: 'Formatted interval date label.',
  },
  'post-count': {
    name: 'post-count',
    type: 'number',
    description: 'Number of posts published within this interval.',
  },
  'posts': {
    name: 'posts',
    type: 'array',
    description: 'Child post entry inside leaf interval nodes.',
    itemChildren: archivePostItemProperties,
    children: createArrayProperties(archivePostItemProperties),
  },
  'toggleId': {
    name: 'toggleId',
    type: 'string',
    description: 'Unique DOM ID for collapsible JS toggle script.',
  },
  'url': {
    name: 'url',
    type: 'url',
    description: 'Archive filter URL for this interval.',
  },
};

archiveIntervalNodeProperties.data = {
  name: 'data',
  type: 'array',
  description: 'Nested child intervals (empty at leaf level).',
  itemChildren: archiveIntervalNodeProperties,
  children: createArrayProperties(archiveIntervalNodeProperties),
};

export const blogArchiveWidgetProperties: Record<string, BloggerProperty> = {
  'data': {
    name: 'data',
    type: 'array',
    description: 'Recursive collection of archive interval nodes.',
    itemChildren: archiveIntervalNodeProperties,
    children: createArrayProperties(archiveIntervalNodeProperties),
  },
  'expclass': {
    name: 'expclass',
    type: 'string',
    description: 'Collapsible CSS class (`\'expanded\'` / `\'collapsed\'`) for all-time interval.',
  },
  'name': {
    name: 'name',
    type: 'string',
    description: 'Formatted date string for root all-time period.',
  },
  'post-count': {
    name: 'post-count',
    type: 'number',
    description: 'Total published post count across all-time period.',
  },
  'style': {
    name: 'style',
    type: 'string',
    description: 'Display style configured in UI: `\'HIERARCHY\'`, `\'FLAT\'`, or `\'MENU\'`.',
  },
  'title': {
    name: 'title',
    type: 'string',
    description: 'Widget header title (max 100 chars).',
  },
  'toggleId': {
    name: 'toggleId',
    type: 'string',
    description: 'DOM ID string for hierarchy toggle button.',
  },
  'toggleopen': {
    name: 'toggleopen',
    type: 'string',
    description: 'Toggle state indicator string (`\'toggleopen\'` or empty).',
  },
  'url': {
    name: 'url',
    type: 'url',
    description: 'Archive landing URL for root all-time period.',
  },
};

export const blogListItemThumbnailProperties: Record<string, BloggerProperty> = {
  height: {
    name: 'height',
    type: 'number',
    description: 'Native height of the thumbnail image in pixels.',
  },
  url: {
    name: 'url',
    type: 'url',
    description: 'Direct image source URL of the thumbnail.',
  },
  width: {
    name: 'width',
    type: 'number',
    description: 'Native width of the thumbnail image in pixels.',
  },
};

export const blogListItemProperties: Record<string, BloggerProperty> = {
  blogIconUrl: {
    name: 'blogIconUrl',
    type: 'string',
    description: 'URL to the blog\'s favicon or icon image.',
  },
  blogTitle: {
    name: 'blogTitle',
    type: 'string',
    description: 'Title of the external blog.',
  },
  blogUrl: {
    name: 'blogUrl',
    type: 'url',
    description: 'Homepage URL of the external blog.',
  },
  displayStyle: {
    name: 'displayStyle',
    type: 'string',
    description: 'Display style configured in UI (\'list\' or \'icon\').',
  },
  itemSnippet: {
    name: 'itemSnippet',
    type: 'string',
    description: 'Short summary excerpt of the latest published post.',
  },
  itemThumbnail: {
    name: 'itemThumbnail',
    type: 'object',
    description: 'Thumbnail image dimensions and URL for latest post.',
    children: blogListItemThumbnailProperties,
  },
  itemTitle: {
    name: 'itemTitle',
    type: 'string',
    description: 'Headline/title of the latest published post.',
  },
  itemUrl: {
    name: 'itemUrl',
    type: 'url',
    description: 'Direct permalink URL to the latest published post.',
  },
  timePeriodSinceLastUpdate: {
    name: 'timePeriodSinceLastUpdate',
    type: 'string',
    description: 'Localized human-readable elapsed duration (e.g. \'2 hours ago\').',
  },
};

export const blogListWidgetProperties: Record<string, BloggerProperty> = {
  items: {
    name: 'items',
    type: 'array',
    description: 'Collection of syndicated blog entries in the blogroll.',
    itemChildren: blogListItemProperties,
    children: createArrayProperties(blogListItemProperties),
  },
  linkColor: {
    name: 'linkColor',
    type: 'string',
    description: 'Link color hexadecimal code from widget styling settings.',
  },
  numItemsToShow: {
    name: 'numItemsToShow',
    type: 'number',
    description: 'Max number of blogs displayed before truncation.',
  },
  showAllText: {
    name: 'showAllText',
    type: 'string',
    description: 'Localized label to reveal all blogs (e.g. \'Show all\').',
  },
  showIcon: {
    name: 'showIcon',
    type: 'boolean',
    description: 'UI toggle for rendering each blog\'s favicon.',
  },
  showItemSnippet: {
    name: 'showItemSnippet',
    type: 'boolean',
    description: 'UI toggle for rendering the latest post summary.',
  },
  showItemThumbnail: {
    name: 'showItemThumbnail',
    type: 'boolean',
    description: 'UI toggle for rendering the latest post thumbnail.',
  },
  showItemTitle: {
    name: 'showItemTitle',
    type: 'boolean',
    description: 'UI toggle for rendering the latest post title.',
  },
  showNText: {
    name: 'showNText',
    type: 'string',
    description: 'Localized label for displaying limited count (e.g. \'Show %d\').',
  },
  showTimePeriodSinceLastUpdate: {
    name: 'showTimePeriodSinceLastUpdate',
    type: 'boolean',
    description: 'UI toggle for rendering elapsed time since last post.',
  },
  sortType: {
    name: 'sortType',
    type: 'string',
    description: 'Sorting order (`\'ALPHABETICAL\'`, `\'LAST_UPDATE_DESCENDING\'`).',
  },
  textColor: {
    name: 'textColor',
    type: 'string',
    description: 'Text color hexadecimal code from widget styling settings.',
  },
  title: {
    name: 'title',
    type: 'string',
    description: 'Widget header title (max 100 chars).',
  },
  totalItems: {
    name: 'totalItems',
    type: 'number',
    description: 'Total count of blogs registered in this gadget.',
  },
};

export const blogSearchWidgetProperties: Record<string, BloggerProperty> = {
  title: {
    name: 'title',
    type: 'string',
    description: 'Widget header title (max 100 chars).',
  },
};

export const bloggerButtonWidgetProperties: Record<string, BloggerProperty> = {
  source: {
    name: 'source',
    type: 'url',
    description: 'Direct URL path to selected logo graphic. Gadget v2 only.',
  },
  srcset: {
    name: 'srcset',
    type: 'string',
    description: 'Responsive `srcset` string containing `1x` and `2x` image source descriptors. Gadget v2 only.',
  },
};

export const contactFormWidgetProperties: Record<string, BloggerProperty> = {
  contactFormEmailMsg: {
    name: 'contactFormEmailMsg',
    type: 'string',
    description: 'Label and placeholder text for email input field.',
  },
  contactFormEmptyMessageMsg: {
    name: 'contactFormEmptyMessageMsg',
    type: 'string',
    description: 'Client/server validation warning for empty message textarea.',
  },
  contactFormInvalidEmailMsg: {
    name: 'contactFormInvalidEmailMsg',
    type: 'string',
    description: 'Client/server validation warning for invalid email format.',
  },
  contactFormMessageMsg: {
    name: 'contactFormMessageMsg',
    type: 'string',
    description: 'Label and placeholder text for message textarea.',
  },
  contactFormMessageNotSentMsg: {
    name: 'contactFormMessageNotSentMsg',
    type: 'string',
    description: 'Status alert displayed when delivery encounters server error.',
  },
  contactFormMessageSendingMsg: {
    name: 'contactFormMessageSendingMsg',
    type: 'string',
    description: 'In-flight submission progress indicator text.',
  },
  contactFormMessageSentMsg: {
    name: 'contactFormMessageSentMsg',
    type: 'string',
    description: 'Success confirmation notice displayed after dispatch.',
  },
  contactFormNameMsg: {
    name: 'contactFormNameMsg',
    type: 'string',
    description: 'Label and placeholder text for sender name input.',
  },
  contactFormSendMsg: {
    name: 'contactFormSendMsg',
    type: 'string',
    description: 'Action text displayed on form submit button.',
  },
  submitUrl: {
    name: 'submitUrl',
    type: 'url',
    description: 'Platform AJAX RPC endpoint URL for form submission.',
  },
  title: {
    name: 'title',
    type: 'string',
    description: 'Widget header title (max 100 chars).',
  },
};

export const postDisplayProperties: Record<string, BloggerProperty> = {
  showAuthor: {
    name: 'showAuthor',
    type: 'boolean',
    description: 'UI toggle indicating whether post author is shown.',
  },
  showDate: {
    name: 'showDate',
    type: 'boolean',
    description: 'UI toggle indicating whether publication date is shown.',
  },
  showFeaturedImage: {
    name: 'showFeaturedImage',
    type: 'boolean',
    description: 'UI toggle indicating whether hero/featured thumbnail is displayed.',
  },
  showSnippet: {
    name: 'showSnippet',
    type: 'boolean',
    description: 'UI toggle indicating whether post excerpt/snippet is shown.',
  },
  showTitle: {
    name: 'showTitle',
    type: 'boolean',
    description: 'UI toggle indicating whether post title headline is shown.',
  },
};

export const featuredPostWidgetProperties: Record<string, BloggerProperty> = {
  postDisplay: {
    name: 'postDisplay',
    type: 'object',
    description: 'Structured display preferences configured in UI.',
    children: postDisplayProperties,
  },
  posts: {
    name: 'posts',
    type: 'array',
    description: 'Single-element collection containing the pinned post model.',
    itemChildren: singlePostProperties,
    children: createArrayProperties(singlePostProperties),
  },
  title: {
    name: 'title',
    type: 'string',
    description: 'Widget header title (max 100 chars).',
  },
};

export const feedWidgetProperties: Record<string, BloggerProperty> = {
  feedUrl: {
    name: 'feedUrl',
    type: 'url',
    description: 'Syndication feed endpoint URL (RSS 2.0 or Atom).',
  },
  loadingMsg: {
    name: 'loadingMsg',
    type: 'string',
    description: 'Localized placeholder text while fetching feed items (e.g. \'Loading...\').',
  },
  numItemsShow: {
    name: 'numItemsShow',
    type: 'number',
    description: 'Maximum entries to display.',
  },
  openLinksInNewWindow: {
    name: 'openLinksInNewWindow',
    type: 'boolean',
    description: 'UI toggle indicating whether feed links open in `target=\'_blank\'`.',
  },
  showItemAuthor: {
    name: 'showItemAuthor',
    type: 'boolean',
    description: 'UI toggle indicating whether to display entry author.',
  },
  showItemDate: {
    name: 'showItemDate',
    type: 'boolean',
    description: 'UI toggle indicating whether to display entry publication date.',
  },
  title: {
    name: 'title',
    type: 'string',
    description: 'Widget header title (defaults to feed title if omitted).',
  },
};

export const followersWidgetProperties: Record<string, BloggerProperty> = {
  codeSnippet: {
    name: 'codeSnippet',
    type: 'string',
    description: 'Raw HTML/JS snippet generating the sandboxed Google Friend Connect / Followers iframe.',
  },
  title: {
    name: 'title',
    type: 'string',
    description: 'Widget header title (e.g. \'Followers\' or localized equivalent).',
  },
};

export const htmlWidgetProperties: Record<string, BloggerProperty> = {
  content: {
    name: 'content',
    type: 'string',
    description: 'Raw HTML markup, JavaScript snippet, or formatted text payload.',
  },
  title: {
    name: 'title',
    type: 'string',
    description: 'Optional widget header title configured in UI.',
  },
};

export const headerWidgetProperties: Record<string, BloggerProperty> = {
  backgroundPositionStyleStr: {
    name: 'backgroundPositionStyleStr',
    type: 'string',
    description: 'Inline CSS string for banner background positioning (e.g. \'background-position: center;\').',
  },
  description: {
    name: 'description',
    type: 'string',
    description: 'Blog tagline/description configured in blog settings.',
  },
  height: {
    name: 'height',
    type: 'number',
    description: 'Native banner image height in pixels.',
  },
  image: {
    name: 'image',
    type: 'image',
    description: 'Native Blogger image resource; supports `resizeImage()` expressions.',
  },
  imagePlacement: {
    name: 'imagePlacement',
    type: 'string',
    description: 'Banner placement mode: `\'BEHIND\'`, `\'REPLACE\'`, or `\'BEFORE_DESCRIPTION\'`.',
  },
  sectionWidth: {
    name: 'sectionWidth',
    type: 'number',
    description: 'Available width of the parent `<b:section>` in pixels.',
  },
  shrinkToFit: {
    name: 'shrinkToFit',
    type: 'boolean',
    description: 'UI toggle indicating whether banner scales down to fit container width.',
  },
  sourceUrl: {
    name: 'sourceUrl',
    type: 'url',
    description: 'Direct CDN URL of the uploaded banner image.',
  },
  title: {
    name: 'title',
    type: 'string',
    description: 'Blog title text (or custom header title).',
  },
  useImage: {
    name: 'useImage',
    type: 'boolean',
    description: 'True when an uploaded banner image is active.',
  },
  width: {
    name: 'width',
    type: 'number',
    description: 'Native banner image width in pixels.',
  },
};

export const imageWidgetProperties: Record<string, BloggerProperty> = {
  caption: {
    name: 'caption',
    type: 'string',
    description: 'Caption or descriptive text displayed with the image.',
  },
  height: {
    name: 'height',
    type: 'number',
    description: 'Native height of the image in pixels.',
  },
  link: {
    name: 'link',
    type: 'url',
    description: 'Target destination URL activated when clicking the image.',
  },
  sectionWidth: {
    name: 'sectionWidth',
    type: 'number',
    description: 'Target width of the parent `<b:section>` in pixels.',
  },
  shrinkToFit: {
    name: 'shrinkToFit',
    type: 'boolean',
    description: 'UI toggle indicating whether the image scales down to container width.',
  },
  sourceSet: {
    name: 'sourceSet',
    type: 'string',
    description: 'Comma-separated responsive image candidates (`srcset`).',
  },
  sourceUrl: {
    name: 'sourceUrl',
    type: 'url',
    description: 'Direct CDN or external source URL of the image.',
  },
  title: {
    name: 'title',
    type: 'string',
    description: 'Widget header title configured in UI.',
  },
  width: {
    name: 'width',
    type: 'number',
    description: 'Native width of the image in pixels.',
  },
};

export const labelWidgetProperties: Record<string, BloggerProperty> = {
  display: {
    name: 'display',
    type: 'string',
    description: 'Presentation format chosen in UI: `\'list\'` or `\'cloud\'`.',
  },
  labels: {
    name: 'labels',
    type: 'array',
    description: 'Collection of label models configured for display in this gadget.',
    itemChildren: labelItemProperties,
    children: createArrayProperties(labelItemProperties),
  },
  showFreqNumbers: {
    name: 'showFreqNumbers',
    type: 'boolean',
    description: 'UI toggle indicating whether to display post count per label.',
  },
  title: {
    name: 'title',
    type: 'string',
    description: 'Widget header title (defaults to \'Labels\' if omitted).',
  },
};

export const linkListWidgetProperties: Record<string, BloggerProperty> = {
  links: {
    name: 'links',
    type: 'array',
    description: 'Collection of user-configured hyperlink items.',
    itemChildren: linkItemProperties,
    children: createArrayProperties(linkItemProperties),
  },
  shownum: {
    name: 'shownum',
    type: 'number',
    description: 'Maximum links to display (0 or negative indicates no limit / show all).',
  },
  sorting: {
    name: 'sorting',
    type: 'string',
    description: 'Ordering mode set in UI (`\'none\'`, `\'alpha\'`, `\'reverse-alpha\'`).',
  },
  title: {
    name: 'title',
    type: 'string',
    description: 'Widget header title (defaults to \'Links\' if omitted).',
  },
};

export const pageListWidgetProperties: Record<string, BloggerProperty> = {
  links: {
    name: 'links',
    type: 'array',
    description: 'Collection of standalone page and custom navigation links.',
    itemChildren: pageLinkItemProperties,
    children: createArrayProperties(pageLinkItemProperties),
  },
  title: {
    name: 'title',
    type: 'string',
    description: 'Widget header title (defaults to \'Pages\' if omitted).',
  },
};

export const popularPostsWidgetProperties: Record<string, BloggerProperty> = {
  postDisplay: {
    name: 'postDisplay',
    type: 'object',
    description: 'Structured display preferences configured in UI.',
    children: postDisplayProperties,
  },
  posts: {
    name: 'posts',
    type: 'array',
    description: 'Collection of popular post models (canonical `Blog` post schema).',
    itemChildren: singlePostProperties,
    children: createArrayProperties(singlePostProperties),
  },
  title: {
    name: 'title',
    type: 'string',
    description: 'Widget header title (defaults to \'Popular Posts\' if omitted).',
  },
};

export const profileAuthorPhotoProperties: Record<string, BloggerProperty> = {
  alt: {
    name: 'alt',
    type: 'string',
    description: 'Accessible alternate text for author avatar.',
  },
  height: {
    name: 'height',
    type: 'number',
    description: 'Pixel height of author avatar image.',
  },
  image: {
    name: 'image',
    type: 'image',
    description: 'Native image resource of author avatar; supports `resizeImage()`.',
  },
  width: {
    name: 'width',
    type: 'number',
    description: 'Pixel width of author avatar image.',
  },
};

export const profileAuthorItemProperties: Record<string, BloggerProperty> = {
  'authorPhoto': {
    name: 'authorPhoto',
    type: 'object',
    description: 'Structured contributor avatar with native image resource.',
    children: profileAuthorPhotoProperties,
  },
  'display-name': {
    name: 'display-name',
    type: 'string',
    description: 'Display name of team contributor.',
  },
  'profileLogo': {
    name: 'profileLogo',
    type: 'string',
    description: 'Platform badge/logo URL for contributor.',
  },
  'userUrl': {
    name: 'userUrl',
    type: 'url',
    description: 'URL linking to contributor\'s profile page.',
  },
};

export const profileWidgetProperties: Record<string, BloggerProperty> = {
  aboutme: {
    name: 'aboutme',
    type: 'string',
    description: 'Author biography or introduction text.',
  },
  authorPhoto: {
    name: 'authorPhoto',
    type: 'object',
    description: 'Structured avatar object with native `image` type.',
    children: profileAuthorPhotoProperties,
  },
  authors: {
    name: 'authors',
    type: 'array',
    description: 'Collection of contributors populated when `team == true`.',
    itemChildren: profileAuthorItemProperties,
    children: createArrayProperties(profileAuthorItemProperties),
  },
  displayname: {
    name: 'displayname',
    type: 'string',
    description: 'Author display name.',
  },
  hasgoogleprofile: {
    name: 'hasgoogleprofile',
    type: 'boolean',
    description: 'True if linked to a Google account profile.',
  },
  location: {
    name: 'location',
    type: 'string',
    description: 'Geographic location configured in author profile.',
  },
  profileLogo: {
    name: 'profileLogo',
    type: 'string',
    description: 'Small platform profile badge/logo URL.',
  },
  showaboutme: {
    name: 'showaboutme',
    type: 'boolean',
    description: 'UI toggle for rendering the biography text.',
  },
  showlocation: {
    name: 'showlocation',
    type: 'boolean',
    description: 'UI toggle for rendering the location string.',
  },
  team: {
    name: 'team',
    type: 'boolean',
    description: 'True if the blog has multiple authors and is configured as a team blog.',
  },
  title: {
    name: 'title',
    type: 'string',
    description: 'Widget header title (defaults to \'About Me\' or \'Contributors\' if omitted).',
  },
  userUrl: {
    name: 'userUrl',
    type: 'url',
    description: 'URL linking to the author\'s public profile page.',
  },
  viewProfileMsg: {
    name: 'viewProfileMsg',
    type: 'string',
    description: 'Localized string (e.g. \'View my complete profile\').',
  },
};

export const statsWidgetProperties: Record<string, BloggerProperty> = {
  showAnimatedCounter: {
    name: 'showAnimatedCounter',
    type: 'boolean',
    description: 'UI toggle indicating whether digits animate dynamically on increment.',
  },
  showGraphicalCounter: {
    name: 'showGraphicalCounter',
    type: 'boolean',
    description: 'UI toggle indicating whether to render stylized graphical digit tiles.',
  },
  showSparkline: {
    name: 'showSparkline',
    type: 'boolean',
    description: 'UI toggle indicating whether to display the miniature traffic trend chart.',
  },
  statsUrl: {
    name: 'statsUrl',
    type: 'url',
    description: 'Blogger endpoint URL used to retrieve traffic counts and sparkline graphics.',
  },
  title: {
    name: 'title',
    type: 'string',
    description: 'Widget header title (defaults to \'Total Pageviews\' if omitted).',
  },
};

export const subscribeFeedItemProperties: Record<string, BloggerProperty> = {
  encodedUrl: {
    name: 'encodedUrl',
    type: 'string',
    description: 'URL-encoded feed endpoint used in reader query parameter strings.',
  },
  title: {
    name: 'title',
    type: 'string',
    description: 'Display name of the feed reader service (e.g. \'Google\', \'Yahoo\').',
  },
  type: {
    name: 'type',
    type: 'string',
    description: 'Identifier code for the feed reader target (e.g. \'GOOGLE\', \'YAHOO\').',
  },
  url: {
    name: 'url',
    type: 'url',
    description: 'Direct one-click subscription endpoint targeting that reader service.',
  },
};

export const subscribeWidgetProperties: Record<string, BloggerProperty> = {
  arrowDropdownImg: {
    name: 'arrowDropdownImg',
    type: 'url',
    description: 'Static platform image URL for the dropdown chevron arrow.',
  },
  atomFeedTxt: {
    name: 'atomFeedTxt',
    type: 'string',
    description: 'Localized label for direct Atom feed subscription (e.g. \'Posts (Atom)\').',
  },
  feedIconImg: {
    name: 'feedIconImg',
    type: 'url',
    description: 'Static platform image URL for the standard orange RSS feed icon.',
  },
  feeds: {
    name: 'feeds',
    type: 'array',
    description: 'Collection of supported web feed reader targets.',
    itemChildren: subscribeFeedItemProperties,
    children: createArrayProperties(subscribeFeedItemProperties),
  },
  imagePathBase: {
    name: 'imagePathBase',
    type: 'url',
    description: 'Base CDN directory URL containing feed reader brand logos.',
  },
  title: {
    name: 'title',
    type: 'string',
    description: 'Widget header title (e.g. \'Subscribe To\').',
  },
  widgetId: {
    name: 'widgetId',
    type: 'string',
    description: 'Canonical widget instance ID string.',
  },
};

export const textWidgetProperties: Record<string, BloggerProperty> = {
  content: {
    name: 'content',
    type: 'string',
    description: 'Raw HTML markup, JavaScript snippet, or formatted text payload.',
  },
  title: {
    name: 'title',
    type: 'string',
    description: 'Optional widget header title configured in UI.',
  },
};

export const textListWidgetProperties: Record<string, BloggerProperty> = {
  items: {
    name: 'items',
    type: 'array',
    description: 'Collection of user-configured text strings.',
    children: createArrayProperties(),
  },
  shownum: {
    name: 'shownum',
    type: 'number',
    description: 'Maximum items to display (0 or negative indicates no limit / show all).',
  },
  sorting: {
    name: 'sorting',
    type: 'string',
    description: 'Ordering mode set in UI (\'none\', \'alpha\', \'reverse-alpha\').',
  },
  title: {
    name: 'title',
    type: 'string',
    description: 'Widget header title (defaults to \'List\' if omitted).',
  },
};

export const translateWidgetProperties: Record<string, BloggerProperty> = {
  layout: {
    name: 'layout',
    type: 'string',
    description: 'Presentation format chosen in UI: `\'VERTICAL\'`, `\'HORIZONTAL\'`, `\'SIMPLE\'`.',
  },
  pageLanguage: {
    name: 'pageLanguage',
    type: 'string',
    description: 'Source language ISO code of the blog (e.g. \'en\', \'es\', \'fr\').',
  },
  title: {
    name: 'title',
    type: 'string',
    description: 'Widget header title (e.g. \'Translate\').',
  },
};

export const wikipediaWidgetProperties: Record<string, BloggerProperty> = {
  enterTextMsg: {
    name: 'enterTextMsg',
    type: 'string',
    description: 'Localized placeholder/prompt (e.g. \'Enter search terms\').',
  },
  fetchingErrorMsg: {
    name: 'fetchingErrorMsg',
    type: 'string',
    description: 'Localized error message displayed when Wikipedia API query fails.',
  },
  moreMsg: {
    name: 'moreMsg',
    type: 'string',
    description: 'Localized string for expansion/read more link (e.g. \'More\').',
  },
  noResultsFoundMsg: {
    name: 'noResultsFoundMsg',
    type: 'string',
    description: 'Localized message when query yields zero results (e.g. \'No results found\').',
  },
  searchResultsMsg: {
    name: 'searchResultsMsg',
    type: 'string',
    description: 'Localized header for results list (e.g. \'Search Results\').',
  },
  title: {
    name: 'title',
    type: 'string',
    description: 'Widget header title (defaults to \'Wikipedia\' if omitted).',
  },
};

export const reportAbuseWidgetProperties: Record<string, BloggerProperty> = {};

export const WIDGET_DATA_DICTIONARIES: Record<string, Record<string, BloggerProperty>> = {
  AdSense: adSenseWidgetProperties,
  Attribution: attributionWidgetProperties,
  Blog: blogWidgetProperties,
  BlogArchive: blogArchiveWidgetProperties,
  BlogList: blogListWidgetProperties,
  BlogSearch: blogSearchWidgetProperties,
  BloggerButton: bloggerButtonWidgetProperties,
  ContactForm: contactFormWidgetProperties,
  FeaturedPost: featuredPostWidgetProperties,
  Feed: feedWidgetProperties,
  Followers: followersWidgetProperties,
  HTML: htmlWidgetProperties,
  Header: headerWidgetProperties,
  Image: imageWidgetProperties,
  Label: labelWidgetProperties,
  LinkList: linkListWidgetProperties,
  PageList: pageListWidgetProperties,
  PopularPosts: popularPostsWidgetProperties,
  Profile: profileWidgetProperties,
  ReportAbuse: reportAbuseWidgetProperties,
  Stats: statsWidgetProperties,
  Subscribe: subscribeWidgetProperties,
  Text: textWidgetProperties,
  TextList: textListWidgetProperties,
  Translate: translateWidgetProperties,
  Wikipedia: wikipediaWidgetProperties,
};
