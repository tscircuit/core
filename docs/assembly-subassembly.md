# Assembly subassemblies

`assembly.subassembly` and `assembly.cadassembly` instantiate the same mechanical
container. They accept `name`, `displayName`, `cadModel`, and `children`.

```tsx
import { assembly } from "@tscircuit/core"

export default () => (
  <assembly.device name="product">
    <assembly.subassembly name="housing" cadModel={{ glbUrl: "/housing.glb" }}>
      <assembly.cadassembly name="bracket" cadModel={{ glbUrl: "/bracket.glb" }} />
      <cadmodel modelUrl="/cover.glb" pcbZ={2} />
    </assembly.subassembly>
  </assembly.device>
)
```

Subassemblies do not have `connectsTo`; use nesting for containment. They inherit
the enclosing assembly frame, with an unanchored outer container at the world
origin. Individual CAD offsets affect that model rather than moving the container.
The core runtime strips a stale `connectsTo` field, and TSX types reject it, even
when used with the initial props 0.0.663 release.

`assembly.screen` retains `connectsTo`. Its selector can target a PCB connector,
a screen, or a named assembly container, regardless of declaration order. Selector
resolution stays within the nearest `assembly.device`; missing, ambiguous, or
cyclic screen attachments produce errors.

`cadModel` supports modelprinter strings, URL objects, JSCAD, and JSX subtrees.
Models can coexist with CAD children; absent/null models emit no geometry.
CAD-child `pcbX`/`pcbY`/`pcbZ` and model offsets are local millimetres in the
assembly frame. These containers emit no pads or schematic symbols. Zero-size,
non-obstructing, do-not-place PCB owners support current Circuit JSON CAD records.
The unnamespaced `<cadassembly>` remains compatible inside component CAD models.
