# Assembly drawing pages

Drawing pages describe paper layout independently of the assembly's physical
placement. Core emits `drawing_page`, `drawing_part_view`, and optional
`drawing_page_title_block` Circuit JSON records after CAD model rendering.
Dimension children emit resolved `drawing_dimension_line` records.

```tsx
import { assembly } from "@tscircuit/core"

// Inside the mounted LAMP device from the reference-surface-lamp fixture:
<assembly.drawing.page name="lamp-general-arrangement" size="iso_a3">
  <assembly.drawing.titleblock title="DESK LAMP - GENERAL ARRANGEMENT"
    identificationNumber="LMP-001-GA" revisionIndex="A"
    legalOwner="tscircuit" creator="tscircuit" approvalPerson="PRELIMINARY"
    dateOfIssue="2026-10-21" sheetNumber={1} numberOfSheets={1} />
  <assembly.drawing.partview partRef=".LAMP" name="front"
    displayName="FRONT ELEVATION" direction="y-"
    width={90} height={140} centerX={-105} centerY={-20} />
  <assembly.drawing.partview partRef=".LAMP" name="top"
    displayName="TOP VIEW" direction="z+"
    width={90} height={90} centerX={-105} aboveRef=".front" />
  <assembly.drawing.partview partRef=".LAMP" name="right"
    displayName="RIGHT ELEVATION" direction="x+"
    width={90} height={140} rightOfRef=".front" centerY={-20} />
  <assembly.drawing.partview partRef=".LAMP" name="overview"
    displayName="ASSEMBLED ISOMETRIC" direction="isometric"
    width={115} height={180} centerX={105} centerY={25} />
</assembly.drawing.page>
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
Dimension resolution lazily loads the CAD geometry converter and PoppyGL camera
utilities; it does not rasterize a drawing.

The exporter uses the published jscdn package:
`https://jscdn.tscircuit.com/@tscircuit/circuit-json-to-drawing/0.0.3.tgz`.
Snapshots render at 4 pixels/mm with 2x supersampling.

## Real assembly examples

The visual fixtures reuse the reference-surface desk lamp's mounted geometry:
its stepped base with a cable passage, hollow stem, bulb, and tapered shade with
three support ribs and a mounting collar. The general-arrangement sheet uses
third-angle placement: top above front, right elevation beside front. Equal
front/right viewport sizes align their extents; the top viewport's width and
aspect ratio preserve the same fitted width for this 72 × 72 × 112 mm assembly.
The shade sheet cuts through the actual shell and collar at world X=0 and
shows the resulting hatching beside its front elevation. Separate sheets show
the base's elevations and underside, and a carrier board's mounting/header drills.
All viewports and their labels leave the bottom-right title block clear.

These are preliminary arrangement/inspection sheets. `FIT` denotes automatic
viewport fitting, not a declared manufacturing scale. Views with dimensions emit
the resolved fit scale so annotations align at any export resolution. Tolerances
and GD&T annotations are not supplied by this API. Standalone board holes are included by their owning
subcircuit as well as component-owned geometry when resolving source groups.

## Dimensions

Nest dimensions inside a part view and choose exactly one target:

```tsx
<assembly.drawing.partview partRef=".tube" name="end-view"
  direction="z+" width={100} height={80}>
  <assembly.drawing.dimension name="bore" edgeRef=".tube > .inner_top" />
  <assembly.drawing.dimension widthOfView />
  <assembly.drawing.dimension heightOfView />
</assembly.drawing.partview>
```

`widthOfView` and `heightOfView` measure the selected geometry on the camera's
right/up axes in physical mm, independently of viewport size and paper scale.
They work with assembly parts, groups, boards and imported models supported by
the CAD converter. Section views measure only retained geometry.

`edgeRef` selects exactly one native named feature within the view's selected
parts. Currently, named features are read from JSCAD plans, including Fiber
models authored with `topOutlineName` / `bottomOutlineName` on `ExtrudeLinear`,
and native `nameReference` / `nameOutlines` operations. For example, an extrusion
of a 34 × 14 mm bore profile named `inner_top` measures 34 mm in an end view.
Closed or curved outlines use their larger projected axis (horizontal on ties),
not perimeter length. Construction feature placement, CAD origins, unit scales,
model fitting, rotations and bottom-layer placement follow the rendered solid.
Section planes also clip feature attachments. Mesh indices and arbitrary names
are not interpreted as stable features; imported mesh/STEP feature labels are not
yet read by this native-feature provider.

