# Pocket Audio Player route-import fixture

Saved during development of [Gokul's Pocket Audio Player](https://tscircuit.com/gokul/pocket-audio-player)
on October 2–3, 2026. This is the earlier 55 × 85 mm, six-layer revision,
not the currently published two-layer board. The original Circuit JSON records
`@tscircuit/core@0.0.2050`.

- `source.circuit.json` and `pcb.circuit.json` retain the original netlist and
  board placement, including every component and pad. They are separated by
  element type to keep each file below the formatter's size limit.
- `btn-play-routes.json` is the unchanged `BTN_PLAY` entry from the saved
  pre-workaround router response. Its ten pieces connect the U1 IO5 input,
  SW2 play/menu button, and R81/C71. The test verifies the original five
  port IDs, coordinates, and layers against the board.
- Other routing, vias, pours, old diagnostics/debug objects, schematic and CAD
  records are omitted. This isolates the saved button route without generating
  new geometry or mixing it with later routing.

The test replays the captured response through Core's production route importer.
Five pieces lose ownership. The control supplies the already-known net identity
while preserving all route points and emitted via geometry. Contact errors fall
from 12 to 0; disconnected and dangling endpoint diagnostics each fall from 8
to 1. The remaining endpoint at (7.785, 15.75) is retained in the assertions.
This is an import reproduction, not a fresh autorouter solve or full-board DRC.
Snapshots use the native renderer: a board overview and an inner2 crop at SW2.
Notes show the tested diagnostic counts because native error labels overlap.

Original local capture names and SHA-256 hashes (before extracting fixtures):

- `all-routed.circuit.json`:
  `90d064fbd75fe15cd1f0ab45eb2990cf17f93b433b178ecdf5e7f79a2a28a933`
- `copper-results-before-graph.json`:
  `818bbfa4ba429867d282fa98485d733d85ebe87da0a95f921dc9c329cea3c287`

The audio-jack and JST footprints derive from KiCad's
`Jack_3.5mm_CUI_SJ1-3533NG_Horizontal_CircularHoles` and
`JST_PH_B3B-PH-K_1x03_P2.00mm_Vertical` footprints, respectively.
See [KiCad's library repository](https://github.com/KiCad/kicad-footprints)
and the preserved [license notice](KICAD-LICENSE.md).
