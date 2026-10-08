# `<assembly.part />`

A part is a generic component of an assembly. Import `assembly` from
`@tscircuit/core` to use the typed JSX element:

```tsx
import { assembly } from "@tscircuit/core"

<assembly.device name="product">
  <assembly.part
    name="bracket"
    displayName="Mounting bracket"
    modelUrl="/bracket.step"
  />
</assembly.device>
```

`name` is required. Geometry is optional: provide at most one of `model`,
`modelUrl`, or `cadModel`. Model-less parts and `cadModel={null}` retain their
source identity without producing CAD geometry. `cadModel` supports the existing
component CAD formats, including JSX `<cadassembly>` and `<cadmodel>` geometry.

Parts inherit the nearest assembly's placement. CAD offsets are in that local,
right-handed frame in millimeters; the world frame is +X right, +Y top, +Z above.
Standalone parts use the world origin. A screen may use a part's name as its
`connectsTo` target. Parts do not create PCB components, schematic components, or
electrical ports. `pcbDisabled` suppresses their CAD geometry.

For compatibility with current Circuit JSON, parts emit a `source_component`
with `ftype: "subassembly"`, retaining `name`, `display_name`, and CAD ownership.
This requires `@tscircuit/props` version `0.0.696` or later.

Parts can define named mounting frames with child reference surfaces, including
parts with no CAD model:

```tsx
<assembly.part name="BRACKET" modelUrl="./bracket.step">
  <assembly.referencesurface shape="rect" plane="xy" zOffset="1mm" />
</assembly.part>
<board mountedTo="BRACKET.anchor" mountGap="2mm" />
```

An unnamed surface defaults to `anchor`. See
[reference surfaces](./assembly-reference-surface.md) for axes and dimensions.
