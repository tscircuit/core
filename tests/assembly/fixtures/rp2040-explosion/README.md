# RP2040 / NEMA17 stage snapshot fixture

This is the unmodified 5,119-record TSX export used by
[3d-viewer #1082](https://github.com/tscircuit/3d-viewer/pull/1082).
The original board is [imrishabh18/rp2040-motor-controller v1.0.48](https://tscircuit.com/imrishabh18/rp2040-motor-controller),
release `bc93e130-7357-4352-a45f-c9cf65563446`. `assembly.source.tsx` preserves
the custom TSX for the NEMA17, four spacers, four bolts, cover and five stages.
The source board is supplied to its `board` prop. PD-Stepper attribution and
GPL-3.0 license are retained in `PD-Stepper-LICENSE`.

The export retains all 300 routed traces, 303 vias and 117 CAD components.
It was produced using the board's pinned core 0.0.2199 with its routing and
copper guards enabled; newer PCB rendering trips that board's ground-pour guard.
The snapshot test evaluates its saved explosion program with current core and
renders the original program natively through circuit-json-to-gltf. Other
explosion snapshot tests generate their programs afresh from TSX in current core.

`assembled.circuit.json.gz` contains the exact JSON (without whitespace).
`models.json.gz` pins the 26 OBJ/GLB downloads with SHA-256 hashes in `manifest.json`.
The loader replaces only remote model URLs with data URLs containing those bytes;
geometry, IDs, source records and explosion instructions are unchanged.
Footprinter models are generated locally. No model download is needed during tests.
The original raw export has 201 pre-existing schema rejections; these fields are
retained, and the explosion records use the published schema.

To regenerate, export the original board TSX plus `assembly.source.tsx` using the
3d-viewer reproduction script (see its fixture README), then run from core:

```sh
bun scripts/update-rp2040-explosion-snapshot-fixture.ts /path/to/assembled.circuit.json
BUN_UPDATE_SNAPSHOTS=1 bun test tests/assembly/assembly-explosion-rp2040-stages.test.tsx
```

The six panels use the same camera and show assembled plus every completed stage.
The final move targets the entire `remove-bolts` stage. Snapshots establish visual
placement and playback, not fastening fit, fabrication readiness or collision clearance.
