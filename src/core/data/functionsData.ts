import type { BloggerDataType, BloggerSuggestion } from '../models/types.js';

export interface BloggerFunctionDefinition {
  readonly name: string;
  readonly returnType: BloggerDataType;
  readonly signature: string;
  readonly description: string;
  readonly example: string;
  readonly snippetBody: string;
  readonly docUrl?: string | undefined;
}

export const bloggerFunctionsCatalog: Record<string, BloggerFunctionDefinition> = {
  snippet: {
    name: 'snippet',
    returnType: 'string',
    signature: 'snippet(text, { length: 150, links: false, linebreaks: false, ellipsis: true })',
    description: 'Generates a clean, plain text or shortened excerpt from HTML body content, stripping unsafe markup.',
    example: 'snippet(data:post.body, { length: 150, links: false, linebreaks: false, ellipsis: true })',
    snippetBody: 'snippet(${1:data:post.body}, { length: ${2:150}, links: ${3:false}, linebreaks: ${4:false}, ellipsis: ${5:true} })',
    docUrl: 'https://bloggercode.orbiona.com/2017/05/lambda-expressions.html',
  },
  resizeImage: {
    name: 'resizeImage',
    returnType: 'image',
    signature: 'resizeImage(imageUrl, size, "ratio")',
    description: 'Generates a resized and cropped image URL from Blogger CDN with an optional aspect ratio ("1:1", "4:3", "16:9").',
    example: 'resizeImage(data:post.featuredImage, 300, "1:1")',
    snippetBody: 'resizeImage(${1:data:post.featuredImage}, ${2:300}, "${3|1:1,4:3,16:9|}")',
    docUrl: 'https://bloggercode.orbiona.com/2017/05/lambda-expressions.html',
  },
  sourceSet: {
    name: 'sourceSet',
    returnType: 'string',
    signature: 'sourceSet(imageUrl, [sizes], "ratio")',
    description: 'Generates a responsive HTML srcset attribute string with multiple target widths from Blogger CDN.',
    example: 'sourceSet(data:post.featuredImage, [200, 400, 800], "16:9")',
    snippetBody: 'sourceSet(${1:data:post.featuredImage}, [${2:200, 400, 800}], "${3|16:9,4:3,1:1|}")',
    docUrl: 'https://bloggercode.orbiona.com/2017/05/lambda-expressions.html',
  },
};

export function getGlobalFunctionSuggestions(): readonly BloggerSuggestion[] {
  return Object.values(bloggerFunctionsCatalog).map(fn => ({
    name: fn.name,
    type: fn.returnType,
    kind: 'snippet' as const,
    isSnippet: true,
    insertText: fn.snippetBody,
    detail: '(Blogger Built-in Function)',
    description: `${fn.description}\n\n**Signature:** \`${fn.signature}\``,
    example: fn.example,
    docUrl: fn.docUrl,
  }));
}
