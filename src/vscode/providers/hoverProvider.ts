import type { BloggerPathResolver } from '../../core/resolver/pathResolver.js';
import type { BloggerScopeTracker } from '../../core/scope/scopeTracker.js';
import * as vscode from 'vscode';
import { TemplateLanguageService } from '../../core/service/templateLanguageService.js';
import { buildHoverDocumentation } from '../utils/docBuilder.js';
import { getDocumentOffset, getDocumentText } from '../utils/documentHelper.js';

export class BloggerHoverProvider implements vscode.HoverProvider {
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

  public provideHover(
    document: vscode.TextDocument,
    position: vscode.Position,
  ): vscode.ProviderResult<vscode.Hover> {
    const fullText = getDocumentText(document);
    const offset = getDocumentOffset(document, position);
    const docKey = document.uri ? document.uri.toString() : 'untitled';
    const version = document.version ?? 0;

    const result = this.service.getHover(fullText, offset, { docKey, version });
    if (!result) {
      return undefined;
    }

    const startPos = document.positionAt(result.range.start);
    const endPos = document.positionAt(result.range.end);
    const range = new vscode.Range(startPos, endPos);

    const docMarkdown = buildHoverDocumentation(result.hover);
    return new vscode.Hover(docMarkdown, range);
  }
}
