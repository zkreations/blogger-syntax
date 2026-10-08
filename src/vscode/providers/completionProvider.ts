import type { BloggerPathResolver } from '../../core/resolver/pathResolver.js';
import type { BloggerScopeTracker } from '../../core/scope/scopeTracker.js';
import * as vscode from 'vscode';
import { TemplateLanguageService } from '../../core/service/templateLanguageService.js';
import { createCompletionItems } from '../utils/completionAdapter.js';
import { getDocumentOffset, getDocumentText } from '../utils/documentHelper.js';

export class BloggerCompletionProvider implements vscode.CompletionItemProvider {
  private readonly service: TemplateLanguageService;

  constructor(
    serviceOrResolver?: TemplateLanguageService | BloggerPathResolver,
    scopeTracker?: BloggerScopeTracker,
  ) {
    if (serviceOrResolver instanceof TemplateLanguageService) {
      this.service = serviceOrResolver;
    }
    else if (serviceOrResolver) {
      this.service = new TemplateLanguageService(serviceOrResolver, scopeTracker);
    }
    else {
      this.service = new TemplateLanguageService();
    }
  }

  public provideCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position,
  ): vscode.ProviderResult<vscode.CompletionItem[] | vscode.CompletionList> {
    const fullText = getDocumentText(document);
    const offset = getDocumentOffset(document, position);
    const docKey = document.uri ? document.uri.toString() : 'untitled';
    const version = document.version ?? 0;

    const result = this.service.getCompletions(fullText, offset, { docKey, version });
    if (!result || result.suggestions.length === 0) {
      return undefined;
    }

    const startPos = document.positionAt(result.replacementRange.start);
    const endPos = document.positionAt(result.replacementRange.end);
    const range = new vscode.Range(startPos, endPos);

    const items = createCompletionItems(result.suggestions, range);
    return new vscode.CompletionList(items, true);
  }
}
