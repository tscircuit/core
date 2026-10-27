import type { CircuitJsonUtilObjects } from "@tscircuit/circuit-json-util"
import type { RoutedTestPoint } from "@tscircuit/test-point-rerouter"
import type { SourceTrace } from "circuit-json"

type SourceTraceId = SourceTrace["source_trace_id"]
export type ConnectedRoutedTestPoint = RoutedTestPoint & {
  sourceTraceId: SourceTraceId
}

/** Emit probe targets as source testpoints, PCB ports and exposed circular pads.
 * Positions are board-world points in mm, +X right, +Y up, +Z above (right-handed).
 * Bottom-layer points retain board coordinates; fixture mirroring is a later transform.
 */
export function materializeRoutedTestPoints(
  db: CircuitJsonUtilObjects,
  points: ConnectedRoutedTestPoint[],
  subcircuitId: string,
): void {
  for (const point of points) {
    const original = db.source_trace.get(point.sourceTraceId)
    if (!original)
      throw new Error(`Test point ${point.name} has no source connection`)
    if (
      db.source_component
        .list()
        .some((c) => c.name === point.name && c.subcircuit_id === subcircuitId)
    ) {
      throw new Error(`Test point name ${point.name} already exists`)
    }
  }
  for (const point of points) {
    const original = db.source_trace.get(point.sourceTraceId)!
    const component = db.source_component.insert({
      ftype: "simple_test_point",
      name: point.name,
      footprint_variant: "pad",
      pad_shape: "circle",
      pad_diameter: point.diameter,
      subcircuit_id: subcircuitId,
    })
    const sourcePort = db.source_port.insert({
      name: "pin1",
      pin_number: 1,
      source_component_id: component.source_component_id,
      subcircuit_id: subcircuitId,
    })
    db.source_trace.insert({
      connected_source_port_ids: [
        sourcePort.source_port_id,
        ...original.connected_source_port_ids,
      ],
      connected_source_net_ids: original.connected_source_net_ids,
      subcircuit_connectivity_map_key: original.subcircuit_connectivity_map_key,
      subcircuit_id: subcircuitId,
    })
    const pcbComponent = db.pcb_component.insert({
      source_component_id: component.source_component_id,
      center: { x: point.x, y: point.y },
      width: point.diameter,
      height: point.diameter,
      rotation: 0,
      layer: point.layer,
      subcircuit_id: subcircuitId,
      do_not_place: true,
      obstructs_within_bounds: false,
    })
    const pcbPort = db.pcb_port.insert({
      source_port_id: sourcePort.source_port_id,
      pcb_component_id: pcbComponent.pcb_component_id,
      x: point.x,
      y: point.y,
      layers: [point.layer],
      subcircuit_id: subcircuitId,
    })
    db.pcb_smtpad.insert({
      shape: "circle",
      x: point.x,
      y: point.y,
      radius: point.diameter / 2,
      layer: point.layer,
      pcb_component_id: pcbComponent.pcb_component_id,
      pcb_port_id: pcbPort.pcb_port_id,
      subcircuit_id: subcircuitId,
      is_covered_with_solder_mask: false,
    })
  }
}
