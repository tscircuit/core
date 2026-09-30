# Local dogbone fanout

Use the `dogbone` preset on a `<fanout>` to escape connected SMT pads to nearby
vias without routing to the fanout boundary:

```tsx
<board
  layers={4}
  minTraceWidth={0.1}
  minViaPadDiameter={0.3}
  minViaHoleDiameter={0.15}
>
  <fanout autorouter="dogbone" fanoutRoutingLayers={["inner1"]}>
    <AM3352 />
  </fanout>
</board>
```

Core runs the registered `DogboneFanoutSolver` (`BaseSolver`), which uses the
public pad-site matcher from `@tscircuit/fanout-solver`. It chooses
local interstitial sites on a two-dimensional pad grid and emits straight or
45-degree escapes. Pad geometry is taken after component placement, including
rotation and bottom-side reflection. Grid coordinates are merged at micrometer
precision to avoid floating-point rotation noise.

The phase includes connected pads whose nets have no external endpoint, such as
power and ground connections declared by the component. Unconnected pads are
not automatically connected. Supply nets keep their individual identities.

`fanoutRoutingLayers` restricts the handoff layers. Core selects the first listed
layer distinct from the source pad's layer; without the property, it uses board
stack order. Vias are through vias spanning the physical board stack. Board
trace, pad, via and drill clearance rules constrain site assignment. If no
complete legal assignment is found, rendering throws before publishing local
handoffs. This preset currently requires a two-dimensional SMT pad grid; it is
not a general perimeter escape router or a plane-connection solver.

The handoffs are available to subsequent routing phases at the actual via
locations. Set `routeRemaining={false}` on the board to inspect only the local
escapes. `pcbTracePaths`, when supplied, retains precedence over the preset.
The preset is implemented for `<fanout>`; using it as a standalone board or
`<autoroutingphase>` router is rejected.

See `tests/breakout/fanout-am3352-dogbones.test.tsx` and its labeled PCB snapshot
for all 324 AM3352 pads, including the power and ground pads. The fixture contains
only package geometry and connections; it does not call a solver or supply saved
routing paths.

## Solver debugging

Core emits `solver:started` with JSON-serializable `solverConstructorArgs`,
`autorouting:progress` with the current phase and debug graphics, and
`solver:ended` with solved/failed status, iterations and the error message.
`SOLVERS.DogboneFanoutSolver` reconstructs the solver from those arguments without
a live circuit. It supports `step()`, `solve()`, `getOutput()`,
`getConstructorParams()` and `visualize()` through the standard solver interface.
Steps advance a component site assignment or an individual escape trace;
the underlying pad-site matcher's bounded search is atomic within an assignment
step. Debug graphics show obstacles, assigned vias and pad-to-via segments,
including the last state when assignment fails. Core publishes handoffs only
after the solver succeeds.
