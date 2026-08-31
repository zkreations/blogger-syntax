export type BloggerDataType
  = | 'string'
    | 'number'
    | 'boolean'
    | 'url'
    | 'image'
    | 'date'
    | 'message'
    | 'object'
    | 'array';

export interface BloggerProperty {
  readonly name: string;
  readonly type: BloggerDataType;
  readonly description?: string | undefined;
  readonly deprecated?: boolean | undefined;
  readonly children?: Record<string, BloggerProperty> | undefined;
}

export type BloggerSuggestionKind = 'property' | 'enumMember' | 'variable' | 'class' | 'value' | 'snippet';

export interface BloggerSuggestion {
  readonly name: string;
  readonly type: BloggerDataType;
  readonly description?: string | undefined;
  readonly insertText?: string | undefined;
  readonly isSnippet?: boolean | undefined;
  readonly kind: BloggerSuggestionKind;
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
}

export interface BloggerTagDefinition {
  readonly name: string;
  readonly description: string;
  readonly attributes?: Record<string, BloggerTagAttribute> | undefined;
  readonly selfClosing?: boolean | undefined;
  readonly snippetBody?: string | undefined;
}
