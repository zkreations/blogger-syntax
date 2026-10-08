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

  public intersection(other: Range): Range | undefined {
    const startLine = Math.max(this.start.line, other.start.line);
    const endLine = Math.min(this.end.line, other.end.line);
    if (startLine > endLine)
      return undefined;
    let startChar = 0;
    if (this.start.line === other.start.line) {
      startChar = Math.max(this.start.character, other.start.character);
    }
    else if (startLine === this.start.line) {
      startChar = this.start.character;
    }
    else {
      startChar = other.start.character;
    }
    let endChar = 0;
    if (this.end.line === other.end.line) {
      endChar = Math.min(this.end.character, other.end.character);
    }
    else if (endLine === this.end.line) {
      endChar = this.end.character;
    }
    else {
      endChar = other.end.character;
    }
    if (startLine === endLine && startChar > endChar)
      return undefined;
    return new Range(startLine, startChar, endLine, endChar);
  }
}

export class SnippetString {
  constructor(public value: string = '') {}
}

export class MockTextDocument {
  public readonly lines: string[];
  public readonly uri: { toString: () => string };
  public readonly version: number;
  public readonly languageId: string;

  constructor(
    content: string | string[],
    uriString: string = 'file:///mock.xml',
    version: number = 1,
    languageId: string = 'xml',
  ) {
    this.lines = Array.isArray(content) ? content : content.split('\n');
    this.uri = { toString: () => uriString };
    this.version = version;
    this.languageId = languageId;
  }

  get lineCount(): number {
    return this.lines.length;
  }

  public lineAt(lineOrPos: number | Position): { text: string } {
    const lineNum = typeof lineOrPos === 'number' ? lineOrPos : lineOrPos.line;
    return { text: this.lines[lineNum] ?? '' };
  }

  public getText(): string {
    return this.lines.join('\n');
  }

  public offsetAt(position: Position): number {
    let offset = 0;
    for (let l = 0; l < position.line; l++) {
      offset += (this.lines[l]?.length ?? 0) + 1;
    }
    return offset + position.character;
  }

  public positionAt(offset: number): Position {
    let current = 0;
    for (let l = 0; l < this.lines.length; l++) {
      const lineLen = (this.lines[l]?.length ?? 0) + 1;
      if (current + lineLen > offset || l === this.lines.length - 1) {
        return new Position(l, Math.max(0, offset - current));
      }
      current += lineLen;
    }
    return new Position(0, 0);
  }
}

export interface CompletionItemLabel {
  label: string;
  detail?: string;
  description?: string;
}

export class CompletionItem {
  public label: string | CompletionItemLabel;
  public kind?: CompletionItemKind | undefined;
  public detail?: string | undefined;
  public documentation?: MarkdownString | string | undefined;
  public range?: Range | undefined;
  public insertText?: string | SnippetString | undefined;
  public command?: { title: string; command: string; arguments?: any[] } | undefined;
  public sortText?: string | undefined;
  public filterText?: string | undefined;

  constructor(label: string | CompletionItemLabel, kind?: CompletionItemKind | undefined) {
    this.label = label;
    this.kind = kind;
  }
}

export class CompletionList<T extends CompletionItem = CompletionItem> extends Array<T> {
  static get [Symbol.species]() {
    return Array;
  }

  public items: T[];
  public isIncomplete: boolean;

  constructor(items: T[] | number = [], isIncomplete: boolean = false) {
    if (typeof items === 'number') {
      super(items);
      this.items = [];
      this.isIncomplete = isIncomplete;
    }
    else {
      super(...items);
      this.items = items;
      this.isIncomplete = isIncomplete;
    }
  }
}

export class MarkdownString {
  public value: string;
  public isTrusted?: boolean | undefined;
  public supportThemeIcons?: boolean | undefined;

  constructor(value: string = '', supportThemeIcons?: boolean | undefined) {
    this.value = value;
    this.supportThemeIcons = supportThemeIcons;
  }

  public appendText(value: string): MarkdownString {
    this.value += value;
    return this;
  }

  public appendMarkdown(value: string): MarkdownString {
    this.value += value;
    return this;
  }

  public appendCodeblock(value: string, language: string = ''): MarkdownString {
    this.value += `\n\`\`\`${language}\n${value}\n\`\`\`\n`;
    return this;
  }
}

export class Hover {
  public contents: (MarkdownString | string)[];

  constructor(
    contents: MarkdownString | string | (MarkdownString | string)[],
    public readonly range?: Range,
  ) {
    this.contents = Array.isArray(contents) ? contents : [contents];
  }
}

export class Disposable {
  constructor(private readonly callOnDispose: () => void) {}

  public dispose(): void {
    this.callOnDispose();
  }
}

export enum DiagnosticSeverity {
  Error = 0,
  Warning = 1,
  Information = 2,
  Hint = 3,
}

