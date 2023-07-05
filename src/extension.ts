import * as vscode from 'vscode';
import data from './data/global';
import widget from './data/widgets';

interface Suggestion {
  prefix: string;
  keys: string[];
}

// Get all keys from an object
function getKeys(obj: any): string[] {
  return Object.keys(obj);
}

const bloggerSuggestions: Suggestion[] = [
  { prefix: 'data:', keys: getKeys(data) },
  { prefix: 'data:blog.', keys: getKeys(data.blog) },
  { prefix: 'data:blog.locale.', keys: getKeys(data.blog.locale) },
  { prefix: 'data:messages.', keys: getKeys(data.messages) },
  { prefix: 'data:skin.', keys: getKeys(data.skin) },
  { prefix: 'data:view.', keys: getKeys(data.view) },
  { prefix: 'data:view.archive.', keys: getKeys(data.view.archive) },
  { prefix: 'data:view.search.', keys: getKeys(data.view.search) },
  { prefix: 'data:widget.', keys: getKeys(data.widget) },
  { prefix: 'data:widgets.', keys: getKeys(data.widgets) },
  { prefix: 'data:widgets.Blog.', keys: getKeys(widget.Blog) },
  { prefix: 'data:post.', keys: getKeys(widget.Blog.posts) },
  { prefix: 'data:post.snippets.', keys: getKeys(widget.Blog.posts.snippets) },
  { prefix: 'data:post.author.', keys: getKeys(widget.Blog.posts.author) },
  { prefix: 'data:post.author.authorPhoto.', keys: getKeys(widget.Blog.posts.author.authorPhoto) },
  { prefix: 'data:post.location.', keys: getKeys(widget.Blog.posts.location) },
];

// Create completion items from keys
function createCompletionItems(keys: string[]): vscode.CompletionItem[] {
  return keys.map(field => new vscode.CompletionItem(field, vscode.CompletionItemKind.Field));
}

// Provide completion items
function provideCompletionItems(document: vscode.TextDocument, position: vscode.Position) {
  const linePrefix = document.lineAt(position).text.substr(0, position.character);

  for (const suggestion of bloggerSuggestions) {
    const { prefix, keys } = suggestion;

    if (linePrefix.endsWith(prefix)) {
      return createCompletionItems(keys);
    }
  }

  return undefined;
}

// Create completion provider
function createCompletionProvider(language: string): vscode.Disposable {
  return vscode.languages.registerCompletionItemProvider(language, {
    provideCompletionItems: provideCompletionItems,
  }, '.', ':');
}

// Activate extension
export function activate(context: vscode.ExtensionContext) {
  const xmlProvider = createCompletionProvider('xml');
  const handlebarsProvider = createCompletionProvider('handlebars');

  context.subscriptions.push(xmlProvider, handlebarsProvider);
}
