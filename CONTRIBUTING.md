# Contributing to Blogger Syntax

## Architecture Overview

The extension is organized into decoupled layers:
- `src/core/`: pure TypeScript domain logic, models, schemas, and `BloggerPathResolver`. No VS Code dependencies.
- `src/vscode/`: VS Code integration adapters and providers (`CompletionItemProvider`, `CompletionItem` transformations).
- `snippets/`: declarative JSON snippets contributed via VS Code contribution points.
- `tests/`: unit tests powered by Vitest.

## Development Workflow

1. Fork and clone the repository.
2. Install dependencies:
```bash
   pnpm install
```
3. Run tests during development:
```bash
   pnpm test
```
4. Check code quality:
```bash
   pnpm run lint
   pnpm run typecheck
```
5. Build bundles:
```bash
   pnpm run build
```

## Adding New Blogger Properties or Tags

1. Add properties to the respective schema in `src/core/data/` (`globalData.ts`, `widgetsData.ts`, `tagsData.ts`, or `descriptions.ts`).
2. Add or update unit tests in `tests/unit/pathResolver.test.ts` to verify path resolution.
3. If contributing a new snippet, add it to `snippets/snippets.code-snippets` and ensure `pnpm test` passes.
