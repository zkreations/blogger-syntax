"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = void 0;
const vscode = require("vscode");
const global_1 = require("./data/global");
const widgets_1 = require("./data/widgets");
const description_1 = require("./data/description");
function getSuggestions(prefix, obj) {
    if (Array.isArray(obj)) {
        return { prefix, keys: obj };
    }
    return { prefix, keys: Object.keys(obj) };
}
const bloggerSuggestions = [
    getSuggestions('data:', global_1.default),
    getSuggestions('data:blog.', global_1.default.blog),
    getSuggestions('data:blog.locale.', global_1.default.blog.locale),
    getSuggestions('data:messages.', global_1.default.messages),
    getSuggestions('data:skin.', global_1.default.skin),
    getSuggestions('data:view.', global_1.default.view),
    getSuggestions('data:view.archive.', global_1.default.view.archive),
    getSuggestions('data:view.search.', global_1.default.view.search),
    getSuggestions('data:widget.', global_1.default.widget),
    getSuggestions('data:widgets.', global_1.default.widgets),
    getSuggestions('data:widgets.Blog.', widgets_1.default.Blog),
    getSuggestions('data:post.', widgets_1.default.Blog.posts),
    getSuggestions('data:post.snippets.', widgets_1.default.Blog.posts.snippets),
    getSuggestions('data:post.author.', widgets_1.default.Blog.posts.author),
    getSuggestions('data:post.author.authorPhoto.', widgets_1.default.Blog.posts.author.authorPhoto),
    getSuggestions('data:post.location.', widgets_1.default.Blog.posts.location)
];
// Create completion items from keys
function createCompletionItems(keys) {
    return keys.map(field => new vscode.CompletionItem(field, vscode.CompletionItemKind.Field));
}
// Provide completion items
function provideCompletionItems(document, position) {
    const linePrefix = document.lineAt(position).text.slice(0, position.character);
    // Verifica si la línea contiene la etiqueta HTML y el atributo
    if (/<(Variable|Group)[^>]*description="$/.test(linePrefix)) {
        // Aquí puedes definir tus sugerencias de autocompletado
        const descriptionSuggestions = description_1.default;
        return createCompletionItems(descriptionSuggestions);
    }
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
    }, '.', ':', '"');
}
// Activate extension
function activate(context) {
    const xmlProvider = createCompletionProvider('xml');
    const handlebarsProvider = createCompletionProvider('handlebars');
    context.subscriptions.push(xmlProvider, handlebarsProvider);
}
exports.activate = activate;
//# sourceMappingURL=extension.js.map