import type { BloggerProperty } from '../models/types.js';
import { createArrayProperties } from './typeMembers.js';

export const baseWidgetDescriptorProperties: Record<string, BloggerProperty> = Object.freeze({
  id: {
    name: 'id',
    type: 'string',
    description: 'Unique widget instance ID (e.g. "Blog1", "Header1").',
    docUrl: 'https://bloggercode.orbiona.com/1978/02/data-widgets-id.html',
  },
  sectionId: {
    name: 'sectionId',
    type: 'string',
    description: 'Parent <b:section> identifier containing the widget.',
    docUrl: 'https://bloggercode.orbiona.com/1978/02/data-widgets-sectionId.html',
  },
  title: {
    name: 'title',
    type: 'string',
    description: 'Configured widget header title.',
    docUrl: 'https://bloggercode.orbiona.com/1978/02/data-widgets-title.html',
  },
  type: {
    name: 'type',
    type: 'string',
    description: 'Canonical widget type name (e.g. "Blog", "AdSense").',
    docUrl: 'https://bloggercode.orbiona.com/1978/02/data-widgets-type.html',
  },
});

export const blogDescriptorPostSummaryProperties: Record<string, BloggerProperty> = Object.freeze({
  id: {
    name: 'id',
    type: 'number',
    description: 'Unique numerical post identifier.',
    docUrl: 'https://bloggercode.orbiona.com/1978/02/data-widgets-posts-id.html',
  },
  title: {
    name: 'title',
    type: 'string',
    description: 'Post title string.',
    docUrl: 'https://bloggercode.orbiona.com/1978/02/data-widgets-posts-title.html',
  },
  featuredImage: {
    name: 'featuredImage',
    type: 'image',
    description: 'Primary post hero image URL.',
    docUrl: 'https://bloggercode.orbiona.com/1978/02/data-widgets-posts-featuredImage.html',
  },
  showInlineAds: {
    name: 'showInlineAds',
    type: 'boolean',
    description: 'Inline ads display toggle.',
    docUrl: 'https://bloggercode.orbiona.com/1978/02/data-widgets-posts-showInlineAds.html',
  },
});

export const blogDescriptorBylineItemProperties: Record<string, BloggerProperty> = Object.freeze({
  name: {
    name: 'name',
    type: 'string',
    description: 'Byline item identifier (e.g. "author", "timestamp").',
  },
  label: {
    name: 'label',
    type: 'string',
    description: 'Localized byline label prefix.',
  },
});

export const blogDescriptorRegionProperties: Record<string, BloggerProperty> = Object.freeze({
  regionName: {
    name: 'regionName',
    type: 'string',
    description: 'Name of the byline region (e.g. "header-byline", "footer1").',
  },
  items: {
    name: 'items',
    type: 'array',
    description: 'Byline item objects in region.',
    itemChildren: blogDescriptorBylineItemProperties,
    children: createArrayProperties(blogDescriptorBylineItemProperties),
  },
});

export const blogDescriptorProperties: Record<string, BloggerProperty> = Object.freeze({
  ...baseWidgetDescriptorProperties,
  posts: {
    name: 'posts',
    type: 'array',
    description: 'Summaries of blog posts rendered in the main blog gadget.',
    docUrl: 'https://bloggercode.orbiona.com/1978/02/data-widgets-posts.html',
    itemChildren: blogDescriptorPostSummaryProperties,
    children: createArrayProperties(blogDescriptorPostSummaryProperties),
  },
  headerByline: {
    name: 'headerByline',
    type: 'object',
    description: 'Header byline region descriptor.',
    children: blogDescriptorRegionProperties,
  },
  footerBylines: {
    name: 'footerBylines',
    type: 'array',
    description: 'Array of footer byline regions and item lists.',
    itemChildren: blogDescriptorRegionProperties,
    children: createArrayProperties(blogDescriptorRegionProperties),
  },
  allBylineItems: {
    name: 'allBylineItems',
    type: 'array',
    description: 'Flat list of active byline items.',
    itemChildren: blogDescriptorBylineItemProperties,
    children: createArrayProperties(blogDescriptorBylineItemProperties),
  },
});

export const featuredPostDescriptorProperties: Record<string, BloggerProperty> = Object.freeze({
  ...baseWidgetDescriptorProperties,
  postId: {
    name: 'postId',
    type: 'number',
    description: 'Numerical identifier of the featured post.',
    docUrl: 'https://bloggercode.orbiona.com/1978/02/data-widgets-postId.html',
  },
});

export const popularPostsSummaryProperties: Record<string, BloggerProperty> = Object.freeze({
  id: {
    name: 'id',
    type: 'number',
    description: 'Unique numerical post identifier.',
    docUrl: 'https://bloggercode.orbiona.com/1978/02/data-widgets-posts-id.html',
  },
  title: {
    name: 'title',
    type: 'string',
    description: 'Post title string.',
    docUrl: 'https://bloggercode.orbiona.com/1978/02/data-widgets-posts-title.html',
  },
});

export const popularPostsDescriptorProperties: Record<string, BloggerProperty> = Object.freeze({
  ...baseWidgetDescriptorProperties,
  posts: {
    name: 'posts',
    type: 'array',
    description: 'Summaries of popular posts in the gadget.',
    docUrl: 'https://bloggercode.orbiona.com/1978/02/data-widgets-posts.html',
    itemChildren: popularPostsSummaryProperties,
    children: createArrayProperties(popularPostsSummaryProperties),
  },
});

export const WIDGET_DESCRIPTORS_MAP: Record<string, Record<string, BloggerProperty>> = Object.freeze({
  AdSense: baseWidgetDescriptorProperties,
  Attribution: baseWidgetDescriptorProperties,
  Blog: blogDescriptorProperties,
  BlogArchive: baseWidgetDescriptorProperties,
  BloggerButton: baseWidgetDescriptorProperties,
  BlogList: baseWidgetDescriptorProperties,
  BlogSearch: baseWidgetDescriptorProperties,
  ContactForm: baseWidgetDescriptorProperties,
  FeaturedPost: featuredPostDescriptorProperties,
  Feed: baseWidgetDescriptorProperties,
  Followers: baseWidgetDescriptorProperties,
  Header: baseWidgetDescriptorProperties,
  HTML: baseWidgetDescriptorProperties,
  Image: baseWidgetDescriptorProperties,
  Label: baseWidgetDescriptorProperties,
  LinkList: baseWidgetDescriptorProperties,
  PageList: baseWidgetDescriptorProperties,
  PopularPosts: popularPostsDescriptorProperties,
  Profile: baseWidgetDescriptorProperties,
  ReportAbuse: baseWidgetDescriptorProperties,
  Stats: baseWidgetDescriptorProperties,
  Subscribe: baseWidgetDescriptorProperties,
  Text: baseWidgetDescriptorProperties,
  TextList: baseWidgetDescriptorProperties,
  Translate: baseWidgetDescriptorProperties,
  Wikipedia: baseWidgetDescriptorProperties,
});

export function getWidgetDescriptor(typeOrId: string): Record<string, BloggerProperty> {
  if (WIDGET_DESCRIPTORS_MAP[typeOrId]) {
    return WIDGET_DESCRIPTORS_MAP[typeOrId];
  }
  const typeWithoutIndex = typeOrId.replace(/\d+$/, '');
  if (WIDGET_DESCRIPTORS_MAP[typeWithoutIndex]) {
    return WIDGET_DESCRIPTORS_MAP[typeWithoutIndex];
  }
  return baseWidgetDescriptorProperties;
}
