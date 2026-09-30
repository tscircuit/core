# Assembly subassemblies

`assembly.subassembly` and `assembly.cadassembly` instantiate the same mechanical
container. They accept `name`, `displayName`, `modelUrl`, `cadModel`, and `children`.

```tsx
import { assembly } from "@tscircuit/core"

export default () => (
  <assembly.device name="product">
    <assembly.subassembly name="housing" modelUrl="/housing.glb">
      <assembly.cadassembly name="bracket" modelUrl="/bracket.glb" />
      <cadmodel modelUrl="/cover.glb" pcbZ={2} />
    </assembly.subassembly>
  </assembly.device>
)
```

Subassemblies do not have `connectsTo`; use nesting for containment. They inherit
the enclosing assembly frame, with an unanchored outer container at the world
origin. Individual CAD offsets affect that model rather than moving the container.
The updated props schema strips a stale `connectsTo` field at runtime,
and TSX types reject it.

`assembly.screen` retains `connectsTo`. Its selector can target a PCB connector,
a screen, or a named assembly container, regardless of declaration order. Selector
resolution stays within the nearest `assembly.device`; missing, ambiguous, or
cyclic screen attachments produce errors.

`cadModel` supports modelprinter strings, URL objects, JSCAD, and JSX subtrees.
Models can coexist with CAD children; absent/null models emit no geometry.
CAD-child `pcbX`/`pcbY`/`pcbZ` and model offsets are local millimetres in the
assembly frame. These containers emit CAD records with source identities and no
PCB component references. They emit no PCB components, pads, or schematic symbols.
The unnamespaced `<cadassembly>` remains compatible inside component CAD models.

## Importing model URLs

All four assembly elements accept `modelUrl`. Format detection matches
`<cadmodel>` (GLB, GLTF, OBJ, STL, STEP/STP, WRL/VRML, including `#ext=...`).
Relative assets resolve using `projectBaseUrl`. Unknown extensions retain the
`<cadmodel>` STL fallback. `modelUrl` and `cadModel` cannot be combined.

```tsx
<assembly.device name="product" modelUrl="/housing.glb">
  <board name="B1" width={30} height={20}>
    <connector name="J1" pinCount={4} footprint="pinrow4" />
  </board>
  <assembly.screen name="display" connectsTo=".B1 .J1" modelUrl="/display.glb" />
</assembly.device>
```

A device model is at the world origin and does not transform its children.
A screen URL model inherits the connector attachment frame and replaces the
usual dimension-derived model. Width and height remain an optional paired input
and do not scale imported geometry. Model-less device behavior is unchanged.
Use a subassembly's `cadModel` or CAD children for advanced model options.

## Modelprinter and footprinter strings

All assembly elements also accept `model`, for example:

```tsx
<assembly.device name="demo" model="soic8" />
<assembly.screen
  name="display"
  connectsTo=".B1 .J1"
  model="flexscreen_w26.7mm_h19.26mm_sitsflat"
/>
```

`model` is a trimmed, non-empty modelprinter/footprinter string. Core emits
`https://modelcdn.tscircuit.com/jscad_models/<URL-encoded-model>.glb` as the CAD
model URL; model geometry is fetched by the viewer. It does not generate a PCB
footprint, pads, or connections. Choose only one of `model`, `modelUrl`, or
`cadModel` where supported. Existing `cadModel` strings retain their behavior.
Screen dimensions are optional with `model`; supplied dimensions must still be
paired and positive, and do not resize an explicit model. Device and subassembly
models retain their current assembly frame; screens retain connector placement.
