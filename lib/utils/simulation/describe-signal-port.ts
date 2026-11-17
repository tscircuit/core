import type { SourcePort } from "circuit-json"
import type { PcbTransientChannelSimulation } from "lib/components/primitive-components/PcbTransientChannelSimulation"

function getSignalPortComponent(
  block: PcbTransientChannelSimulation,
  port: SourcePort,
) {
  if (!port.source_component_id) return undefined
  return block.root!.db.source_component.get(port.source_component_id)
}

export function describeSignalPort(
  block: PcbTransientChannelSimulation,
  port: SourcePort,
) {
  const component = getSignalPortComponent(block, port)
  return `.${component?.name ?? "unnamed component"} > .${port.most_frequently_referenced_by_name ?? port.name}`
}
