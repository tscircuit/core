import type {
  AnyCircuitElement,
  PcbComponent,
  PcbPort,
  PcbPortNotMatchedError,
  SourcePort,
} from "circuit-json"

type SourceComponent = Extract<AnyCircuitElement, { type: "source_component" }>
type SourceComponentId = SourceComponent["source_component_id"]
type SourcePortId = SourcePort["source_port_id"]

export const getPcbPortNotMatchedErrors = (
  circuitJson: AnyCircuitElement[],
): PcbPortNotMatchedError[] => {
  const connectedSourcePortIds = new Set<SourcePortId>()
  const internalConnectionGroups: SourcePortId[][] = []
  const sourceComponentsById = new Map<SourceComponentId, SourceComponent>()
  const pcbComponentsBySourceComponentId = new Map<
    SourceComponentId,
    PcbComponent[]
  >()
  const pcbPorts: PcbPort[] = []
  const sourceComponentIdsWithFootprintErrors = new Set<SourceComponentId>()

  for (const element of circuitJson) {
    if (element.type === "source_trace") {
      for (const sourcePortId of element.connected_source_port_ids ?? []) {
        connectedSourcePortIds.add(sourcePortId)
      }
    } else if (element.type === "source_component_internal_connection") {
      internalConnectionGroups.push(element.source_port_ids)
    } else if (element.type === "source_component") {
      sourceComponentsById.set(element.source_component_id, element)
      internalConnectionGroups.push(
        ...(element.internally_connected_source_port_ids ?? []),
      )
    } else if (element.type === "pcb_component") {
      if (!element.source_component_id) continue
      const pcbComponents =
        pcbComponentsBySourceComponentId.get(element.source_component_id) ?? []
      pcbComponents.push(element)
      pcbComponentsBySourceComponentId.set(
        element.source_component_id,
        pcbComponents,
      )
    } else if (element.type === "pcb_port") {
      pcbPorts.push(element)
    } else if (
      element.type === "pcb_missing_footprint_error" ||
      element.type === "external_footprint_load_error" ||
      element.type === "circuit_json_footprint_load_error"
    ) {
      sourceComponentIdsWithFootprintErrors.add(element.source_component_id)
    }
  }

  let foundNewConnectedPort = true
  while (foundNewConnectedPort) {
    foundNewConnectedPort = false
    for (const group of internalConnectionGroups) {
      if (
        !group.some((sourcePortId) => connectedSourcePortIds.has(sourcePortId))
      ) {
        continue
      }
      for (const sourcePortId of group) {
        if (connectedSourcePortIds.has(sourcePortId)) continue
        connectedSourcePortIds.add(sourcePortId)
        foundNewConnectedPort = true
      }
    }
  }

  const errors: PcbPortNotMatchedError[] = []
  for (const element of circuitJson) {
    if (
      element.type !== "source_port" ||
      !connectedSourcePortIds.has(element.source_port_id) ||
      !element.source_component_id ||
      sourceComponentIdsWithFootprintErrors.has(element.source_component_id)
    ) {
      continue
    }

    const pcbComponents = pcbComponentsBySourceComponentId.get(
      element.source_component_id,
    )
    if (!pcbComponents?.length) continue

    const ownerPcbComponentIds = new Set(
      pcbComponents.map((component) => component.pcb_component_id),
    )
    const hasMatchingPcbPort = pcbPorts.some(
      (pcbPort) =>
        pcbPort.source_port_id === element.source_port_id &&
        pcbPort.pcb_component_id !== undefined &&
        ownerPcbComponentIds.has(pcbPort.pcb_component_id),
    )
    if (hasMatchingPcbPort) continue

    const sourceComponent = sourceComponentsById.get(
      element.source_component_id,
    )
    errors.push({
      type: "pcb_port_not_matched_error",
      pcb_error_id: `pcb_port_not_matched_${element.source_port_id}`,
      error_type: "pcb_port_not_matched_error",
      message: `Source port ${sourceComponent?.name ?? "unnamed component"}.${element.name} is connected but does not have a matching PCB port.`,
      pcb_component_ids: pcbComponents.map(
        (component) => component.pcb_component_id,
      ),
      subcircuit_id:
        element.subcircuit_id ?? pcbComponents[0]?.subcircuit_id ?? undefined,
    })
  }

  return errors
}
