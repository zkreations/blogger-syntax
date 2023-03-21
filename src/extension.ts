import * as vscode from 'vscode';


const bloggerData = {
  data: [
    'blog',
    'messages',
    'skin',
    'view',
    'widget',
    'widgets',
  ],
  blog: [
    'adsenseAutoAds',
    'adsenseClientId',
    'adsenseHasAds',
    'adsenseHostId',
    'adultContent',
    'analyticsAccountNumber',
    'bloggerUrl',
    'blogId',
    'blogspotFaviconUrl',
    'encoding',
    'hasCustomDomain',
    'homepageUrl',
    'httpsEnabled',
    'isMobileRequest',
    'isPrivate',
    'isPrivateBlog',
    'locale.country',
    'locale.language',
    'locale.languageAlignment',
    'locale.languageDirection',
    'locale.name',
    'locale',
    'metaDescription',
    'pageId',
    'pageName',
    'pageTitle',
    'pageType',
    'postId',
    'postImageThumbnailUrl',
    'postImageUrl',
    'searchLabel',
    'searchQuery',
    'searchUrl',
    'title',
    'url',
  ],
  messages: [
    'adsGoHere',
    'archive',
    'at',
    'authorSaid',
    'authorSaidWithLink',
    'blogArchive',
    'blogAuthors',
    'by',
    'comments',
    'configurationRequired',
    'copy',
    'copyToClipboard',
    'deleteComment',
    'edit',
    'emailAddress',
    'emailPost',
    'featured',
    'getEmailNotifications',
    'gotIt',
    'hidden',
    'home',
    'image',
    'joinTheConversation',
    'keepReading',
    'labels',
    'latestPosts',
    'learnMore',
    'linkCopiedToClipboard',
    'loading',
    'loadMorePosts',
    'moreEllipsis',
    'morePosts',
    'myBlogList',
    'myFavoriteSites',
    'myPhoto',
    'newer',
    'newerPosts',
    'newest',
    'noResultsFound',
    'noTitle',
    'numberOfComments',
    'ok',
    'older',
    'olderPosts',
    'oldest',
    'on',
    'photo',
    'popularPosts',
    'postAComment',
    'postedBy',
    'postLink',
    'posts',
    'poweredByBlogger',
    'readMore',
    'recentPosts',
    'reportAbuse',
    'search',
    'searchBlog',
    'searchThisBlog',
    'share',
    'shareOtherApps',
    'shareToOtherApps',
    'showAll',
    'showLess',
    'showMore',
    'subscribe',
    'subscribeTo',
    'subscribeToThisBlog',
    'theresNothingHere',
    'title',
    'viewAll',
    'viewMyCompleteProfile',
    'visible',
    'visitProfile',
    'visitSite',
    'widget',
  ],
  skin: [
    'override',
    'vars',
  ],
  view: [
    'postId',
    'pageId',
    'type',
    'featuredImage',
    'title',
    'description',
    'url',
    'isHomepage',
    'isPost',
    'isPage',
    'isSingleItem',
    'isMultipleItems',
    'isArchive',
    'isError',
    'isSearch',
    'isLabelSearch',
    'isPreview',
    'isLayoutMode',
  ],
  widget: [
    'instanceId',
    'sectionId',
    'type',
    'version',
  ],
  widgets: [
    'AdSense',
    'Blog',
    'BlogArchive',
    'BlogList',
    'BlogSearch',
    'ContactForm',
    'FeaturedPost',
    'Feed',
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
  ]
};

const bloggerSuggestions = {
  'data:': bloggerData.data,
  'data:blog.': bloggerData.blog,
  'data:messages.': bloggerData.messages,
  'data:skin.': bloggerData.skin,
  'data:view.': bloggerData.view,
  'data:widget.': bloggerData.widget,
  'data:widgets.': bloggerData.widgets
};

function createCompletionProvider(language: string): vscode.Disposable {
  return vscode.languages.registerCompletionItemProvider(language, {
    provideCompletionItems(document: vscode.TextDocument, position: vscode.Position) {
      const linePrefix = document.lineAt(position).text.substr(0, position.character);

      for (const [prefix, suggestions] of Object.entries(bloggerSuggestions)) {
        if (linePrefix.endsWith(prefix)) {
          return suggestions.map(field => new vscode.CompletionItem(field, vscode.CompletionItemKind.Field));
        }
      }

      return undefined;
    }
  }, '.', ':');
}


export function activate(context: vscode.ExtensionContext) {

  const xmlProvider = createCompletionProvider('xml');
  const handlebarsProvider = createCompletionProvider('handlebars');

  context.subscriptions.push(xmlProvider, handlebarsProvider);
}
