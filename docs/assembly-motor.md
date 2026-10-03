# Assembly motors and board mounting

Use `assembly.motor` to render a NEMA motor without generating a PCB footprint
or schematic symbol. A board component must forward `mountedTo` and `mountGap`
to its underlying `<board>`:

```tsx
import { assembly } from "@tscircuit/core"
import type { BoardProps } from "@tscircuit/props"

const Rp2040MotorController = (props: BoardProps) => (
  <board width="42mm" height="42mm" thickness="1.6mm" {...props}>
    {/* Controller components, traces and mounting holes */}
  </board>
)

export default () => (
  <assembly.device>
    <assembly.motor name="NEMA17" standard="nema17" />
    <Rp2040MotorController mountedTo="NEMA17.backface" mountGap="6mm" />
  </assembly.device>
)
```

`standard` supports `nema8`, `nema17` and `nema23`. Alternatively, use a
modelprinter spec to set body length, shaft length, D-flat depth and other
motor dimensions:

```tsx
<assembly.motor
  name="NEMA17"
  model="nema17_bodylength38mm_shaftlength24mm_flatdepth0.5mm_flatlength15mm"
  shaftFacingDirection="z-"
/>
```

Supply exactly one of `standard` or `model`. Core parses the spec using
`@tscircuit/modelprinter` and resolves the modelcdn GLB automatically.
Mesh generation lives in `jscad-electronics` behind modelcdn.

`shaftFacingDirection` defaults to `z+` and accepts `x+`, `x-`, `y+`, `y-`,
`z+` and `z-`, in the right-handed circuit frame (+X right, +Y top, +Z above).
The motor's local origin is the shaft-side mounting face; the backface is at
local Z = minus the model's body length. Unmounted motors sit at the world origin.

For mounted boards, core keeps the finalized PCB layout in its XY plane at Z=0
and places the motor relative to the board center. `mountGap` measures the
clearance from the backface to the nearest PCB surface, including half the PCB
thickness; it defaults to zero. With `z+` the motor is above the PCB, and with
`z-` it is below. Board mounting currently supports these two directions.
Sideways motors render, but mounting a board to one reports an error because
Circuit JSON does not yet represent rotated PCB boards.

Mount targets resolve by exact motor name within the nearest `assembly.device`,
independently of declaration order. Missing/duplicate targets, unsupported faces
and multiple boards attached to one motor report errors. Names in sibling
assembly devices remain independent. Mounting does not create holes or standoffs:
the controller must include its own compatible mounting-hole pattern.
