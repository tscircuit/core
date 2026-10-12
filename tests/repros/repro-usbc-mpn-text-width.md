# USB-C MPN text width forces unnecessary GND crossings

Source: [pixalynx/usbc-led-switch](https://tscircuit.com/pixalynx/usbc-led-switch#files)
v0.0.1, release `16479d74-f356-4246-9984-2722eb516d85`.
Related solver reproduction: [schematic-trace-solver#1315](https://github.com/tscircuit/schematic-trace-solver/pull/1315).

The test renders the complete six-component schematic through Core. It retains
all schematic positions, rotations, pin arrangements, connections, trace names,
and the unconnected VBUS2 pin. PCB footprints, routing paths, copper, and CAD
models are omitted, and PCB rendering is disabled.

## What the reproduction shows

J1's manufacturer-part-number text is
`USB-C 16P SMD receptacle (DX07B024 style)`, left-aligned at x = -5 mm with
font size 0.18 mm. `getSchematicTextWidth` estimates every character as 0.12 mm,
so Core sends a 4.92 mm-wide obstacle ending at x = -0.08 mm to the trace solver.
The actual proportional-font text ends earlier.

The snapshot overlays that Core-generated obstacle in dashed red on the
unaltered Core schematic, making the reserved empty space visible. It also
shows J1's ground rail extending across R1's vertical CC1 trace twice. The
emitted Circuit JSON marks both edges with `is_crossing`.

Expected behavior: the text obstacle should reflect the rendered text bounds,
allowing J1's GND label to fit before R1's CC1 trace. The expected-failure
assertion requires zero GND crossing edges. It does not assert that the
incorrect 4.92 mm estimate must remain.

Rendering and snapshot verification run in `beforeAll`, outside `test.failing`,
so an unrelated setup or snapshot error cannot satisfy the expected failure.
Remove `.failing` when fixing the bug and update the snapshot.

## Run

```sh
bun test tests/repros/repro-usbc-mpn-text-width.test.tsx
```

This PR changes only reproduction tests, their snapshot, and these notes.
No text-width, alignment, or routing implementation is changed. The obstacle
is read from `createSchematicTraceSolverInputProblem`; it is not manually
resized or supplied as a fabricated solver fixture.