Core formats measurements in mm with up to three decimal places (three
significant digits for values below 0.001 mm), places width
lines above and height lines to the right of the geometry, and separates parallel
dimension lines by 5 paper mm. Optional `name` is annotation identity, independent
of the measurement text. Resolved line endpoints and witness points use
page-centered paper mm (+X right, +Y up); renderers do not recalculate values.
Leave space around viewports for dimension lines and labels.

Use `await circuit.renderUntilSettled()` for pages with dimensions. Core resolves
and validates every dimension before inserting any records for that page.
Missing, ambiguous or out-of-selection feature references, empty sections and
zero projected extents are errors. A failed model load cannot be measured using
a placeholder bounding box. Pages without dimensions keep their synchronous
metadata-only behavior.

### Hole spacing and edge offsets

Use paired references to measure between two selected features:

```tsx
// PCB mounting or plated holes, measured between their centers:
<assembly.drawing.dimension fromRef=".carrier .H1" toRef=".carrier .H2" axis="x" />
// Infer the nearer left/right board edge from the hole position:
<assembly.drawing.dimension fromRef=".carrier"
  toRef=".carrier .H1" axis="x" />
// Named native CAD hole outlines (e.g. ExtrudeLinear topOutlineName):
<assembly.drawing.dimension fromRef=".plate > .bore1" toRef=".plate > .bore2" axis="y" />
// Infer the nearer left/right edge of a named outer outline:
<assembly.drawing.dimension fromRef=".plate > .rim"
  toRef=".plate > .bore1" axis="x" />
```

Both `fromRef` and `toRef` are required, and cannot be combined with `edgeRef`,
`widthOfView`, or `heightOfView`. Each selector must match exactly one hole,
board, or named native outline within the view's selected geometry. PCB references
use final drill coordinates after layout, including footprint rotation and layer
placement. CAD references reuse the native feature transforms used by `edgeRef`.

Anchors are optional and inferred from projected geometry. Disjoint references,
including two hole outlines, use their centers. When a board or outline's projected
bounds contain the other reference's bounds, core chooses the nearest bounding
edge and aligns its witness with the other reference's center. An explicit `axis`
restricts this choice to left/right or top/bottom; with no axis, it chooses the
nearest of all four edges. Ties choose x before y, then left before right or bottom
before top. Equal bounds do not infer an enclosing edge.

Explicit `fromAnchor`/`toAnchor` always override inference. `center` requests
center-to-center measurement even for nested outlines, such as concentric bores.
`left`, `right`, `top`, and `bottom` select the midpoint of that edge of the
reference's projected bounding rectangle. A native circular bore's center is the center of
its projected bounds; arbitrary asymmetric outlines use that same bounds-center
rule, not a centroid. PCB holes expose their through-axis center at the board
midplane and accept only `center`. Folded PCB reference anchors are not yet
supported and produce an error.

`axis="x"` measures horizontal separation and `axis="y"` vertical separation in
physical view-space mm. Without `axis`, inferred edge offsets are perpendicular
to their edge; otherwise core chooses the larger separation, using x on ties. These directions and the edge anchors are relative to the
rendered view, not CAD world axes. Reversing the references preserves the positive
measurement. The witness lines attach to the projected anchors. Section cuts
never move a hole center: an anchor removed by the section is rejected, as are
coincident anchors or zero separation along the requested axis.

## Source organization

The page component and its render-phase implementation live together in
`lib/components/primitive-components/AssemblyDrawingPage/`. Shared drawing
helpers live in `lib/utils/assembly-drawing/`: `dimensions/` contains measurement,
projection, annotation placement and reference resolution; `geometry/`
contains model-feature extraction and view-geometry loading. Page placement and
part-selection helpers live at the drawing utility directory's root.
