# Bottom-layer GND via route

This reduces an Allwinner board's ground-return topology to two capacitors and
two through-vias. It uses the real `beta_pipeline7` autorouter. The capacitor
returns stay on top; the net-level connection between their GND vias uses bottom.

The keepout is added for the reduction to make the bottom route deterministic.
Without it, this small circuit routes on top and does not reproduce the missing
source trace ID. No router results or Circuit JSON records are injected or edited.

## Core reproduction

From the repository root:

```sh
bun install
bun test tests/repros/repro-gnd-via-bottom-route.test.tsx
```

The test records current output: one bottom trace without `source_trace_id`.
It also verifies that the full connectivity map connects that trace and both
vias to GND through the emitted endpoint IDs. A missing source trace ID alone
does not establish that the route is electrically disconnected or invalid.

## Reproduce the shorts report

The standalone circuit can be built with tscircuit 0.0.2565 (core 0.0.1929):

```sh
mkdir /tmp/gnd-via-bottom-route
cp tests/repros/gnd-via-bottom-route/index.circuit.tsx /tmp/gnd-via-bottom-route/
cd /tmp/gnd-via-bottom-route
bun init -y
bun add --dev tscircuit@0.0.2565
bunx tsci build index.circuit.tsx --disable-parts-engine
bunx tsci check shorts dist/index/circuit.json
```

Expected: no shorts between these GND vias and their connecting trace.
Actual: two bottom/Gerber reports, one at each via, between `pcb_via_0, pcb_via_1`
and `source_net_0_mst0_0`.

The checker currently falls back to `pcb_trace_id` as a separate group when
`source_trace_id` is absent, even though the full connectivity map resolves that
PCB trace to GND. This draft provides the real-router input and output behavior
for reviewing the correct handling; it does not prescribe a core fix or add one.
