# Full Game Boy Advance Pipeline 9 fixture

`full-gameboy-current-source` contains the complete TSX dependency tree for the
current RP2350 Game Boy Advance placement. It keeps the board outline, 108
components, pads, ports, nets, traces, groups, copper pours, and fabrication
geometry.

Only CAD-model imports and `cadModel` props were omitted. They do not contribute
to PCB placement, copper geometry, connectivity, or autorouting, and omitting
them keeps this routing repro small.

Core performs a fresh, single-phase Pipeline 9 route without manual paths,
breakout points, or preloaded traces. The matching autorouter fixture is
generated from this board and contains 145 connections, 411 obstacles, and four
layers.
