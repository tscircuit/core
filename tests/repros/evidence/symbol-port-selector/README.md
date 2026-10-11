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

On the [reproduction branch / PR #4545](https://github.com/tscircuit/core/pull/4545), the default tests use `test.failing`: Bun reports two expected failures as passes. The environment flag runs the exact same behavioral assertions normally, exiting 1 with two failures; see [failure.log](failure.log) and [expected-failure.log](expected-failure.log). No production code changes are present in that branch.

[failure.json](failure.json) and the white-background [failure.svg](failure.svg) / [failure.png](failure.png) are captured observations of the rendered component tree and native lookup results, not expected snapshot baselines. The snapshot contains minimal centered top text explaining core's purpose and the observed failure. Capture it separately from any passing evidence; never update an expected baseline to bless the broken selector.

## Fix branch

Generate a descendant selector to support the actual Symbol parent. Direct ports also resolve with this selector. Export checks all matching **ports**, requires exactly one, and verifies identity against the original anchor. The error reports the observed port count, so zero matches are no longer called "not unique". CLI forwards this core message and requires no separate code change.

The same reproduction assertions now run as ordinary tests. Additional controls cover direct and symbol-owned ports before cache warming, numeric and named pins, duplicate component names, zero matches, a unique wrong port, and a selector matching non-port elements alongside one valid port. Only uniquely selected original ports export.

```sh
bun test tests/repros/repro-symbol-port-selector.test.tsx tests/repros/repro-pcb-path-selector-ambiguity.test.tsx tests/repros/port-selector-boundaries.test.ts
bun tests/repros/evidence/symbol-port-selector/capture.tsx pass
bunx tsc --noEmit
```

See [pass.log](pass.log), [pass.json](pass.json), and the independent [passing snapshot](pass.png). Failure evidence is preserved unchanged. This fix is stacked on #4545; merge the reproduction first and then retarget/merge the fix, or land both commits together. Neither PR is merged by this task.

Validation: 3 focused tests pass (34 assertions); 19 existing selector/export tests pass; after the final port-only cardinality change, all 5 export/replay tests pass again, including dense RP2040 visual replay parity (zero differing pixels) and translated/rotated groups on both layers. The end-to-end custom-symbol export fixture from #4541 at `98ae04ebeadaf2990fcdf8be109461947002e357` also passes against this fix, exporting one path with no unavailable reason. See [regression-checks.log](regression-checks.log), [export-checks.log](export-checks.log), and [custom-symbol-export.log](custom-symbol-export.log). `bunx tsc --noEmit` passes on both branches; Biome formatting and `git diff --check` pass.
