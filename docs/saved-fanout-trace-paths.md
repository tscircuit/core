# Reusing saved fanout trace paths

Pass `pcbTracePaths` to `<fanout>` (or `<breakout>`) to reuse pre-generated
copper routes. The array can be stored in a JSON file. Validate imported JSON
with `savedJson.map((path) => fanoutTracePath.parse(path))` to obtain typed paths.
Connections use port selectors rather than generated Circuit JSON IDs.

```tsx
import type { FanoutTracePath } from "@tscircuit/core"

const savedPaths: FanoutTracePath[] = [
  {
    connection: "U1.1",
    route: [
      { route_type: "wire", x: 0, y: 0, width: 0.2, layer: "top" },
      { route_type: "wire", x: 1, y: 1, width: 0.2, layer: "top" },
      { route_type: "wire", x: 3, y: 1, width: 0.2, layer: "top" },
    ],
  },
]

// U1's pin 1 must actually be at (0, 0) in this fanout's local frame.
<fanout name="U1_FANOUT" pcbTracePaths={savedPaths}>
  <MyChip name="U1" />
</fanout>
```

The first wire point is the selected PCB port. The last wire point creates an
explicit fanout exit automatically; do not also add a fanoutpoint for that port.
Board traces still declare connectivity normally, e.g.
`<trace from="U1.1" to="J1.1" />`. Global routing starts at the saved exit.
The saved bends and widths remain fixed, and subsequent routing treats them as
existing copper obstacles.

Coordinates are **fanout-local points**: numeric distances are millimeters,
and unit strings such as `"0.2mm"` are normalized by `@tscircuit/props`. +X right, +Y up,
right-handed with +Z above the board. Core applies the fanout's translation,
rotation, and layout movement. Layer names identify physical board layers;
use `bottom` explicitly for bottom-layer copper. Routes must start at the
selected port's actual position after placement; core reports a mismatch rather
than moving or stretching saved copper.

Use wire points and via points from Circuit JSON route syntax. A via changes
layers and can specify `via_diameter` and `via_hole_diameter` in millimeters:

```json
{ "route_type": "via", "x": 1, "y": 1,
  "from_layer": "top", "to_layer": "bottom",
  "via_diameter": 0.6, "via_hole_diameter": 0.3 }
```

Surround a via with wire points on the corresponding layers, and finish on a
wire point. Only wire/via routes are supported. `fanoutTracePath.parse(value)`
is exported for validating stored data before rendering.

`pcbTracePaths` replaces automatic routing for that fanout, so it must cover
all its routing connections. Each route describes one port-to-exit connection;
use a separate fanout for automatically routed connections or internal routes.
Selectors must resolve to ports inside the fanout. Invalid anchors, missing
connections, duplicate exits, and unavailable board layers produce errors.
Omit `pcbTracePaths` to retain normal automatic fanout behavior.
