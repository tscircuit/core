# Declare a PCB return-current experiment

Use `<simulation.pcbreturncurrentsimulation>` inside a board or subcircuit to describe a
pending experiment:

```tsx
import { simulation } from "@tscircuit/core"

<board width="8mm" height="6mm">
  <simulation.pcbreturncurrentsimulation name="DDR D13 return path" />
</board>
```

Core emits a `simulation_experiment` with `experiment_type: "pcb_return_current"`
and the chosen name. A name is optional; the default is `"PCB return current"`.
Multiple declarations produce separate experiments. PCB-disabled rendering
skips the declarations. Rendering does not run a solver or create results.

This first feature introduces the experiment container. The follow-up feature
adds nested `<simulation.pcbreturncurrentexcitation>` elements for selecting a routed
signal and its explicit ground return source/sink. An empty container is a
draft definition; the simulation CLI cannot run it until excitations are added.

Frequency, solver, mesh size, and sampling cell size are CLI run options. The
current Circuit JSON pending-experiment schema has no fields for them, so they
are not accepted as TSX props.

The component uses the canonical typed schema from `@tscircuit/props`.
