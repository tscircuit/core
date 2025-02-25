# @tscircuit/core Helper Guide

## Commands
- Build: `bun run build`
- Format: `bun run format`
- Test: `bun test` (all tests)
- Single test: `bun test tests/path/to/test.test.tsx`
- Update snapshots: `bun test --update-snapshots` or set `BUN_UPDATE_SNAPSHOTS=true`
- Lint: Use Biome linting with Biome rules

## Code Style
- Formatting: Uses Biome with double quotes, trailing commas, and 2-space indentation
- File naming: kebab-case for files (enforced by linter)
- Components: PascalCase for component classes extending from base components
- Imports: Organize imports enabled; avoid type imports
- Semicolons: Use as needed, not required
- JSX: Use React JSX syntax; createElement is supported
- Types: Strong typing with TypeScript; avoid `any` when possible
- Testing: Use snapshot testing extensively for circuit renders

## Project Structure
- Circuit elements become class instances 
- Render phases execute in order (see Renderable class)
- Circuit JSON is the output format
- Use getTestFixture() in tests for clean circuit instances