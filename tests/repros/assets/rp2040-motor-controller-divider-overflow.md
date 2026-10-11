# RP2040 motor-controller divider overflow fixture

Affected board: [imrishabh18/rp2040-motor-controller](https://tscircuit.com/imrishabh18/rp2040-motor-controller#schematic).

- Published version: **1.0.42**.
- Release ID: `e8d285f7-c3d8-46f5-9a54-344fdde0124e`.
- Affected sheet: **motor_driver** / **Stepper Motor Driver**, sheet index 3.
- Affected component: **R_DRV_ENABLE_PU**, between the H-Bridge, Power & Control and Stepper Motor Output sections.
- Original build dependencies: `@tscircuit/core@0.0.2032`, `circuit-to-svg@0.0.423`, `schematic-symbols@0.0.244`.

The JSON fixture is extracted from the published `dist/index/circuit.json`:

https://registry-api.tscircuit.com/package_files/get?package_release_id=e8d285f7-c3d8-46f5-9a54-344fdde0124e&file_path=dist%2Findex%2Fcircuit.json

It preserves every schematic record associated with `schematic_sheet_2` and all source records needed to retain connection metadata. PCB records and the other nine schematic sheets are omitted. Positions, names, symbols, routes, net labels, and the original dashed divider are unchanged. The visual test omits only the A4 paper frame when fitting the viewport.

The original divider is at **x=9.19**. The resistor's nominal box ends at **x=8.42**, but its rendered reference starts at **x=8.13** and ends beyond the divider (approximately x=9.68 using renderer text metrics).

`SchematicSection._computeSectionBounds` includes component boxes and associated standalone `schematic_text` records, but does not include reference/value text rendered directly from symbol primitives. The resistor has no standalone reference text record. The board's custom refinement adds routed net-label bounds but likewise omits symbol reference/value bounds.

The published-sheet test records the real visible failure. The companion live-circuit test isolates core's divider calculation and marks the desired reference clearance as an expected failure. A future fix should include symbol text bounds in section geometry and turn that test into a regular passing test.
