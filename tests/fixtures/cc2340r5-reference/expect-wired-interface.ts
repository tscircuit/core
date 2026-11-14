import { expect } from "bun:test"
import type { RootCircuit } from "lib/RootCircuit"
import { modulePorts } from "./index"

/** Check emitted wire geometry, not just the electrical connectivity graph. */
export function expectWiredInterface(circuit: RootCircuit) {
  const { db } = circuit
  const mcu = db.source_component
    .list()
    .find((component) => component.name === "U1")!
  const pointKey = (point: { x: number; y: number }) =>
    `${point.x.toFixed(5)},${point.y.toFixed(5)}`
  for (const declaration of modulePorts) {
    const boundary = db.schematic_port
      .list()
      .find(
        (port) =>
          port.boundary_position && port.display_pin_label === declaration.name,
      )!
    const source = db.source_port.get(boundary.source_port_id)!
    const physicalPin = db.source_port
      .list()
      .find(
        (port) =>
          port.source_component_id === mcu.source_component_id &&
          port.pin_number === declaration.pin,
      )!
    const internal = db.schematic_port
      .list()
      .find((port) => port.source_port_id === physicalPin.source_port_id)!
    const traces = db.schematic_trace
      .list()
      .filter(
        (trace) =>
          trace.subcircuit_connectivity_map_key ===
          source.subcircuit_connectivity_map_key,
      )
    // Flood only along actual same-net wire edges. Labels never add graph edges.
    const reached = new Set([pointKey(boundary.center)])
    const edges = traces.flatMap((trace) => trace.edges)
    let changed = true
    while (changed) {
      changed = false
      for (const edge of edges) {
        const a = pointKey(edge.from),
          b = pointKey(edge.to)
        if (reached.has(a) && !reached.has(b)) {
          reached.add(b)
          changed = true
        }
        if (reached.has(b) && !reached.has(a)) {
          reached.add(a)
          changed = true
        }
      }
    }
    expect(
      reached.has(pointKey(internal.center)),
      `${declaration.name} must have a visible wire to U1 pin ${declaration.pin}`,
    ).toBe(true)
    const boundaryTraces = traces.filter((trace) =>
      trace.edges.some(
        (edge) =>
          pointKey(edge.from) === pointKey(boundary.center) ||
          pointKey(edge.to) === pointKey(boundary.center),
      ),
    )
    expect(boundaryTraces.length).toBeGreaterThan(0)
    for (const trace of boundaryTraces) {
      expect(
        db.source_trace.get(trace.source_trace_id!)?.connected_source_port_ids,
      ).toContain(boundary.source_port_id)
    }
  }
}
