# Class file exports

Run `bun run check:class-exports` locally. The **Class Exports** GitHub Actions
check runs this command and its regression tests on pull requests and pushes to
`main`.

A TypeScript implementation file under `lib/` containing a top-level class may
export at most one name. This includes type-only exports, aliases, re-exports,
and individual bindings in a single export statement. Class methods and private
helpers do not count. Utility modules and barrels without a class are unaffected;
generated declaration files are excluded.

Move shared helpers, types, and schemas into a separate module and update their
consumers. Keep package-level compatibility exports in barrels, not in class
implementation files. Only extract code when the destination has a clear responsibility;
do not create forwarding-only files or put unrelated domain types in a class directory.

Existing exports that cannot be cleanly extracted are listed by exact file and
exported symbol in `scripts/class-export-exceptions.ts`, with a reason for each
entry. These are a fixed legacy baseline, not permission to add new exports to
those files. CI rejects unlisted exports and stale exceptions (including renamed
or removed symbols and files). Remove an exception when its export is cleaned up.

The check uses TypeScript's syntax tree rather than text matching, so comments,
strings, formatting, and multiline exports do not change the result.
