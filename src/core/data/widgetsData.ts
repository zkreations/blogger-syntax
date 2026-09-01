import type { BloggerProperty } from '../models/types.js';

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
  },
  feedLinks: {
    name: 'feedLinks',
    type: 'array',
    description: 'Collection of feed links associated with the post.',
    docUrl: 'https://bloggercode.orbiona.com/2021/10/posts-feedLinks.html',
  },
  comments: {
    name: 'comments',
    type: 'array',
    description: 'Collection of comments associated with the post.',
    docUrl: 'https://bloggercode.orbiona.com/1973/03/Blog-data-posts-comments.html',
  },
  enclosures: {
    name: 'enclosures',
    type: 'array',
    description: 'Collection of media enclosures associated with the post.',
    docUrl: 'https://bloggercode.orbiona.com/1973/01/Blog-data-posts-enclosures.html',
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
  },
  posts: {
    name: 'posts',
    type: 'object',
    description: 'Collection of posts available in the current widget context.',
    docUrl: 'https://bloggercode.orbiona.com/1971/08/data-posts.html',
    children: singlePostProperties,
  },
};
