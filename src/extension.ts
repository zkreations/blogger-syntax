import * as vscode from 'vscode';
import data from './data/global';

const bloggerSuggestions = {
  'data:': Object.keys(data),
  'data:blog.': Object.keys(data.blog),
  'data:blog.locale.': Object.keys(data.blog.locale),
  'data:messages.': Object.keys(data.messages),
  'data:skin.': Object.keys(data.skin),
  'data:view.': Object.keys(data.view),
  'data:view.archive.': Object.keys(data.view.archive),
  'data:view.search.': Object.keys(data.view.search),
  'data:widget.': Object.keys(data.widget),
  'data:widgets.': Object.keys(data.widget),
};

function createCompletionProvider(language: string): vscode.Disposable {
  return vscode.languages.registerCompletionItemProvider(language, {
    provideCompletionItems(document: vscode.TextDocument, position: vscode.Position) {
      const linePrefix = document.lineAt(position).text.substr(0, position.character);

      for (const [prefix, suggestions] of Object.entries(bloggerSuggestions)) {
        if (linePrefix.endsWith(prefix)) {
          return suggestions.map(field => new vscode.CompletionItem(field, vscode.CompletionItemKind.Field));
        }
      }

      return undefined;
    }
  }, '.', ':');
}

export function activate(context: vscode.ExtensionContext) {

  const xmlProvider = createCompletionProvider('xml');
  const handlebarsProvider = createCompletionProvider('handlebars');

  context.subscriptions.push(xmlProvider, handlebarsProvider);
}
