# Real JLCPCB LED silkscreen rectangle rotation repro

The defect belongs to **tscircuit/core**: `SilkscreenRect` discards arbitrary
parent orientation when emitting `pcb_silkscreen_rect`. These are five supplier
parts exhibiting that same defect, rather than five separate bugs.

| Supplier part | Manufacturer part | Native square side (mm) |
| --- | --- | --- |
| C540987 | HL-C3535F5R3EA-ZW | 4.151884 |
| C540985 | HL-C3535F3V3EA-ZW | 4.151884 |
| C540986 | HL-C3535F4IR3EA-ZW | 4.064 |
| C5445085 | HL-C3535F4IR3GA-ZW | 4.064 |
| C2915611 | G3535N1UVS8U06 365NM | 4.064 |

## Provenance

Footprint source: **JLCEDA/EasyEDA Official Library** ([JLCEDA](https://lceda.cn/),
[EasyEDA](https://easyeda.com/)). The fixture modules preserve the imported
PCB geometry, pin labels and supplier/manufacturer metadata. Only the remote
CAD model property was removed so the reproduction runs without model requests.
Formatting was normalized to the repository's Biome style.

Imported using `@tscircuit/cli` 0.1.2303 on 12 October 2026:

```sh
tsci import C540987 --jlcpcb --use-exact-footprint --exclude-pin-attributes
tsci import C540985 --jlcpcb --use-exact-footprint --exclude-pin-attributes
tsci import C540986 --jlcpcb --use-exact-footprint --exclude-pin-attributes
tsci import C5445085 --jlcpcb --use-exact-footprint --exclude-pin-attributes
tsci import C2915611 --jlcpcb --use-exact-footprint --exclude-pin-attributes
```

The exact-footprint flag matters: the importer must retain the supplier's
native `<silkscreenrect>` rather than replace the footprint with a matched
footprinter string. No rectangle or pad geometry was authored for this repro.

## Reproduce the visual failure

```sh
bun test tests/repros/repro-jlc-led-silkscreen-rect-rotation.test.tsx
```

The top and bottom snapshots each contain all five LEDs at 0, 45, 90, 180 and
270 degrees. At 45 degrees, the pads and polarity artwork turn diagonally while
the yellow square stays horizontal. The other columns provide quarter-turn
controls. Squares are symmetric at quarter turns; pad placement and polarity
artwork make those rotations visible. PCB notes label every supplier part,
angle and layer in the snapshot itself.

## Expose the failing assertion

```sh
TSCIRCUIT_REPRO_STRICT=1 bun test tests/repros/repro-jlc-led-silkscreen-rect-rotation-expected.test.tsx
```

This command should fail on the affected implementation. It requires square
silkscreen axes to match the independently emitted rectangular-pad axes modulo
90 degrees. Current output has `padAxisDegrees: 45` and
`rectangleAxisDegrees: 0` for all five parts on both layers.

Without strict mode, the assertion is a Bun `test.failing` case, so the known
defect is explicit without introducing an ordinary failing test into the suite.
The visual snapshot test is separate and runs normally; a broken import or
snapshot mismatch cannot be swallowed by the expected-failure case.

This is a reproduction-only change. Existing proposals include
[core #4265](https://github.com/tscircuit/core/pull/4265) and the earlier
[repro #4274](https://github.com/tscircuit/core/pull/4274). There is no renderer
workaround or production `SilkscreenRect` change here.
