# Remaining imported-board render overhead

This comparison starts from published core 0.0.1965, including the shared net
selector fix from #4091. Pours, routing, schematic generation and board DRC are
disabled, matching the AM62A configurator's default render path.

## Changes

- Cache the optional-name construction schema by the original Zod schema's
  identity. Each component still parses its own props. Derived schemas and
  non-object schemas retain their own validation behavior.
- Complete disabled board DRC synchronously. Previously it built a database
  subtree and queued an empty async job, forcing another full render cycle.
- Return before constructing a copper-cleanup subtree when the database contains
  no copper pours. When any pours exist, the existing scoped cleanup still runs.

No render phases, lifecycle subscriptions, source warnings, enabled DRC checks,
or copper connectivity checks are removed. Experimental phase-dispatch changes
were not included: the measured benefit was small and the simpler changes above
addressed the larger costs.

## Method

Three alternating baseline/candidate samples, each in a fresh process with the
same installed dependencies. No browser result cache or per-component lifecycle
listeners. The actual AM62A import uses Node 26.4.0 and eval 0.0.1442; the core
fixture uses Bun 1.3.2, on the same macOS arm64 host. Both actual-board bundles
receive the configurator's existing compatibility patches identically.

The AM62A timer includes reading TSX sources, executing them through eval and
`renderUntilSettled`, but excludes process/module startup, output serialization,
network transfer and the PCB viewer. The core fixture timer includes component
construction and all settling cycles, excluding module startup/serialization.

The benchmark now reports phase visit counts and a second output hash that
normalizes only `source_project_metadata.software_used_string`. The published
0.0.1965 bundle embeds the previous version label; raw hashes are also retained.
No geometry, connectivity, warnings or error records are normalized.

## Actual AM62A result

| Measurement | Published baseline | Candidate |
| --- | ---: | ---: |
| Total evaluation median | 16.160 s | 7.901 s |
| Total evaluation samples | 15.398, 17.116, 16.160 s | 8.140, 7.885, 7.901 s |
| Execute median | 2.397 s | 1.442 s |
| Render/settle median | 13.728 s | 6.449 s |

All six outputs: 66,347 records, no copper pours or error records, identical
normalized SHA-256:
`9a4b83e0822273db772454fbd26e0702b3fb85dbdef7e56706f3cefa6ec6cabb`.

The earlier single baseline was 12.5 seconds; use the alternating samples above
for this comparison rather than combining measurements from different batches.
The 2-second target is **not achieved**.

## Representative core fixture

The existing imported-board fixture (1,500 parts, 3,000 logical traces, 1,500
connected vias and 1,500 pre-routed PCB traces) improves from **7.094 s to
4.332 s median**. Every phase is visited twice in the baseline and once in the
candidate. All six outputs contain 32,558 records and share normalized SHA-256
`ff16cd9075a8539bb3a2d3ace5cdd288c74a81d160ac198c7307ff74ac345141`.

This fixture is smaller than the real AM62A design, so its absolute runtime is
not a substitute for the actual-board measurement. Raw samples, phase counts,
and record inventories are in `remaining-render-overhead-results.json`.
Reproduce the core comparison with `CORE_BUNDLE` as documented in
`net-resolution-benchmark.md`; the AM62A source is in
https://github.com/tscircuit/customize-am62a-reference-design.

## Next areas to investigate

The initial profile identified phase traversal/dispatch, repeated root and
lifecycle-listener lookups, and per-component source-trace scans as remaining
costs. Removing an empty DRC cycle reduces these costs but does not eliminate
them. Future scheduling work must preserve dirty updates, async dependencies,
component removal and observed lifecycle events.

The application also launches a new worker for every uncached configuration.
Reusing compiled TSX across configurations could reduce execution/startup cost,
but must keep mutable circuits isolated and bound native/WASM worker memory.
The existing browser cache already handles previously rendered configurations;
it does not improve a new configuration's render.
