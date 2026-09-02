# Change Log

All notable changes to the "blogger-syntax" extension will be documented in this file.

## [2.1.0] - 2026-09-01

### Added
- Scoped variable inference (`BloggerScopeTracker`):
  - Completions for local variables inside `<b:loop>` (`var`, `index`) and `<b:with>` (`var`)
  - Type inference from collection expressions and nested scopes
  - Array member chaining and properties (`first`, `last`, `size`, `empty`)
- `type="..."` autocomplete in `<Variable>` for skin types:
  - Supported types: `color`, `font`, `length`, `background`, `string`, `url`
  - Specialized snippet for each type (`Variable (color)`, etc.)
  - Skin types (`string(skin)`, `url(skin)`) are visually distinct from runtime `data:*` types
- Expanded type data:
  - `locale` type and its member definitions
  - Array helper structures across global properties
- `CONTRIBUTING.md` with workflow and architecture guidelines

### Fixed
- Cursor trigger false positives:
  - Blogger tag context is now validated before triggering suggestions inside empty attributes
- Removed `<` from completion trigger characters to avoid conflicts with VS Code's native tag completion

### Refactored
- Lazy variable resolution and document caching in scope parsing
- Static suggestions precomputed in `BloggerPathResolver`
- Lazy context evaluation in Hover Provider and cursor listeners
- Skin tag snippets migrated from declarative files into the completion provider


## [2.0.0] - 2026-08-31

### Added
- `<b:param>` tag support:
  - Autocomplete, snippets, and attribute suggestions
  - Hover documentation (used inside `<b:message>`)
- `bloggerSyntax.autoTriggerInEmptyAttributes` setting:
  - Controls automatic suggestion triggering inside empty attributes
- Hover Provider multiline support:
  - Inspects preceding lines to handle multiline tag attributes
  - Example: `<b:widget\n  id="..."\n  type="...">`
- GitHub Actions workflows:
  - Continuous integration
  - Automated marketplace releases

### Fixed
- False positive hover tooltips on standard HTML attributes:
  - Affected: `class`, `id`, `name`, `type`, `value`, `version`, `title`
  - Only triggered on non-Blogger elements
- Potential `RangeError` in completion replacement range:
  - Start index is now clamped to non-negative values
- Missing boundary checks in the cursor listener:
  - Document line count validation
  - Safe async command execution handling

### Refactored
- `BloggerPathResolver`: hierarchical path resolution unified into a single `navigatePath` helper
- `bloggerDescriptions`: duplicate casing variants removed, cleaning up completion dropdowns and snippet lists
- `tsconfig.json`: tests and scripts included; added `@types/node` and strict `exactOptionalPropertyTypes`
- `.vscodeignore`: excludes internal files from the published VSIX package (`scripts/`, `.codegraph/`, `.editorconfig`)

## [1.1.0] - 2026-08-30

### Added
- Pure TypeScript core, independent of the VS Code API:
  - Blogger domain logic and data models
  - `BloggerPathResolver` with recursive path resolution
- Enriched `data:*` completions:
  - Data types: `String`, `URL`, `Boolean`, and others
  - Markdown hover documentation for all entries
- VS Code Web support (`vscode.dev`, `github.dev`):
  - Dual-target bundling with `esbuild`
- Snippet standardization (25 snippets):
  - Proper tab stops (`$1`, `$0`) and quoted attributes
  - Consistent descriptions across all snippets
- Vitest unit test suite:
  - Path resolution, completion adaptation, and snippet integrity

### Refactored
- ESLint migrated to Flat Config with `@antfu/eslint-config`
- TypeScript updated to 5.8:
  - Strict type checking enabled
- Workflows migrated to modern pnpm

## [1.0.8] - 2024-04-02

### Changed
- perf: performance improvement
- feat: autocompletion for description variables and group
- refactor: improvement to get suggestions
- refactor: the missing data is being added

### Fixed
- fix: the statement has been marked here as obsolete

## [1.0.3] - 2023-03-21

### Fixed
- Error when publishing the update in vscode marketplace

## [1.0.2] - 2023-03-21

### Changed
- More data thanks to BloggerCode

### Fixed
- incorrect element names in data:skin

## [1.0.1] - 2023-03-20

### Changed
- Minor changes for testing
- Cleaner code

## [1.0.0]

- Initial version of the project
