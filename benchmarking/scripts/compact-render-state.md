# Compact render phase state and unobserved lifecycle overhead

Baseline: merged #4093 (`4356989`), including the shared selector and empty-DRC
fixes. This measures the next incremental change, not the older slow releases.

This report records the initial packed-state implementation at `829f968`. The
current implementation shares ordinary state objects between an indexed array and
a lazily created named map; see the final comparison
in [render-state-ablation.md](./render-state-ablation.md).

## Changes

Each Renderable previously allocated a mutable `{initialized, dirty}` object for
every phase at construction. The frozen AM62A design has 39,779 live renderables
and 69 phases: **2,744,751 state objects**, plus their containing maps. None of
those maps were inspected during the unobserved diagnostic render.

The initial implementation used one byte per phase until a caller reads `renderPhaseStates`.
On inspection it materializes a stable mutable object map, and subsequent phase
updates honor that map. Callers can still inspect state during a handler, modify
state directly, mark later phases dirty, remove components, and inspect render
graphs. No render phases or async dependency barriers are skipped.

The same hot path also avoids allocating temporary arrays when checking previous
async effects, checks the isolated-render phase before testing component fields,
and maintains an optional root hint to avoid lifecycle event-name construction
and listener lookups when no lifecycle listeners exist. Listener changes take
effect immediately, including changes inside handlers; debug output and custom
roots without listener inspection retain their prior paths.

## Method

Three alternating baseline/candidate samples, each in a fresh process on macOS
arm64 with identical installed dependencies. No CPU profiler, result cache, or
per-component lifecycle subscriber in the timed samples. The full AM62A import
uses Node 26.4.0 / eval 0.0.1442; the representative core fixture uses Bun 1.3.2.
Both AM62A bundles receive the application's existing compatibility patches.

The app source changed after the prior benchmark. This comparison freezes
`deployment-assets/circuit-source.json` from app revision `cf6e541` and records
its SHA-256 in `compact-render-state-results.json`. Both variants evaluate the
same frozen source with default modules and pours disabled. Do not compare these
absolute timings or record counts to the earlier source's measurements.

The AM62A timer includes source reading, eval execution and all render/settle
work, but excludes process/module startup, serialization, transfer and viewer
rendering. The core fixture includes construction and full settling, excluding
module loading and serialization. Core benchmark reproduction uses `CORE_BUNDLE`
as documented in `net-resolution-benchmark.md`.

## Initial results (829f968)

For the isolated contribution of each change and the cleaned implementation, see
[render-state-ablation.md](render-state-ablation.md). These original samples are
retained for comparison; absolute timings vary between measurement batches.

| Workload / metric | Merged baseline | Candidate |
| --- | ---: | ---: |
| AM62A evaluation median | 5.588 s | 4.221 s |
| AM62A render/settle median | 4.564 s | 3.195 s |
| AM62A execute median | 0.972 s | 0.904 s |
| AM62A peak RSS median | 1,031 MiB | 794 MiB |
| Core fixture full render median | 2.706 s | 1.753 s |
| Core fixture RSS after render median | 1,349 MiB | 821 MiB |

Node peak RSS uses `process.resourceUsage().maxRSS` in KiB, as documented in
[Node's process API](https://nodejs.org/api/process.html#processresourceusage).
The core fixture separately records `process.memoryUsage().rss` in bytes at
render completion; that metric is not a peak measurement. Memory figures include
the whole process and dependencies, not just phase state.

All six AM62A outputs match: 66,219 records, no pours or errors, normalized hash
`ab07dad4dab9537a53d5ccaed1b804d4e9a9401812a6efafdae4885b92072b54`.
All six core fixture outputs match: 32,558 records, normalized hash
`ff16cd9075a8539bb3a2d3ace5cdd288c74a81d160ac198c7307ff74ac345141`.
Normalization removes only the software-version label. Both core variants visit
all 69 board phases once. Samples and inventories are in the accompanying JSON.

**The real-board 2-second target is not achieved.** The smaller core fixture's
1.75-second result must not be presented as the AM62A render time. A separate CPU
profile still finds about 1 second of exclusive CPU in phase traversal/dispatch,
plus repeated root resolution and source-trace scans. Eval execution remains
about 0.9 seconds; startup/transfer/viewer costs are additional.

## Compatibility checks

Regression tests cover compact versus eagerly inspected states, inspection during
initialization, direct mutation and map replacement between phases, dirty updates,
component removal, failure state, async effects and subtree dependency barriers,
live listener changes and custom-root event fallback. Existing lifecycle, root,
subcircuit isolation, async footprint, DRC, and duplicate-name tests also run.
