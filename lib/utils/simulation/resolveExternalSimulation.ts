import type { PrimitiveComponent } from "lib/components/base-components/PrimitiveComponent"
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
  const ports = declaration
    .getSubcircuit()
    .selectAll<Port>(selector)
    .filter((port) => port.componentName === "Port")
  if (ports.length !== 1 || !ports[0].source_port_id) {
    throw new Error(
      `Simulation pin selector "${selector}" must identify exactly one physical source pin.`,
    )
  }
  return ports[0]
}
