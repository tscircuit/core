# Class file exports

Run `bun run check:class-exports` locally. The **Class Exports** GitHub Actions
check runs this command and its regression tests on pull requests and pushes to
`main`.

A TypeScript implementation file under `lib/` containing a top-level class may
export at most one name. This includes type-only exports, aliases, re-exports,
and individual bindings in a single export statement. Class methods and private
helpers do not count. Utility modules and barrels without a class are unaffected;
generated declaration files are excluded.

This check introduces no implementation refactors. Existing extra exports are
listed by exact file and exported symbol in `scripts/class-export-exceptions.ts`,
with a reason for each entry. The exceptions preserve current code and import
paths, including `Renderable.ts`.

These are a fixed legacy baseline, not permission to add new exports to those
files. CI rejects unlisted exports and stale exceptions (including renamed or
removed symbols and files). New shared helpers belong in appropriate utility
modules. Remove an exception if a separate cleanup removes that export.

The check uses TypeScript's syntax tree rather than text matching, so comments,
strings, formatting, and multiline exports do not change the result.
