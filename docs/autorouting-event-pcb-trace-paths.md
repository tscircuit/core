# Saved PCB paths in autorouting events

Local `autorouting:end` events now include `pcbTracePaths`, a JSON-serializable
array accepted by `<autoroutingphase pcbTracePaths={savedPaths} />`. Consumers
can write the array directly to JSON. Core generates it for every completed
local routing stage, including cache hits and precomputed routing, without a
flag or a listener-specific branch.

Each path selects a PCB port. Route points are in the phase's enclosing group
frame, in millimeters (+X right, +Y up, +Z above; right-handed); translation
applies to points. Physical copper layers are unchanged. Export and import use
one shared placement transform, including the selected port's layout displacement.
Keep the phase's routing options, selectors, and component placement on replay.

The array contains this stage's copper, not all previously routed traces.
Fanout-stage exports contain escapes and require the same fanout configuration;
the follow-up autorouter still routes the remaining connection and may choose
different geometry for that unsaved copper. A follow-up path anchored only at
an escape junction cannot itself select a PCB port and may be unrepresentable.

If a complete stage cannot be represented by the saved-path API, `pcbTracePaths`
is omitted and `pcbTracePathsUnavailableReason` explains why. Examples include
jumpers, through-obstacle segments, non-port junctions, ambiguous selectors,
and incomplete connection coverage. Export validates with the same importer
used by saved phases; it never emits a partial successful array or turns an
otherwise successful routing run into a routing error. A successfully represented
empty stage can emit `[]`.

## Replay parity

`tests/features/autoroutingphase-emitted-paths-parity.test.tsx` routes the dense
RP2040/flash/USB-C fixture: 18 connections, 475 exported route points, crowded
QFN pads, obstacles, top/bottom copper, and vias. It serializes the event paths
through JSON, renders a fresh circuit using precomputed routing, and compares
1200-pixel-wide RGBA rasterizations. The observed whole-image and foreground
parity are both **100%** (zero differing pixels).

The test requires >=99.99% whole-image parity and >=99.9% foreground parity,
checks trace/via counts and that no autorouter runs during full replay, and
removes a trace as a negative control to prove the visual comparison fails.
The checked-in SVG shows AUTOROUTED and REPLAYED side by side. Separate tests
cover rotated/translated groups on both layers, saved fanout copper, cache
hits, per-phase isolation, and unsupported geometry.

## Cost and the always-on decision

Reproduce with:

```sh
BENCHMARK_PCB_TRACE_PATHS=1 bun test tests/benchmarks/autorouting-phase-pcb-trace-paths.test.tsx
```

Measured on Apple M3 Pro, macOS arm64, Bun 1.3.2. Each conversion includes
selector resolution, inverse transforms, schema parsing, and importer validation.
After 10 warmups, 100 iterations measure conversion and compact JSON serialization
separately. Serialization is a consumer cost, not performed by core's exporter.

| Fixture | Points | Conversion median / p95 | JSON median / p95 | JSON bytes |
| --- | ---: | ---: | ---: | ---: |
| 1 routed connection | 9 | 0.049 / 0.108 ms | 0.0011 / 0.0028 ms | 832 |
| Dense RP2040, 18 connections | 475 | 1.281 / 1.802 ms | 0.0665 / 0.0841 ms | 46,753 |
| Synthetic 64-connection scaling case | 128 | 0.808 / 0.936 ms | 0.0268 / 0.0341 ms | 13,594 |

The dense routing stage took approximately 3,744 ms including export; the median
conversion cost is about 0.034% of that duration. The one-connection phase took
97 ms. The 64-connection case deliberately uses a simple custom router and
skips schematic rendering to isolate exporter scaling; its routing time is not
a representative autorouter baseline.

These small absolute costs justify always-on generation for the measured boards,
including fast cache hits, and keep worker/browser consumers independent of
live core component instances. These are warmed microbenchmarks, not a controlled
whole-render A/B comparison or a guarantee for all board sizes. Payload size and
worker transport add costs not fully represented by conversion timing. Endpoint
matching and importer coverage checks can grow quadratically with connections;
very large boards may warrant further profiling. There is no timing assertion
in CI; parity and correctness tests run normally.
