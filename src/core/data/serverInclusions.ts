/**
 * Canonical catalog of platform-level inclusions resolved directly
 * by Google Blogger's backend rendering engine.
 * Reference: Horatio - universal-inclusions.md & common-inclusions.md
 */

export const UNIVERSAL_INCLUSIONS: readonly string[] = [
  'all-head-content',
  'google-analytics',
  'urlParamsAsFormInput',
  'quickedit',
  'googlePlusBootstrap',
] as const;

export const COMMON_INCLUSIONS: readonly string[] = [
  // Original Markup - Gadget Version 1 & 2
  'openGraphMetaData',
  'reportAbuse',
  'responsiveImageStyle',

  // Original Markup - Gadget Version 2
  'backArrowIcon',
  'chevronDownIcon',
  'chevronUpIcon',
  'commentIcon',
  'defaultAvatarIcon',
  'emailIcon',
  'extendableItems',
  'facebookIcon',
  'flatBloggerIcon',
  'footerBylinesOverride',
  'forwardArrowIcon',
  'headerBylineOverride',
  'linkIcon',
  'maybeAddShareButtons',
  'menuIcon',
  'noContentPlaceholder',
  'pinterestIcon',
  'postMetadataJSON',
  'postSnippet',
  'responsiveImage',
  'searchIcon',
  'shareIcon',
  'sharingOtherIcon',
  'skipNavigation',
  'svgIcon',
  'svgIconButton',
  'twitterIcon',
  'verticalMoreIcon',
  'widget-title',
  'widgetNotAvailableInPreview',

  // Theme Markup - Explicit in Emporio
  'feedPostImage',
  'standardPostImageStyle',

  // Theme Markup - Explicit in Notable
  'heroPost',
  'heroPostSnippet',
  'normalPost',
  'normalPostBodySnippet',
  'postBody',
  'postBodySnippet',
  'postTitle',

  // Deprecated / Sunset platform inclusions
  'googlePlusIcon',
] as const;

const UNIVERSAL_INCLUSIONS_SET = new Set<string>(UNIVERSAL_INCLUSIONS);
const COMMON_INCLUSIONS_SET = new Set<string>(COMMON_INCLUSIONS);

/**
 * Checks if an inclusion name is resolved server-side by the Blogger platform.
 */
export function isServerInclusion(name: string): boolean {
  if (!name) {
    return false;
  }
  if (name.startsWith('super.')) {
    return true;
  }
  return UNIVERSAL_INCLUSIONS_SET.has(name) || COMMON_INCLUSIONS_SET.has(name);
}
