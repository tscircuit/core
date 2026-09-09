# Implicit copper pours with automatic via stitching

These four TSX circuits come from the examples in
[implicit-copper-pour-solver PR #13](https://github.com/tscircuit/implicit-copper-pour-solver/pull/13).
They retain their board sizes, placements and connectivity, with automatic pours
and Pipeline9 enabled here. Via stitching uses core's default; the tests do not
opt in or insert manual stitching vias.

- **compact-beacon**: 28 × 28 mm, centered MCU, LED, reset and SWD.
- **led-controller**: 48 × 24 mm, left MCU and six LED/resistor channels.
- **sensor-breakout**: 30 × 46 mm, lower MCU and upper I²C headers.
- **analog-input**: 44 × 34 mm, right MCU, left inputs and bottom-side RC filters.

Every test renders from TSX, checks that stitching vias survive copper cleanup,
and snapshots the top, bottom and combined PCB views. These are simplified
solver examples, without the original tracker's RF matching or external clocks.

```sh
bun test tests/repros/implicit-pour-via-stitching
BUN_UPDATE_SNAPSHOTS=1 bun test tests/repros/implicit-pour-via-stitching
```
