# Packed consumer smoke test

After `bun run build`, run:

```sh
node scripts/smoke-tests/test-packed-consumer.mjs
```

This packs the current build with `npm pack`, installs the tarball in a temporary
project outside the checkout, and uses Node 24 (the release runtime) to import
Core and render a resistor board. The fixture itself is copied into that project
so ESM resolution cannot silently use the checkout's development dependencies.
The temporary project is removed on success or failure.

For an already-built artifact, supply an absolute or relative tarball path:

```sh
node scripts/smoke-tests/test-packed-consumer.mjs /path/to/core.tgz
```

The consumer uses npm's default automatic peer resolution, not a copy of the
repository's devDependencies, overrides, or lockfile. A failure can therefore
identify a broken declared dependency graph as well as missing imports. Lifecycle
scripts are disabled; native/postinstall-dependent features are not covered by
this smoke test. The fixture exercises local rendering only, not every lazy
import or network autorouting path.

The GitHub workflow runs on PRs and main. The same script runs immediately before
`pver release` in the publishing workflow. It is complementary to the existing
in-checkout `smoke-test:dist` suite and static dependency checks.
