# Symbol port selector contract

Core converts React circuit elements into Circuit JSON. A generated port selector must select the same original port; saved-route export must reject zero matches, multiple matches, and a unique match for a different port.

The no-routing reproduction contains one chip, one symbol, and one port. On upstream `main` at `9c500c7ffcf4d3a1198c7f179b61307504790238`, the port's immediate parent is `Symbol`, but `getPortSelector()` generates `.Q_PD_INHIBIT > port.pin2`. That selector has zero matches. `Q_PD_INHIBIT.pin2` selects the original port. The source runtime reports `0.0.2131` while package.json is `0.0.2130`.

Fresh installs of published `@tscircuit/core@0.0.2130` and `tscircuit@0.0.2827` (both reporting core `0.0.2130`) independently reproduce the same result on 2026-10-11. The registry's latest CLI is `0.1.2296`; its collector forwards core's `pcbTracePathsUnavailableReason`. This warning affects optional saved-route artifact export; it does not establish a failed circuit build.

This is already tracked in another contributor's open [reproduction #4540](https://github.com/tscircuit/core/pull/4540) and [fix #4541](https://github.com/tscircuit/core/pull/4541). This stack reduces the selector failure to a no-routing identity assertion and adds ambiguity coverage missing from that pair. It does not claim a newly discovered or already-merged fix.

The second reproduction supplies `resistor port.pin2`, which matches two distinct physical PCB ports. Exporting a deterministic one-wire fanout escape from each port must fail in both cases. Currently the first match is incorrectly exported, and only the second is rejected: observed `[false, true]`, expected `[true, true]`. No routing solver is required.

Run with Bun 1.3.14 after `bun install --frozen-lockfile`:

```sh
bun test tests/repros/repro-symbol-port-selector.test.tsx tests/repros/repro-pcb-path-selector-ambiguity.test.tsx
ASSERT_PORT_SELECTOR_CONTRACT=1 bun test tests/repros/repro-symbol-port-selector.test.tsx tests/repros/repro-pcb-path-selector-ambiguity.test.tsx
bun tests/repros/evidence/symbol-port-selector/capture.tsx failure
```

The default reproduction uses `test.failing`: Bun reports two expected failures as passes. The environment flag runs the exact same behavioral assertions normally, exiting 1 with two failures; see [failure.log](failure.log) and [expected-failure.log](expected-failure.log). No production code changes are present in the reproduction commit.

[failure.json](failure.json) and the white-background [failure.svg](failure.svg) / [failure.png](failure.png) are captured observations of the rendered component tree and native lookup results, not expected snapshot baselines. The snapshot contains minimal centered top text explaining core's purpose and the observed failure. Capture it separately from any passing evidence; never update an expected baseline to bless the broken selector.
