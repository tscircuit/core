# Full Game Boy Advance Pipeline 9 fixture

`full-gameboy-current.unrouted.circuit.json` is the complete source-and-PCB
Circuit JSON captured from the current RP2350 Game Boy Advance project. It keeps
the board outline, 108 components, pads, ports, nets, source traces, groups,
copper pours, and fabrication geometry.

Only generated routing state and prior diagnostics were removed:

- `pcb_trace`
- `pcb_via`
- `*_error`
- `*_warning`

This makes Core perform a fresh, single-phase Pipeline 9 route without manual
paths, breakout points, or preloaded traces. The matching autorouter fixture is
generated from this file and contains 145 connections, 411 obstacles, and four
layers.
