# Bus-lanes connectivity routing

Use `createBusLanesAutorouterConfig` from `@tscircuit/core` to select the
bus-lanes pipeline goal on a board or an `<autoroutingphase>`:

```tsx
import { createBusLanesAutorouterConfig } from "@tscircuit/core"

<autoroutingphase
  name="DATA_CONNECTIVITY"
  connections={["U1.DATA0", "U1.DATA1"]}
  autorouter={createBusLanesAutorouterConfig({ goal: "connectivity" })}
/>
<bus
  name="DATA"
  connections={["DATA0", "DATA1"]}
  pcbAllowedLayers={["inner1"]}
/>
```

The named traces `DATA0` and `DATA1` must connect the selected top-layer pads.
Connectivity mode requires two top-layer terminals per connection, uniform
signal widths, and one shared non-top carrier. Core intersects the buses'
`pcbAllowedLayers` to select that carrier. Ambiguous or conflicting carrier
constraints fail explicitly. The solver creates local terminal approaches and
plated vias; it does not route through a different autorouter on failure.

The helper also accepts `BusLanesPipelineOptions`, including
`maxRoutingTimeMs` and `connectivity` search budgets such as `gridStep`,
`maxPasses`, `maxExpansionsPerRoute`, and `maxRefinements`. Fixed copper must
meet the upstream connectivity solver's contract: provide its owning
connections through `connectivity.fixedConnections`, and do not request an
already partially routed signal.

`autorouter="bus_lanes"` and `createBusLanesAutorouterConfig()` retain the
matched goal. Connectivity mode does not enforce bus length bounds, skew, or
differential coupling. Core still runs its ordinary geometry and placement
checks on emitted copper. A completed connectivity solve can have core check
findings and must not be described as a fully validated DDR route.

Search settings can affect physical validity. In a dense crossed-pad experiment,
a 0.3 mm grid produced vias overlapping SMT pads; core reported placement
errors. The integration regression uses a fresh native-pad circuit and checks
connectivity, copper clearance, via spacing, and absence of via-in-pad findings.
Failed searches must emit no candidate copper.

The current dependency is a preview of bus-lanes-solver commit
`e87f9980a262484c21292c12addd5e0121d2d96d`. Core's dependency policy requires a
published solver release before this preview pin can merge.
