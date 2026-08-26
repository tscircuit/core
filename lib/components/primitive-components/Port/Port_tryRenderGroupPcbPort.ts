import type { Port } from "./Port"
import { areAllPcbPrimitivesOverlapping } from "./areAllPcbPrimitivesOverlapping"
import { getCenterOfPcbPrimitives } from "./getCenterOfPcbPrimitives"

export function Port_tryRenderGroupPcbPort(port: Port): boolean {
  if (port.root?.pcbDisabled) return false
  if (port.pcb_port_id) return true

  const { db } = port.root!
  const matchedPcbPrimitives = port.matchedComponents.filter(
    (component) => component.isPcbPrimitive,
  )
  const matchedPrimitiveCenter =
    matchedPcbPrimitives.length === 1
      ? matchedPcbPrimitives[0]._getPcbCircuitJsonBounds().center
      : matchedPcbPrimitives.length > 1 &&
          areAllPcbPrimitivesOverlapping(matchedPcbPrimitives)
        ? getCenterOfPcbPrimitives(matchedPcbPrimitives)
        : null

  if (matchedPrimitiveCenter) {
    const pcbPort = db.pcb_port.insert({
      pcb_component_id: undefined as any,
      layers: port.getAvailablePcbLayers(),
      subcircuit_id: port.getSubcircuit()?.subcircuit_id ?? undefined,
      pcb_group_id: port.getGroup()?.pcb_group_id ?? undefined,
      ...matchedPrimitiveCenter,
      source_port_id: port.source_port_id!,
      is_board_pinout: port.parent?.componentName === "Board",
    })
    port.pcb_port_id = pcbPort.pcb_port_id
    return true
  }

  const connectedPort = port._getConnectedPortsFromConnectsTo()[0]
  if (!connectedPort?.pcb_port_id) return false

  const connectedPcbPort = db.pcb_port.get(connectedPort.pcb_port_id)
  if (!connectedPcbPort) return false

  const subcircuit = port.getSubcircuit()
  const pcbPort = db.pcb_port.insert({
    pcb_component_id: undefined as any,
    layers: connectedPort.getAvailablePcbLayers(),
    subcircuit_id: subcircuit?.subcircuit_id ?? undefined,
    pcb_group_id: port.getGroup()?.pcb_group_id ?? undefined,
    x: connectedPcbPort.x,
    y: connectedPcbPort.y,
    source_port_id: port.source_port_id!,
    is_board_pinout: false,
  })
  port.pcb_port_id = pcbPort.pcb_port_id
  return true
}
