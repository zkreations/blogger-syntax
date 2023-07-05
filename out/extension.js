"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = void 0;
const vscode = require("vscode");
const global_1 = require("./data/global");
const widgets_1 = require("./data/widgets");
// Get all keys from an object
function getKeys(obj) {
    return Object.keys(obj);
}
const bloggerSuggestions = [
    { prefix: 'data:', keys: getKeys(global_1.default) },
    { prefix: 'data:blog.', keys: getKeys(global_1.default.blog) },
    { prefix: 'data:blog.locale.', keys: getKeys(global_1.default.blog.locale) },
    { prefix: 'data:messages.', keys: getKeys(global_1.default.messages) },
    { prefix: 'data:skin.', keys: getKeys(global_1.default.skin) },
    { prefix: 'data:view.', keys: getKeys(global_1.default.view) },
    { prefix: 'data:view.archive.', keys: getKeys(global_1.default.view.archive) },
    { prefix: 'data:view.search.', keys: getKeys(global_1.default.view.search) },
    { prefix: 'data:widget.', keys: getKeys(global_1.default.widget) },
    { prefix: 'data:widgets.', keys: getKeys(global_1.default.widgets) },
    { prefix: 'data:widgets.Blog.', keys: getKeys(widgets_1.default.Blog) },
    { prefix: 'data:post.', keys: getKeys(widgets_1.default.Blog.posts) },
    { prefix: 'data:post.snippets.', keys: getKeys(widgets_1.default.Blog.posts.snippets) },
    { prefix: 'data:post.author.', keys: getKeys(widgets_1.default.Blog.posts.author) },
    { prefix: 'data:post.author.authorPhoto.', keys: getKeys(widgets_1.default.Blog.posts.author.authorPhoto) },
    { prefix: 'data:post.location.', keys: getKeys(widgets_1.default.Blog.posts.location) },
];
// Create completion items from keys
function createCompletionItems(keys) {
    return keys.map(field => new vscode.CompletionItem(field, vscode.CompletionItemKind.Field));
}
// Provide completion items
function provideCompletionItems(document, position) {
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
function createCompletionProvider(language) {
    return vscode.languages.registerCompletionItemProvider(language, {
        provideCompletionItems: provideCompletionItems,
    }, '.', ':');
}
// Activate extension
function activate(context) {
    const xmlProvider = createCompletionProvider('xml');
    const handlebarsProvider = createCompletionProvider('handlebars');
    context.subscriptions.push(xmlProvider, handlebarsProvider);
}
exports.activate = activate;
//# sourceMappingURL=extension.js.map