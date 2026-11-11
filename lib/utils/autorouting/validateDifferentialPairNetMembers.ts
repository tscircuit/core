import type { SourcePort } from "circuit-json"
import type { DifferentialPair } from "lib/components/primitive-components/DifferentialPair"
import type { DifferentialPairMember } from "./resolveDifferentialPairMember"

const getMemberTerminalPorts = (
  differentialPair: DifferentialPair,
  member: DifferentialPairMember,
): SourcePort[] => {
  const sourcePorts = differentialPair.root!.db.source_port.list()
  if (member.kind === "trace") {
    if (member.sourceTrace.connected_source_port_ids.length === 2) {
      return sourcePorts.filter((port) =>
        member.sourceTrace.connected_source_port_ids.includes(
          port.source_port_id,
        ),
      )
    }
    return sourcePorts.filter(
      (port) =>
        port.subcircuit_connectivity_map_key ===
        member.sourceTrace.subcircuit_connectivity_map_key,
    )
  }
  return sourcePorts.filter(
    (port) =>
      port.subcircuit_connectivity_map_key ===
      member.sourceNet.subcircuit_connectivity_map_key,
  )
}

/** Net-selected pairs require corresponding terminals on the same components.
 * Explicit trace sections remain available for paths with asymmetric taps.
 * Matching terminal components is necessary; the autorouter validates segment topology.
 */
export const validateDifferentialPairNetMembers = (
  differentialPair: DifferentialPair,
  positiveMember: DifferentialPairMember,
  negativeMember: DifferentialPairMember,
): void => {
  if (positiveMember.kind !== "net" && negativeMember.kind !== "net") return
  const positiveConnectivityKey =
    positiveMember.kind === "net"
      ? positiveMember.sourceNet.subcircuit_connectivity_map_key
      : positiveMember.sourceTrace.subcircuit_connectivity_map_key
  const negativeConnectivityKey =
    negativeMember.kind === "net"
      ? negativeMember.sourceNet.subcircuit_connectivity_map_key
      : negativeMember.sourceTrace.subcircuit_connectivity_map_key
  if (positiveConnectivityKey === negativeConnectivityKey) {
    throw new Error(
      `Differential pair "${differentialPair.name}" positiveConnection="${differentialPair._parsedProps.positiveConnection}" and negativeConnection="${differentialPair._parsedProps.negativeConnection}" must resolve to different electrical nets`,
    )
  }
  const positivePorts = getMemberTerminalPorts(differentialPair, positiveMember)
  const negativePorts = getMemberTerminalPorts(differentialPair, negativeMember)
  for (const port of [...positivePorts, ...negativePorts]) {
    if (!port.source_component_id) {
      throw new Error(
        `Differential pair "${differentialPair.name}" terminal "${port.name}" has no owning component`,
      )
    }
  }
  const positiveComponentIds = positivePorts
    .map((port) => port.source_component_id)
    .sort()
  const negativeComponentIds = negativePorts
    .map((port) => port.source_component_id)
    .sort()
  const matchingComponents =
    positiveComponentIds.length === negativeComponentIds.length &&
    positiveComponentIds.every(
      (componentId, index) => componentId === negativeComponentIds[index],
    )
  if (matchingComponents) return

  const { db } = differentialPair.root!
  const describeTerminals = (ports: SourcePort[]) =>
    ports
      .map((port) => {
        const sourceComponent = port.source_component_id
          ? db.source_component.get(port.source_component_id)
          : undefined
        return `${sourceComponent?.name ?? "unnamed component"}.${port.name}`
      })
      .sort()
      .join(", ")
  throw new Error(
    `Differential pair "${differentialPair.name}" net selections must connect to matching terminal components (positive: ${describeTerminals(positivePorts)}; negative: ${describeTerminals(negativePorts)}). Use named trace sections for asymmetric taps.`,
  )
}
