# Blogger Syntax

VS Code extension adding IntelliSense, validation, diagnostics, and snippets for Blogger (Blogspot) XML templates.

## Project Context

- Language: TypeScript (~6.0.3, ES2022, NodeNext modules)
- Runtime: Node.js (>= 22 engine requirement), VS Code engine (^1.95.0)
- Package manager: pnpm (12.9.1, lockfile v9.0)
- Project type: VS Code extension supporting both desktop (Node.js) and web (browser) environments

## Architecture

- `src/core/`: Domain logic, AST/expression parser, path resolver, scope tracker, data schemas, and linter. Decoupled from the VS Code API.
  - `data/`: Definitions for global data, widgets, tags, attributes, and Theme Designer variables.
  - `models/`: Domain interfaces (`BloggerProperty`, `BloggerSuggestion`, etc.).
  - `parser/`: Expression parser, lambda scope resolver, and directive token scanner (`exprParser.ts`, `directiveScanner.ts`, `tagTreeTracker.ts`).
  - `resolver/`: Data path navigation, property hierarchy, and expression resolution (`pathResolver.ts`, `hoverCardResolver.ts`, `tagAttributeResolver.ts`).
  - `scope/`: Context variable inference for `<b:loop>`, `<b:with>`, and `<b:includable>` (`scopeTracker.ts`, `typeInferencer.ts`).
  - `navigation/`: Definition resolver (`definitionResolver.ts`) and symbol indexer (`symbolIndexer.ts`).
  - `linter/`: Pure-TS linting rules and diagnostics engine (`linterEngine.ts`, `rules/`).
  - `service/`: Central template language service facade (`templateLanguageService.ts`).
  - `types/`: Type definitions and structural contracts (`typeSystem.ts`).
  - `version/`: Template and Layouts version detection (`templateVersion.ts`).
  - `utils/`: Text processing and snippet generation utilities (`textUtils.ts`, `snippetFormatter.ts`).
- `src/vscode/`: VS Code integration layer implementing extension providers and listeners.
  - `providers/`: Completion, Hover, CodeAction, Definition, Diagnostic, DocumentSymbol.
  - `listeners/`: Cursor change listener for auto-triggering completions.
  - `ui/`: Status bar indicators.
  - `utils/`: Completion adapter, doc builder, and document helpers.
- Entry points and build outputs:
  - Entry point: `src/extension.ts`
  - Desktop bundle: `dist/extension.cjs` (CJS, platform node)
  - Web bundle: `dist/web/extension.js` (CJS, platform browser)
  - Bundler: `esbuild.js` (`--production` minifies and removes sourcemaps)
- `tests/`: Vitest test suite under `tests/unit/`. Includes VS Code mock (`tests/unit/__mocks__/vscode.ts`) and document test helpers (`tests/helpers/mockDocument.ts`).

## Conventions

- Code style: ESLint using `@antfu/eslint-config` (see `eslint.config.mjs`). Single quotes, semicolons enabled (`semi: true`).
- Editor formatting: `.editorconfig` (UTF-8, LF, 2 spaces indentation, trim trailing whitespace).
- Imports: Explicit `.js` extension required for all relative TypeScript imports (`NodeNext` resolution).
- Types: Strict TypeScript configuration (`strict`, `exactOptionalPropertyTypes`, `noUncheckedIndexedAccess` enabled in `tsconfig.json`). Extensive use of `readonly` properties.
- Tests: Vitest (`vitest.config.ts`), test files named `*.test.ts` in `tests/unit/`.

## Commands

- Install dependencies: `pnpm install`
- Compile bundles (dev): `pnpm run compile`
- Build bundles (production): `pnpm run build`
- Watch bundles: `pnpm run watch`
- Run unit tests: `pnpm test`
- Run unit tests (watch): `pnpm run test:watch`
- Run single test file: `pnpm exec vitest run tests/unit/<filename>.test.ts`
- Type check: `pnpm run typecheck`
- Lint code: `pnpm run lint`
- Fix lint issues: `pnpm run lint:fix`

## Constraints

- Never import `vscode` inside `src/core/`: Keep core domain logic and linter portable and isolated from the VS Code API.
- Do not edit generated output paths: `dist/`, `out/`, `*.vsix`.
- Dual platform compatibility: Extension code must bundle and run cleanly in both Node.js and Browser web worker environments.
- CI requirements: PRs and pushes to `main` or `master` must pass `lint`, `typecheck`, `test`, and `build` on Node 22.x/24.x (Linux) and Node 24.x (Windows).
- Release tags: Releases trigger on `v*` tags and enforce matching versions between the Git tag and `package.json`.

## Important Decisions

- Core decoupled from VS Code: Allows unit testing core logic without running a VS Code test runner and supports web extension targets (`CONTRIBUTING.md`, `src/core/linter/linterEngine.ts`).
- Dual esbuild bundling: Emits separate CommonJS bundles for Node and Web targets from a single `src/extension.ts` entry point (`esbuild.js`, `package.json`).
- Mocked VS Code environment in tests: Unit tests run in node environment with alias mock (`vitest.config.ts`, `tests/unit/__mocks__/vscode.ts`) for fast headless execution.

## Workflow

- CI pipeline: GitHub Actions (`.github/workflows/ci.yml`) validates lint, types, tests, and build on push/PR.
- Release workflow: Tagged pushes `v*` run checks, verify version alignment with `package.json`, and publish using `vsce` (`.github/workflows/release.yml`).
