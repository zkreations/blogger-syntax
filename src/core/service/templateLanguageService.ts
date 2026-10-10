import type { BloggerDiagnostic, LinterOptions } from '../linter/linterTypes.js';
import type {
  BloggerHoverInfo,
  BloggerSuggestion,
} from '../models/types.js';
import type { IncludableDefinitionMatch } from '../navigation/definitionResolver.js';
import type { BloggerSymbolNode } from '../navigation/symbolIndexer.js';
import type { TemplateVersionResult } from '../version/templateVersion.js';
import { lintBloggerDocument } from '../linter/linterEngine.js';
import { findIncludableDefinition } from '../navigation/definitionResolver.js';
import { indexDocumentSymbols } from '../navigation/symbolIndexer.js';
import { getNearestUnclosedTag } from '../parser/directiveScanner.js';
import { resolveHoverAtPosition } from '../resolver/hoverCardResolver.js';
import { BloggerPathResolver } from '../resolver/pathResolver.js';
import { hasAttributeValueCompletions } from '../resolver/tagAttributeResolver.js';
import { BloggerScopeTracker } from '../scope/scopeTracker.js';
import { detectTemplateVersion } from '../version/templateVersion.js';

export interface TemplateSummary {
  readonly version: TemplateVersionResult;
  readonly sectionCount: number;
  readonly widgetCount: number;
  readonly includableCount: number;
  readonly symbols: readonly BloggerSymbolNode[];
}

export interface CompletionResult {
  readonly suggestions: readonly BloggerSuggestion[];
  readonly replacementRange: {
    readonly start: number;
    readonly end: number;
  };
}

export interface HoverResult {
  readonly hover: BloggerHoverInfo;
  readonly range: {
    readonly start: number;
    readonly end: number;
  };
}

export interface LanguageServiceOptions {
  readonly docKey?: string | undefined;
  readonly version?: number | undefined;
}

export class TemplateLanguageService {
  constructor(
    private readonly pathResolver: BloggerPathResolver = new BloggerPathResolver(),
    private readonly scopeTracker: BloggerScopeTracker = new BloggerScopeTracker(),
  ) {}

  public getCompletions(
    documentText: string,
    offset: number,
    options?: LanguageServiceOptions,
  ): CompletionResult | undefined {
    if (offset < 0 || offset > documentText.length) {
      return undefined;
    }

    const lastNewline = documentText.lastIndexOf('\n', offset - 1);
    const lineStart = lastNewline === -1 ? 0 : lastNewline + 1;
    const nextNewline = documentText.indexOf('\n', offset);
    const lineEnd = nextNewline === -1 ? documentText.length : nextNewline;

    const linePrefix = documentText.slice(lineStart, offset);
    const lineSuffix = documentText.slice(offset, lineEnd);

    const docKey = options?.docKey ?? 'untitled';
    const version = options?.version ?? 0;

    const getLocalVariables = () => {
      return this.scopeTracker.getActiveVariables(docKey, version, documentText, offset);
    };

    const widgetType = this.scopeTracker.getEnclosingWidgetType(docKey, version, documentText, offset);
    const includables = this.scopeTracker.getAvailableIncludables(docKey, version, documentText, offset);
    const enclosingMessageName = this.scopeTracker.getEnclosingMessageName(documentText, offset);
    const nearestOpenTag = getNearestUnclosedTag(documentText, offset);

    const resolverContext = {
      localVariables: getLocalVariables,
      widgetType,
      includables,
      enclosingMessageName,
      nearestOpenTag,
      lineSuffix,
    };

    let result = this.pathResolver.resolveFromLinePrefix(linePrefix, resolverContext);

    // Fallback: Multi-line lookback up to 15 lines if no completion was found on the current prefix
    if (!result && lineStart > 0) {
      const textBefore = documentText.slice(0, offset);
      const lines = textBefore.split('\n');
      const startLineIndex = Math.max(0, lines.length - 1 - 15);
      const multiLineText = lines.slice(startLineIndex).join('\n');
      result = this.pathResolver.resolveFromLinePrefix(multiLineText, resolverContext);
    }

    if (!result || result.suggestions.length === 0) {
      return undefined;
    }

    const startOffset = Math.max(lineStart, offset - result.replacementLength);
    let endOffset = offset;

    const isTagSnippet = result.suggestions.some(s => s.kind === 'snippet' && s.insertText?.includes('/>'));
    if (isTagSnippet) {
      const match = /^(:?\s*\/?>)/.exec(lineSuffix);
      if (match && match[1]) {
        endOffset += match[1].length;
      }
    }

    return {
      suggestions: result.suggestions,
      replacementRange: {
        start: startOffset,
        end: endOffset,
      },
    };
  }

