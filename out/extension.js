"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = void 0;
const vscode = require("vscode");
const global_1 = require("./data/global");
const bloggerSuggestions = {
    'data:': Object.keys(global_1.default),
    'data:blog.': Object.keys(global_1.default.blog),
    'data:blog.locale.': Object.keys(global_1.default.blog.locale),
    'data:messages.': Object.keys(global_1.default.messages),
    'data:skin.': Object.keys(global_1.default.skin),
    'data:view.': Object.keys(global_1.default.view),
    'data:view.archive.': Object.keys(global_1.default.view.archive),
    'data:view.search.': Object.keys(global_1.default.view.search),
    'data:widget.': Object.keys(global_1.default.widget),
    'data:widgets.': Object.keys(global_1.default.widget),
};
function createCompletionProvider(language) {
    return vscode.languages.registerCompletionItemProvider(language, {
        provideCompletionItems(document, position) {
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
function activate(context) {
    const xmlProvider = createCompletionProvider('xml');
    const handlebarsProvider = createCompletionProvider('handlebars');
    context.subscriptions.push(xmlProvider, handlebarsProvider);
}
exports.activate = activate;
//# sourceMappingURL=extension.js.map