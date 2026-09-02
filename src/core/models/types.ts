export type BloggerDataType
  = | 'string'
    | 'number'
    | 'boolean'
    | 'url'
    | 'image'
    | 'date'
    | 'locale'
    | 'message'
    | 'object'
    | 'array';

export interface BloggerProperty {
  readonly name: string;
  readonly type: BloggerDataType;
  readonly description?: string | undefined;
  readonly deprecated?: boolean | undefined;
  readonly example?: string | undefined;
  readonly docUrl?: string | readonly string[] | undefined;
  readonly children?: Record<string, BloggerProperty> | undefined;
  readonly itemChildren?: Record<string, BloggerProperty> | undefined;
}

export type BloggerSuggestionKind = 'property' | 'enumMember' | 'snippet';

export interface BloggerSuggestion {
  readonly name: string;
  readonly type: BloggerDataType;
  readonly description?: string | undefined;
  readonly detail?: string | undefined;
  readonly insertText?: string | undefined;
  readonly isSnippet?: boolean | undefined;
  readonly kind: BloggerSuggestionKind;
  readonly example?: string | undefined;
  readonly attributes?: Record<string, BloggerTagAttribute> | undefined;
  readonly deprecated?: boolean | undefined;
  readonly docUrl?: string | readonly string[] | undefined;
}

export interface BloggerResolveResult {
  readonly suggestions: readonly BloggerSuggestion[];
  readonly replacementLength: number;
}

export interface BloggerTagAttribute {
  readonly name: string;
  readonly type: string;
  readonly required?: boolean | undefined;
  readonly description?: string | undefined;
  readonly values?: readonly string[] | undefined;
  readonly docUrl?: string | readonly string[] | undefined;
}

export interface BloggerTagDefinition {
  readonly name: string;
  readonly description: string;
  readonly snippetBody: string;
  readonly detail?: string | undefined;
  readonly attributes?: Record<string, BloggerTagAttribute> | undefined;
  readonly example?: string | undefined;
  readonly docUrl?: string | readonly string[] | undefined;
}

export interface BloggerHoverInfo {
  readonly title: string;
  readonly category: 'tag' | 'data' | 'attribute' | 'prefix';
  readonly type?: BloggerDataType | string | undefined;
  readonly description?: string | undefined;
  readonly example?: string | undefined;
  readonly docUrls?: readonly string[] | undefined;
}

export interface BloggerHoverResult {
  readonly hover: BloggerHoverInfo;
  readonly range: {
    readonly start: number;
    readonly end: number;
  };
}
