export type BloggerDiagnosticSeverity = 'error' | 'warning' | 'info' | 'hint';

export interface TextPosition {
  readonly line: number;
  readonly character: number;
}

export interface TextRange {
  readonly start: TextPosition;
  readonly end: TextPosition;
}

export interface BloggerTextEdit {
  readonly range: TextRange;
  readonly newText: string;
}

export interface BloggerQuickFix {
  readonly title: string;
  readonly newText: string;
  readonly range: TextRange;
  readonly edits?: readonly BloggerTextEdit[] | undefined;
  readonly isPreferred?: boolean | undefined;
}

export interface BloggerDiagnostic {
  readonly code: string;
  readonly message: string;
  readonly severity: BloggerDiagnosticSeverity;
  readonly range: TextRange;
  readonly tags?: readonly ('deprecated' | 'unnecessary')[] | undefined;
  readonly quickFixes?: readonly BloggerQuickFix[] | undefined;
}

export interface LinterRuleOptions {
  readonly deprecations?: boolean | undefined;
  readonly hallucinations?: boolean | undefined;
  readonly quotas?: boolean | undefined;
  readonly context?: boolean | undefined;
  readonly duplicates?: boolean | undefined;
  readonly inclusions?: boolean | undefined;
  readonly attributes?: boolean | undefined;
  readonly structure?: boolean | undefined;
}

export interface LinterOptions {
  readonly rules?: LinterRuleOptions | undefined;
}
