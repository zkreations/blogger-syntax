export enum CompletionItemKind {
  Text = 0,
  Method = 1,
  Function = 2,
  Constructor = 3,
  Field = 4,
  Variable = 5,
  Class = 6,
  Interface = 7,
  Module = 8,
  Property = 9,
  Unit = 10,
  Value = 11,
  Enum = 12,
  Keyword = 13,
  Snippet = 14,
  Color = 15,
  File = 16,
  Reference = 17,
  Folder = 18,
  EnumMember = 19,
  Constant = 20,
  Struct = 21,
  Event = 22,
  Operator = 23,
  TypeParameter = 24,
}

export class Position {
  constructor(
    public readonly line: number,
    public readonly character: number,
  ) {}
}

export class Range {
  public readonly start: Position;
  public readonly end: Position;

  constructor(startLine: number, startCharacter: number, endLine: number, endCharacter: number);
  constructor(start: Position, end: Position);
  constructor(
    arg1: number | Position,
    arg2: number | Position,
    arg3?: number,
    arg4?: number,
  ) {
    if (typeof arg1 === 'number' && typeof arg2 === 'number' && typeof arg3 === 'number' && typeof arg4 === 'number') {
      this.start = new Position(arg1, arg2);
      this.end = new Position(arg3, arg4);
    }
    else {
      this.start = arg1 as Position;
      this.end = arg2 as Position;
    }
  }
}

export class SnippetString {
  constructor(public value: string = '') {}
}

export class CompletionItem {
  public label: string;
  public kind?: CompletionItemKind;
  public detail?: string;
  public documentation?: MarkdownString | string;
  public range?: Range;
  public insertText?: string | SnippetString;

  constructor(label: string, kind?: CompletionItemKind) {
    this.label = label;
    this.kind = kind;
  }
}

export class MarkdownString {
  public value: string;
  public isTrusted?: boolean;

  constructor(value: string = '') {
    this.value = value;
  }
}

export const languages = {
  registerCompletionItemProvider: () => ({ dispose: () => {} }),
};
