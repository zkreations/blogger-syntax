import type { BloggerSymbolNode } from '../../core/navigation/symbolIndexer.js';
import * as vscode from 'vscode';
import { TemplateLanguageService } from '../../core/service/templateLanguageService.js';

export class BloggerDocumentSymbolProvider implements vscode.DocumentSymbolProvider {
  private readonly service: TemplateLanguageService;

  constructor(service?: TemplateLanguageService) {
    this.service = service ?? new TemplateLanguageService();
  }

  public provideDocumentSymbols(
    document: vscode.TextDocument,
  ): vscode.ProviderResult<vscode.DocumentSymbol[]> {
    const text = document.getText();
    const nodes = this.service.getDocumentSymbols(text);

    return this.convertNodes(document, nodes);
  }

  private convertNodes(
    document: vscode.TextDocument,
    nodes: readonly BloggerSymbolNode[],
  ): vscode.DocumentSymbol[] {
    return nodes.map((node) => {
      const kind = this.mapSymbolKind(node.kind);
      const range = new vscode.Range(
        document.positionAt(node.span.start),
        document.positionAt(node.span.end),
      );
      const selectionRange = new vscode.Range(
        document.positionAt(node.selectionSpan.start),
        document.positionAt(node.selectionSpan.end),
      );

      const symbol = new vscode.DocumentSymbol(
        node.name,
        node.detail ?? '',
        kind,
        range,
        selectionRange,
      );

      if (node.children.length > 0) {
        symbol.children = this.convertNodes(document, node.children);
      }

      return symbol;
    });
  }

  private mapSymbolKind(kind: BloggerSymbolNode['kind']): vscode.SymbolKind {
    switch (kind) {
      case 'section':
        return vscode.SymbolKind.Namespace;
      case 'widget':
        return vscode.SymbolKind.Class;
      case 'includable':
        return vscode.SymbolKind.Function;
      case 'defaultmarkups':
        return vscode.SymbolKind.Package;
      case 'defaultmarkup':
        return vscode.SymbolKind.Interface;
      case 'settings':
        return vscode.SymbolKind.Struct;
      case 'skin':
        return vscode.SymbolKind.Property;
    }
  }
}
