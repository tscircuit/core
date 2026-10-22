# Assembly drawing pages

Drawing pages describe paper layout independently of the assembly's physical
placement. Core emits `drawing_page`, `drawing_part_view`, and optional
`drawing_page_title_block` Circuit JSON records after CAD model rendering.

```tsx
import { assembly } from "@tscircuit/core"

<assembly.device>
  <assembly.part name="housing"
    cadModel={{ jscad: { type: "cuboid", size: [24, 16, 10] } }} />
  <assembly.drawing.page name="housing-drawing" size="iso_a4">
    <assembly.drawing.titleblock title="Housing" identificationNumber="H-001"
      revisionIndex="A" sheetNumber={1} numberOfSheets={1} />
    <assembly.drawing.partview partRef=".housing" name="plan" direction="z+"
      width="80mm" height="60mm" centerX="-45mm" centerY="60mm" />
    <assembly.drawing.partview partRef=".housing" name="section" direction="x+"
      width="80mm" height="60mm" rightOfRef=".plan" centerY="60mm"
      section={{ axis: "x", offset: "5mm", keepSide: "less", hatchSpacing: "1mm" }} />
    <assembly.drawing.partview partRef=".housing" name="overview" direction="isometric"
      width="160mm" height="80mm" belowRef=".plan" />
  </assembly.drawing.page>
</assembly.device>
```

Pages support ISO A0–A4 and ANSI A–E named sizes with landscape (default) or
portrait orientation, or custom `width` and `height`. Distances are numeric mm or
unit strings. Title blocks are optional; at most one is permitted per page.
Pages contain only part views and a title block.

Each `partRef` must match exactly one part, board, or group in the nearest
`assembly.device`. Groups emit `source_group_id`; assembly parts and transparent
containers emit their resolved `source_component_ids`. Identically named parts
in separate devices remain isolated. Drawing records contain no model URLs,
embedded images, or exporter outputs.

`centerX` and `centerY` are paper-space points relative to the page center: +X
right, +Y up. `leftOfRef`/`rightOfRef` infer horizontal position;
`aboveRef`/`belowRef` infer vertical position. Each selector must match exactly
one sibling part view on the same page. Forward references are supported.
Viewport edges meet with no implicit gap: center separation is half the sum of
their widths or heights. Unconstrained axes default to zero; the other axis
does not inherit the referenced view's center. An explicit center can be used
on that other axis. Both axes may also use relative references.

Opposing references, explicit centers on a referenced axis, missing or ambiguous
targets, self-references, and same-axis dependency cycles are errors. Horizontal
and vertical dependencies resolve independently. Props remain immutable;
Circuit JSON contains the final numeric centers. Core validates a complete page
before inserting its drawing records.

Camera directions use the CAD world frame in mm (+Z up): `x+`, `x-`, `y+`, `y-`,
`z+`, `z-`, and `isometric`. Circuit JSON uses the corresponding snake_case
direction names. Section offsets and retained sides also remain in CAD world
coordinates. The exporter converts these to its glTF frame (+Y up). Every view
automatically fits the selected geometry to its viewport. `showHiddenEdges`
enables dashed hidden edges; closed section cuts use diagonal hatching.

## Visual snapshots

Core's test fixture includes an async drawing matcher backed by
`@tscircuit/circuit-json-to-drawing`:

```tsx
await circuit.renderUntilSettled()
await expect(circuit).toMatchDrawingSnapshot(import.meta.path)
```

For multiple pages, pass `{ drawingPageId }` to select one page. The matcher
resolves the emitted geometry selection, converts it to glTF, and renders an SVG
page with PoppyGL outline views. It caches scenes across views of the same part.
The drawing exporter is a test dependency and is not imported by core's runtime.

The initial integration pins the exporter release PR while its jscdn publishing
workflow awaits activation. After publishing, its dependency can use
`https://jscdn.tscircuit.com/@tscircuit/circuit-json-to-drawing/0.0.2.tgz`.
