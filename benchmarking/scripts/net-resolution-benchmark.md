# Full-render net resolution benchmark

`benchmark3-imported-net-resolution` is registered in the browser benchmark suite.
It models an imported board with 1,500 explicitly placed parts, 3,000 logical
traces, 1,500 connected vias, 1,500 pre-routed PCB traces, and 1,054 declared nets.
It uses inline footprints and disables routing, schematic generation, and pours.

The old `benchmark-net-creation.ts` measured only net existence checks and missed
later typed lookups in via/trace `SourceTraceRender`. This replacement calls the
complete `renderUntilSettled()` pipeline. It records total wall time, board-level
phase intervals, output counts, and a hash of the complete Circuit JSON. Phase
intervals are observational elapsed time between board events, not exclusive
CPU samples; they can include deferred work. Per-component lifecycle callbacks
are deliberately avoided because they add significant overhead at this scale.

```sh
bun benchmarking/scripts/benchmark-net-resolution.tsx
# Automatic creation must also stay correct/fast:
bun benchmarking/scripts/benchmark-net-resolution.tsx 1500 implicit
```

Use a fresh process for every sample, run variants sequentially on the same
machine, and compare at least three samples. To compare built revisions without
changing dependencies, place both bundles under the repository (so their imports
resolve the same node_modules), then pass an absolute path:

```sh
CORE_BUNDLE="$PWD/.cache/baseline.mjs" bun benchmarking/scripts/benchmark-net-resolution.tsx
CORE_BUNDLE="$PWD/.cache/candidate.mjs" bun benchmarking/scripts/benchmark-net-resolution.tsx
```

The timer covers circuit instantiation and the complete render, but excludes
module loading and output serialization. The script fails on circuit error
records. Require identical output hashes and inventories when comparing code
changes that should only affect performance. Published version metadata may
need normalization when comparing different release versions; do not normalize
geometry or connectivity.

This fixture exercises the relevant import characteristics without committing
the entire TI design. The PR also validates the actual AM62A TSX through
`@tscircuit/eval`, in fresh Node processes with pours off and no result cache.

## Measured comparison

Three fresh sequential processes per declared-net variant, macOS arm64 / Bun
1.3.2, same dependencies. The pre-#4090 control restores the original
`createNetsFromProps` lookup in the otherwise identical released bundle.

| Variant | Full render median | CreateNetsFromProps | SourceTraceRender |
| --- | ---: | ---: | ---: |
| Original lookup | 16.13 s | 8.81 s | 0.10 s |
| Released #4090 | 13.96 s | 0.06 s | 7.59 s |
| Shared selector index | 6.92 s | 0.07 s | 0.18 s |

All nine outputs have the same full SHA-256 and 32,558 records. The implicit-net
sanity check (one fresh run per variant) also preserves the same hash and record
count: 14.89 s released, 12.10 s shared index.

Actual AM62A import, Node 26.4.0 / eval 0.0.1442, three fresh sequential processes
per variant, pours off: **28.38 s → 12.02 s median total evaluation**, and
**25.77 s → 9.97 s median core rendering**. The app's existing 12-layer and
trace-incidence compatibility patches were applied identically to both bundles;
no diagnostic net warming or per-component event listeners were enabled. All
six outputs have the same hash after removing only the software-version label:
66,347 records, no pours, no error records. This is local timing, not a new
production deployment measurement.

Samples and hashes are in `net-resolution-results.json`. These measurements have
normal wall-clock variability; the persistent phase shift and output equality
are more informative than any single run.
