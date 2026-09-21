# Assembly subassemblies

`assembly.subassembly` and `assembly.cadassembly` instantiate the same component.
Both use the props introduced in `@tscircuit/props@0.0.663`.

```tsx
import { assembly } from "@tscircuit/core"

export default () => (
  <assembly.device name="product">
    <assembly.subassembly name="display-module" connectsTo=".B1 .J1">
      <assembly.cadassembly name="bracket" cadModel={{ glbUrl: "/bracket.glb" }} />
      <cadmodel modelUrl="/cover.glb" pcbZ={2} />
    </assembly.subassembly>
    <assembly.screen name="screen" connectsTo=".display-module" width={26.7} height={19.26} />
    <board name="B1" width={44} height={36} routingDisabled>
      <connector name="J1" pinCount={30} pcbX={0} pcbY={-13}
        footprint="fpc30_p0.5mm_pw0.3mm_pl1.25mm_mpx17.58mm_mpy2.325mm_mpw2mm_mpl3mm_mounttop" />
    </board>
  </assembly.device>
)
```

`connectsTo` resolves within the nearest `assembly.device` (or the circuit root).
It can refer to another subassembly, either alias, a screen, or a PCB component.
Forward references work. A connector supplies its finalized cable insertion point
and orientation. Assembly targets supply their resolved assembly frame. Missing,
ambiguous, self-referential, and cyclic attachments produce errors with names.

Without `connectsTo`, a nested subassembly inherits the nearest assembly frame.
An explicit target replaces inherited placement rather than adding it twice.
An unanchored outer subassembly starts at the world origin. Nested
`assembly.device` starts a separate product scope.

`cadModel` accepts the existing modelprinter string, URL-object, JSCAD, and JSX
forms. It can coexist with CAD children; null and absent models emit no geometry.
The assembly's placement frame is independent of individual model offsets:
`positionOffset`, `zOffsetFromSurface`, and CAD-child `pcbX`/`pcbY`/`pcbZ` are local
to that frame. They affect that model, not sibling/child assemblies or attachments.
Positions are millimetres in right-handed board space (+X right, +Y top, +Z above).
Bottom-layer placement flips local X and Z, and rotates with the connector.

These elements are mechanical containers, not electrical subcircuits. They emit
non-obstructing, zero-size, do-not-place PCB owners for compatibility with current
Circuit JSON CAD records, and do not add pads or schematic symbols. Use boards
and groups for electrical components. The older unnamespaced `<cadassembly>`
continues to work inside component CAD models.
