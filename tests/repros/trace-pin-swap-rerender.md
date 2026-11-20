# Trace destination swaps leave source connectivity stale

Reproduced on `main` at `eec5741` (`@tscircuit/core` 0.0.2404), using Bun 1.4.4.

After installing the repository dependencies, run:

```sh
bun test tests/repros/trace-pin-swap-rerender.test.tsx
```

The test renders two chips connected A→A and B→B, swaps the destination pins with the public `Trace.setProps()` method, and calls `renderUntilSettled()` again. The emitted source traces still connect A→A and B→B. A fresh circuit rendered from the changed JSX correctly connects A→B and B→A.

The snapshot shows the correct fresh result: `DATA_A` reaches U2.B and `DATA_B` reaches U2.A. The test also verifies that this control differs from the initial design. It does not mutate Circuit JSON, private render-phase state, or router metadata.

This is an expected-failure regression: `test.failing` inverts the failing assertion so the reproduction can remain in the suite. Replacing it with ordinary `test` reproduces the endpoint mismatch. Once incremental trace updates are fixed, change it to ordinary `test`; an unexpected pass under `test.failing` deliberately fails.

Verification used current repository source with existing private dependency links plus isolated installs of missing dependencies from this repository's manifest. Relevant resolved versions were `@tscircuit/props` 0.0.732, `circuit-json` 0.0.551, `@tscircuit/circuit-json-util` 0.0.131, `@tscircuit/capacity-autorouter` 0.0.1112, and `circuit-to-svg` 0.0.460. Both the ordinary failing run and the expected-failure passing run were observed; the schematic snapshot was rendered and visually inspected.

This reproduction is separate from malformed SRJ aliases created by external pin-remapping code. It demonstrates stale source connectivity through the public core update lifecycle; it does not establish that core produces those malformed aliases.
