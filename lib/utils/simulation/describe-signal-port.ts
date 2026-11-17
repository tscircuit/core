import type { SourcePort } from "circuit-json"
import type { PcbTransientChannelSimulation } from "lib/components/primitive-components/PcbTransientChannelSimulation"

export function describeSignalPort(
  block: PcbTransientChannelSimulation,
  port: SourcePort,
) {
  const component = port.source_component_id
    ? block.root!.db.source_component.get(port.source_component_id)
    : undefined
  return `.${component?.name ?? "unnamed component"} > .${port.most_frequently_referenced_by_name ?? port.name}`
}