  public getHover(
    documentText: string,
    offset: number,
    options?: LanguageServiceOptions,
  ): HoverResult | undefined {
    if (offset < 0 || offset > documentText.length) {
      return undefined;
    }

    const lastNewline = documentText.lastIndexOf('\n', offset - 1);
    const lineStart = lastNewline === -1 ? 0 : lastNewline + 1;
    const nextNewline = documentText.indexOf('\n', offset);
    const lineEnd = nextNewline === -1 ? documentText.length : nextNewline;

    const lineText = documentText.slice(lineStart, lineEnd);
    const character = offset - lineStart;

    const docKey = options?.docKey ?? 'untitled';
    const version = options?.version ?? 0;

    const getLocalVariables = () => {
      return this.scopeTracker.getActiveVariables(docKey, version, documentText, offset);
    };

    const widgetType = this.scopeTracker.getEnclosingWidgetType(docKey, version, documentText, offset);
    const enclosingMessageName = this.scopeTracker.getEnclosingMessageName(documentText, offset);

    const getPrecedingContext = (): string | undefined => {
      if (lineStart === 0) {
        return undefined;
      }
      const textBeforeLine = documentText.slice(0, lineStart - 1);
      const lines = textBeforeLine.split('\n');
      const startLineIndex = Math.max(0, lines.length - 15);
      return lines.slice(startLineIndex).join('\n');
    };

    const result = resolveHoverAtPosition(
      lineText,
      character,
      getPrecedingContext,
      { localVariables: getLocalVariables, widgetType, enclosingMessageName },
    );

    if (!result) {
      return undefined;
    }

    return {
      hover: result.hover,
      range: {
        start: lineStart + result.range.start,
        end: lineStart + result.range.end,
      },
    };
  }

  public getDefinition(
    documentText: string,
    offset: number,
  ): IncludableDefinitionMatch | undefined {
    return findIncludableDefinition(documentText, offset);
  }

  public getDocumentSymbols(
    documentText: string,
  ): BloggerSymbolNode[] {
    return indexDocumentSymbols(documentText);
  }

  public getDiagnostics(
    documentText: string,
    options?: LinterOptions,
  ): readonly BloggerDiagnostic[] {
    return lintBloggerDocument(documentText, options);
  }

  public getTemplateVersion(documentText: string): TemplateVersionResult {
    return detectTemplateVersion(documentText);
  }

  public getTemplateSummary(documentText: string): TemplateSummary {
    const version = this.getTemplateVersion(documentText);
    const symbols = this.getDocumentSymbols(documentText);

    let sectionCount = 0;
    let widgetCount = 0;
    let includableCount = 0;

    for (const sym of symbols) {
      if (sym.kind === 'section') {
        sectionCount++;
        for (const child of sym.children) {
          if (child.kind === 'widget') {
            widgetCount++;
            for (const sub of child.children) {
              if (sub.kind === 'includable') {
                includableCount++;
              }
            }
          }
        }
      }
    }

    return {
      version,
      sectionCount,
      widgetCount,
      includableCount,
      symbols,
    };
  }

  public hasAttributeValueCompletions(tagName: string, attrName: string): boolean {
    return hasAttributeValueCompletions(tagName, attrName);
  }

  public clearCache(docKey?: string): void {
    this.scopeTracker.clearCache(docKey);
  }
}
