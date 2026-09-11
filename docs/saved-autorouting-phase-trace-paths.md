# Saved routes in autorouting phases

`<autoroutingphase pcbTracePaths={paths} />` accepts the same `FanoutTracePath[]`
format as `<fanout>`. The props package parses numeric distances as millimeters
and normalizes unit strings. Each `connection` is a port selector such as
`"U1.1"`; traces still declare the electrical connections.

For a complete saved route, begin at the selected port and end at another
endpoint of its connection:

```tsx
<autoroutingphase
  phaseIndex={0}
  pcbTracePaths={[
    {
      connection: "U1.1",
      route: [
        { route_type: "wire", x: 0, y: 0, width: 0.2, layer: "top" },
        { route_type: "wire", x: 2, y: 2, width: 0.2, layer: "top" },
        { route_type: "wire", x: 4, y: 0, width: 0.2, layer: "top" },
      ],
    },
  ]}
/>
<trace from="U1.1" to="U2.1" />
```

Here U1.1 is at (0, 0), and U2.1 is at (4, 0). The saved copper replaces the
phase's autorouter. Without explicit `connection` or `connections`, path selectors
assign their traces to the phase. Explicit selectors and trace/net phase indexes
continue to define the phase's routing scope. Paths must cover every connection
in that scope; ordinary phases must connect every endpoint.

Use `autorouter="fanout"` (or `"single_layer_fanout"`) for saved escapes:

```tsx
<autoroutingphase autorouter="fanout" pcbTracePaths={savedEscapes} />
```

A free route end becomes the starting point for the normal follow-up routing
stage, on the last wire's layer or the last via's `to_layer`. Complete connections
are removed from the follow-up input. A phase may contain both complete paths and
escapes. Unlike `<fanout>`, the phase does not create a physical breakout group or
`pcb_breakout_point` records. Saved copper remains fixed through later stages.

Coordinates are points local to the phase's enclosing PCB group: millimeters,
+X right, +Y up, +Z above, right-handed. The group transform and source port's
layout translation place them in board space. Layer names always identify
physical board layers. The route must start at the selected port's local position;
core rejects invalid anchors rather than snapping them to a pad. A complete
route's destination must still match after placement.

Wire/via layer transitions must be continuous, and every layer must exist on the
board. Vias at pad endpoints require `allowViaInPad: true` in the autorouter
configuration. Core adds coincident wire contacts around vias for connectivity
checks while retaining the saved coordinates, widths, and via dimensions.

Omitting `pcbTracePaths` preserves automatic routing. An empty array is valid for
an empty phase; a populated phase reports missing saved connections. Duplicate
paths for a port and selectors outside the phase's connections are errors.