export enum DiagnosticTag {
  Unnecessary = 1,
  Deprecated = 2,
}

export class Diagnostic {
  public code?: string | number | { value: string | number; target: any };
  public source?: string;
  public tags?: DiagnosticTag[];

  constructor(
    public range: Range,
    public message: string,
    public severity: DiagnosticSeverity = DiagnosticSeverity.Error,
  ) {}
}

export interface DiagnosticCollection {
  name: string;
  set: (uri: any, diagnostics: readonly Diagnostic[] | undefined) => void;
  delete: (uri: any) => void;
  clear: () => void;
  dispose: () => void;
}

export const CodeActionKind = {
  QuickFix: { value: 'quickfix' },
  Refactor: { value: 'refactor' },
  Source: { value: 'source' },
};

export class CodeAction {
  public edit?: WorkspaceEdit;
  public isPreferred?: boolean;

  constructor(
    public title: string,
    public kind?: { value: string },
  ) {}
}

export class WorkspaceEdit {
  public readonly entries = new Map<string, { range: Range; newText: string }[]>();

  public replace(uri: any, range: Range, newText: string): void {
    const uriStr = uri?.toString?.() ?? String(uri);
    const list = this.entries.get(uriStr) ?? [];
    list.push({ range, newText });
    this.entries.set(uriStr, list);
  }
}

export class Location {
  constructor(public uri: any, public range: Range) {}
}

export enum SymbolKind {
  File = 0,
  Module = 1,
  Namespace = 2,
  Package = 3,
  Class = 4,
  Method = 5,
  Property = 6,
  Field = 7,
  Constructor = 8,
  Enum = 9,
  Interface = 10,
  Function = 11,
  Variable = 12,
  Constant = 13,
  String = 14,
  Number = 15,
  Boolean = 16,
  Array = 17,
  Object = 18,
  Key = 19,
  Null = 20,
  EnumMember = 21,
  Struct = 22,
  Event = 23,
  Operator = 24,
  TypeParameter = 25,
}

export class DocumentSymbol {
  public children: DocumentSymbol[] = [];

  constructor(
    public name: string,
    public detail: string,
    public kind: SymbolKind,
    public range: Range,
    public selectionRange: Range,
  ) {}
}

export enum StatusBarAlignment {
  Left = 1,
  Right = 2,
}

export class MockStatusBarItem {
  public text: string = '';
  public tooltip: string = '';
  public command?: string;
  public isVisible: boolean = false;

  public show(): void {
    this.isVisible = true;
  }

  public hide(): void {
    this.isVisible = false;
  }

  public dispose(): void {}
}

export const languages = {
  registerCompletionItemProvider: () => new Disposable(() => {}),
  registerHoverProvider: () => new Disposable(() => {}),
  registerCodeActionsProvider: () => new Disposable(() => {}),
  registerDefinitionProvider: () => new Disposable(() => {}),
  registerDocumentSymbolProvider: () => new Disposable(() => {}),
  createDiagnosticCollection: (name: string = 'default'): DiagnosticCollection => {
    const store = new Map<string, readonly Diagnostic[]>();
    return {
      name,
      set: (uri: any, diagnostics: readonly Diagnostic[] | undefined) => {
        store.set(uri?.toString?.() ?? String(uri), diagnostics ?? []);
      },
      delete: (uri: any) => {
        store.delete(uri?.toString?.() ?? String(uri));
      },
      clear: () => {
        store.clear();
      },
      dispose: () => {
        store.clear();
      },
    };
  },
};

export const window = {
  activeTextEditor: undefined as {
    document: { lineAt: (line: number) => { text: string }; lineCount: number; getText: () => string; offsetAt: (p: Position) => number; positionAt: (o: number) => Position; languageId: string };
    selection: { active: Position };
  } | undefined,
  onDidChangeTextEditorSelection: () => new Disposable(() => {}),
  onDidChangeActiveTextEditor: () => new Disposable(() => {}),
  createStatusBarItem: (_alignment?: StatusBarAlignment, _priority?: number) => new MockStatusBarItem(),
  showInformationMessage: async (_msg: string) => undefined,
};

export const commands = {
  executeCommand: async () => {},
  registerCommand: (_command: string, _callback: (...args: any[]) => any) => new Disposable(() => {}),
};

export const workspace = {
  textDocuments: [] as MockTextDocument[],
  getConfiguration: (_section?: string) => ({
    get: <T>(_key: string, defaultValue: T): T => defaultValue,
  }),
  onDidOpenTextDocument: () => new Disposable(() => {}),
  onDidSaveTextDocument: () => new Disposable(() => {}),
  onDidChangeTextDocument: () => new Disposable(() => {}),
  onDidCloseTextDocument: () => new Disposable(() => {}),
  onDidChangeConfiguration: () => new Disposable(() => {}),
};
