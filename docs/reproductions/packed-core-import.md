# Packed Core import requires cable inference at runtime

The distributed Core entry imports `@tscircuit/infer-cable-insertion-point`.
When the package is listed only in `devDependencies`, a clean consumer cannot
import `Circuit`, even if it never renders a connector. Running tests inside Core
can hide the failure because that development dependency is installed there.

After building Core, reproduce with:

```sh
node scripts/smoke-tests/test-packed-cable-inference.mjs
```

The command packs the local build, installs it in a temporary directory using
only declared consumer dependencies, and imports the cable-inference entry point
from inside the installed Core package under Node. It runs no installation
lifecycle scripts and deletes its temporary files. Before the fix, the import
fails with `ERR_MODULE_NOT_FOUND` for
`@tscircuit/infer-cable-insertion-point`. The expected result is a successful
import without requiring a consumer to add that transitive dependency manually.

Declare the package as a required runtime peer (`*`), following Core's internal
library dependency policy. Keep the development version `^0.0.5` from PR #4971;
this change concerns package installation, not inference geometry. The test uses
npm's standard peer installation; consumers disabling that behavior must supply
the required peer themselves.
This focused test does not claim that all Core imports are self-contained. A
separate clean full-`Circuit` import still fails on undeclared `debug` in 0.0.2251;
other runtime packaging gaps remain outside this change. It also does not
validate PCB extraction or an eye simulation.
