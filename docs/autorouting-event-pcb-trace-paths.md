# Saved PCB paths in autorouting events

Local `autorouting:end` events now include `pcbTracePaths`, a JSON-serializable
array accepted by `<autoroutingphase pcbTracePaths={savedPaths} />`. Consumers
can write the array directly to JSON. Core generates it for every completed
local routing stage, including cache hits and precomputed routing, without a
flag or a listener-specific branch.

Each complete non-fanout entry identifies its Simple Route JSON connection by name.
Fanout entries select a PCB port. Route points are in the phase's enclosing group
frame, in millimeters (+X right, +Y up, +Z above; right-handed); translation
applies to points. Physical copper layers are unchanged. Export and import use
one shared placement transform, including the owning connection's first PCB
port as a placement anchor. Keep the phase's routing options, connection names,
and component placement on replay.

For a complete non-fanout route with junctions, each entry preserves one solver
trace segment. Several entries can name the same connection; a segment may join
two internal junctions without touching any PCB port.
The importer checks that the segments form one connected copper network for
each connection and reach every routing terminal. It replays each segment once,
without adding overlapping copper. Connections that share a PCB port, including
duplicate source traces, may be satisfied by the same copper. Plated ports can
join traces across their listed board layers. Port-to-port path arrays remain
supported.

The array contains this stage's copper, not all previously routed traces.
Fanout-stage exports remain port-anchored escapes and require the same fanout configuration;
the follow-up autorouter still routes the remaining connection and may choose
different geometry for that unsaved copper. A follow-up path anchored only at
an escape junction cannot itself select a PCB port and may be unrepresentable.

If a complete stage cannot be represented by the saved-path API, `pcbTracePaths`
is omitted and `pcbTracePathsUnavailableReason` explains why. Examples include
jumpers, through-obstacle segments, disconnected trace networks, ambiguous selectors,
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

Measured on Intel Core i5-12500H, Linux x64, Bun 1.3.3. Each conversion includes
connection lookup, inverse transforms, schema parsing, and importer validation.
After 10 warmups, 100 iterations measure conversion and compact JSON serialization
separately. Serialization is a consumer cost, not performed by core's exporter.

| Fixture | Points | Conversion median / p95 | JSON median / p95 | JSON bytes |
| --- | ---: | ---: | ---: | ---: |
| 1 routed connection | 10 | 0.416 / 0.764 ms | 0.007 / 0.017 ms | 926 |
| Dense RP2040, 18 connections | 472 | 25.982 / 37.984 ms | 0.798 / 1.090 ms | 46,483 |
| Synthetic 64-connection scaling case | 128 | 7.760 / 10.925 ms | 0.165 / 0.232 ms | 13,530 |

The dense routing stage took approximately 28,858 ms including export; the median
conversion cost is about 0.090% of that duration. The one-connection phase took
620 ms. The 64-connection case deliberately uses a simple custom router and
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
