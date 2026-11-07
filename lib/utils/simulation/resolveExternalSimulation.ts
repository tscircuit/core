import type { PrimitiveComponent } from "lib/components/base-components/PrimitiveComponent"
import type { AnalogTransientSimulation } from "lib/components/primitive-components/AnalogTransientSimulation"
import type { Port } from "lib/components/primitive-components/Port"
import type { ZodType } from "zod"

type SimulationDeclaration = Pick<
    PrimitiveComponent<ZodType>,
    "getSubcircuit" | "renderError"
  >

export function resolveExternalSimulationPort({
    declaration,
    selector,
}: { declaration: SimulationDeclaration; selector: string }): Port {
    const rootSubcircuit = declaration.getSubcircuit()
    const subcircuitsToSearch = [
          rootSubcircuit,
          ...rootSubcircuit
            .getDescendants()
            .filter((descendant) => descendant.isSubcircuit),
        ]
    const matchedPorts = new Set<Port>()
    for (const subcircuit of subcircuitsToSearch) {
          for (const port of subcircuit
                     .selectAll<Port>(selector)
                     .filter((p) => p.componentName === "Port")) {
                  matchedPorts.add(port)
          }
    }
    const ports = [...matchedPorts]
    if (ports.length !== 1 || !ports[0].source_port_id) {
          throw new Error(
                  `Simulation pin selector "${selector}" must identify exactly one physical source pin.`,
                )
    }
    return ports[0]
}

export function resolveExternalTransientSimulation({
    declaration,
    selector,
}: {
    declaration: SimulationDeclaration
    selector: string
}): AnalogTransientSimulation {
    const simulations = declaration
      .getSubcircuit()
      .selectAll<AnalogTransientSimulation>(selector)
      .filter(
              (simulation) => simulation.componentName === "AnalogTransientSimulation",
            )
    if (simulations.length !== 1) {
          throw new Error(
                  `Simulation selector "${selector}" must identify one transient in this subcircuit.`,
                )
    }
    const simulation = simulations[0]
    if (simulation.getSpiceEngineName() !== "pcb_spice") {
          throw new Error(
                  `Simulation "${selector}" requires spiceEngine="pcb_spice" for IBIS declarations.`,
                )
    }
    simulation.getOrCreateSimulationExperiment()
    return simulation
}
