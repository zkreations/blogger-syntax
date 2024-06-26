import * as vscode from 'vscode';
import data from './data/global';
import widget from './data/widgets';
import description from './data/description';

interface Suggestion {
  prefix: string;
  keys: string[];
}

function getSuggestions(prefix: string, obj: any): Suggestion {
  if (Array.isArray(obj)) {
    return { prefix, keys: obj };
  }

  return { prefix, keys: Object.keys(obj) };
}

const bloggerSuggestions: Suggestion[] = [
  getSuggestions('data:', data),
  getSuggestions('data:blog.', data.blog),
  getSuggestions('data:blog.locale.', data.blog.locale),
  getSuggestions('data:messages.', data.messages),
  getSuggestions('data:skin.', data.skin),
  getSuggestions('data:view.', data.view),
  getSuggestions('data:view.archive.', data.view.archive),
  getSuggestions('data:view.search.', data.view.search),
  getSuggestions('data:widget.', data.widget),
  getSuggestions('data:widgets.', data.widgets),
  getSuggestions('data:widgets.Blog.', widget.Blog),
  getSuggestions('data:post.', widget.Blog.posts),
  getSuggestions('data:post.snippets.', widget.Blog.posts.snippets),
  getSuggestions('data:post.author.', widget.Blog.posts.author),
  getSuggestions('data:post.author.authorPhoto.', widget.Blog.posts.author.authorPhoto),
  getSuggestions('data:post.location.', widget.Blog.posts.location),
  getSuggestions('description="', description),
];

const completionItemsCache = new Map<string[], vscode.CompletionItem[]>();

// Create completion items from keys
function createCompletionItems(keys: string[]): vscode.CompletionItem[] {
  if (completionItemsCache.has(keys)) {
    return completionItemsCache.get(keys)!;
  }

  const items = keys.map(field => new vscode.CompletionItem(field, vscode.CompletionItemKind.Field));

  completionItemsCache.set(keys, items);

  return items;
}

// Provide completion items
function provideCompletionItems(document: vscode.TextDocument, position: vscode.Position) {
  const linePrefix = document.lineAt(position).text.slice(0, position.character);

  // Check if the line is a suggestion for a blogger object
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
  }, '.', ':','"');
}

// Activate extension
export function activate(context: vscode.ExtensionContext) {
  const xmlProvider = createCompletionProvider('xml');
  const handlebarsProvider = createCompletionProvider('handlebars');

  context.subscriptions.push(xmlProvider, handlebarsProvider);
}
