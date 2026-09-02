# Contributing to Blogger Syntax

## Architecture Overview

- `src/core/`: Pure TypeScript domain logic, data models, schemas, and resolution engines. No VS Code API dependencies.
  - `data/`: Definitions for global data objects, widgets, tags, attributes, and Theme Designer variables.
  - `models/`: Type definitions and interfaces (`BloggerProperty`, `BloggerSuggestion`, etc.).
  - `resolver/`: `BloggerPathResolver` for traversing `data:*` expressions, attributes, and tags.
  - `scope/`: `BloggerScopeTracker` and `typeInferencer` for context variables in `<b:loop>` and `<b:with>`.
- `src/vscode/`: VS Code integration adapters and providers.
  - `providers/`: `BloggerCompletionProvider` and `BloggerHoverProvider`.
  - `listeners/`: Event listeners (e.g. `cursorListener` for automatic suggestion triggering in empty attributes).
  - `utils/`: Markdown formatting, documentation builders (`docBuilder.ts`), and snippet utilities.
- `tests/`: Unit test suite powered by [Vitest](https://vitest.dev/).
  - `helpers/`: Mock implementations of `vscode.TextDocument` and helper utilities for isolated testing.
  - `unit/`: Tests covering resolver logic, scope tracker, hover tooltips, and completion providers.

## Requirements

- [Node.js](https://nodejs.org/) >= 22
- [pnpm](https://pnpm.io/) >= 11

## Development Workflow

1. Fork and clone the repository.
2. Install dependencies:
```bash
   pnpm install
```
3. Run tests in watch mode during development:
```bash
   pnpm run test:watch
```
4. Build extension bundles (desktop and web targets):
```bash
   pnpm run build
```
   Or run the build watcher:
```bash
   pnpm run watch
```

### Debugging in VS Code

1. Open the repository in VS Code.
2. Press `F5` or go to **Run and Debug → Launch Extension**.
3. An Extension Development Host window will open with the development build loaded.
4. Open or create an `.xml` or `.hbs` file to test completions, hover tooltips, and snippets.

## Code Quality

Before submitting a pull request, ensure all checks pass:

```bash
pnpm test          # Run unit tests
pnpm run typecheck # Check TypeScript types
pnpm run lint      # Run ESLint
pnpm run lint:fix  # Fix formatting and linting issues automatically
```

## Adding New Blogger Properties or Tags

1. Add properties or tags to the corresponding file in `src/core/data/`:
   - `globalData.ts`: Universal `data:*` objects (e.g. `data:blog`, `data:view`).
   - `widgetsData.ts`: Widget-specific properties (e.g. `Blog`, `Header`).
   - `tagsData.ts`: Blogger XML tags (`<b:...>`).
   - `skinVariablesData.ts` / `descriptions.ts`: Theme Designer `<Variable>` and `<Group>` definitions.
   - `widgetTypes.ts`: Widget and default markup types.
2. Include a `docUrl` with official Google documentation or [BloggerCode](https://bloggercode.orbiona.com/) references when available.
3. Add or update tests in `tests/unit/` to cover path resolution, completions, and hover tooltips.
4. Verify with `pnpm test`, `pnpm run typecheck`, and `pnpm run lint`.

## Pull Request Guidelines

- Keep pull requests focused on a single feature, fix, or refactoring task.
- Ensure all tests and linter checks pass.
- Update documentation and tests to reflect any code changes.
