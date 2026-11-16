import { runAllPlacementChecks, runAllRoutingChecks } from "@tscircuit/checks"
import type { ManualEditEvent } from "@tscircuit/props"
import type {
  CircuitJson,
  PcbPort,
  PcbSmtPad,
  PcbTrace,
  PcbTraceRoutePointWire,
  Point,
} from "circuit-json"
import { getTraceLength } from "lib/components/primitive-components/Trace/trace-utils/compute-trace-length"
import { applyEditEvents } from "./apply-edit-events-to-circuit-json"

const COORDINATE_TOLERANCE_MM = 1e-6

type PcbPortId = PcbPort["pcb_port_id"]
type PcbSmtPadId = PcbSmtPad["pcb_smtpad_id"]

type MovedTerminal = {
  trace: PcbTrace
  endpoint: PcbTraceRoutePointWire
  neighbor: PcbTraceRoutePointWire
  atStart: boolean
}

function getMovedTerminals(
  circuitJson: CircuitJson,
  movedPortIds: Set<PcbPortId>,
  movedPadIds: Set<PcbSmtPadId>,
) {
  const terminals: MovedTerminal[] = []
  for (const trace of circuitJson) {
    if (trace.type !== "pcb_trace") continue
    let foundTerminal = false
    for (const [index, point] of trace.route.entries()) {
      if (
        point.route_type === "through_pad" &&
        point.pcb_smtpad_id !== undefined &&
        movedPadIds.has(point.pcb_smtpad_id)
      )
        return null
      if (point.route_type !== "wire") continue
      const movesStart =
        point.start_pcb_port_id !== undefined &&
        movedPortIds.has(point.start_pcb_port_id)
      const movesEnd =
        point.end_pcb_port_id !== undefined &&
        movedPortIds.has(point.end_pcb_port_id)
      if (!movesStart && !movesEnd) continue
      if (
        foundTerminal ||
        trace.is_antenna_trace ||
        (movesStart && index !== 0) ||
        (movesEnd && index !== trace.route.length - 1)
      )
        return null

      let neighbor = trace.route[index - 1]
      if (movesStart) neighbor = trace.route[index + 1]
      if (
        neighbor?.route_type !== "wire" ||
        neighbor.layer !== point.layer ||
        neighbor.width !== point.width ||
        point.width_interpolation_mode ||
        neighbor.width_interpolation_mode
      )
        return null

      terminals.push({ trace, endpoint: point, neighbor, atStart: movesStart })
      foundTerminal = true
    }
  }
  return terminals
}

function repairTerminal({
  terminal,
  displacement,
  diagonalFirst,
}: {
  terminal: MovedTerminal
  displacement: Point
  diagonalFirst: boolean
}): PcbTrace {
  const { trace, endpoint, neighbor, atStart } = terminal
  const moved = {
    ...endpoint,
    x: endpoint.x + displacement.x,
    y: endpoint.y + displacement.y,
  }
  const dx = moved.x - neighbor.x
  const dy = moved.y - neighbor.y
  const diagonalLength = Math.min(Math.abs(dx), Math.abs(dy))
  let replacement = [moved]
  if (
    diagonalLength > COORDINATE_TOLERANCE_MM &&
    Math.abs(Math.abs(dx) - Math.abs(dy)) > COORDINATE_TOLERANCE_MM
  ) {
    const diagonalX = Math.sign(dx) * diagonalLength
    const diagonalY = Math.sign(dy) * diagonalLength
    const bend: PcbTraceRoutePointWire = {
      route_type: "wire",
      layer: endpoint.layer,
      width: endpoint.width,
      x: moved.x - diagonalX,
      y: moved.y - diagonalY,
    }
    if (diagonalFirst) {
      bend.x = neighbor.x + diagonalX
      bend.y = neighbor.y + diagonalY
    }
    replacement = [bend, moved]
    if (atStart) replacement.reverse()
  }

  let route = [...trace.route.slice(0, -1), ...replacement]
  if (atStart) route = [...replacement, ...trace.route.slice(1)]
  return { ...trace, route, trace_length: getTraceLength(route) }
}

/** Apply a surface-mount placement edit and repair the connected trace ends.
 * Returns null when the move requires a full PCB rebuild or fails board checks.
 */
export async function applyPcbMoveWithRouting({
  circuitJson,
  editEvent,
}: {
  circuitJson: CircuitJson
  editEvent: Extract<
    ManualEditEvent,
    { edit_event_type: "edit_pcb_component_location" }
  >
}): Promise<CircuitJson | null> {
  const componentId = editEvent.pcb_component_id
  const component = circuitJson.find(
    (element) =>
      element.type === "pcb_component" &&
      element.pcb_component_id === componentId,
  )
  if (
    component?.type !== "pcb_component" ||
    circuitJson.filter((element) => element.type === "pcb_board").length !== 1
  )
    return null
  const { new_center: center, original_center: originalCenter } = editEvent
  if (
    !Number.isFinite(center.x) ||
    !Number.isFinite(center.y) ||
    (originalCenter &&
      (originalCenter.x !== component.center.x ||
        originalCenter.y !== component.center.y))
  )
    return null

  // Moving a pad through a poured layer requires regenerating the pour.
  const unsupportedGeometry = circuitJson.some(
    (element) =>
      (element.type === "pcb_copper_pour" &&
        element.layer === component.layer) ||
      ((element.type === "pcb_via" ||
        element.type === "pcb_plated_hole" ||
        element.type === "pcb_hole" ||
        element.type === "pcb_cutout" ||
        element.type === "pcb_trace") &&
        "pcb_component_id" in element &&
        element.pcb_component_id === componentId),
  )
  if (unsupportedGeometry) return null

  const movedPortIds = new Set<PcbPortId>()
  const movedPadIds = new Set<PcbSmtPadId>()
  for (const element of circuitJson) {
    if (element.type === "pcb_port" && element.pcb_component_id === componentId)
      movedPortIds.add(element.pcb_port_id)
    if (
      element.type === "pcb_smtpad" &&
      element.pcb_component_id === componentId
    )
      movedPadIds.add(element.pcb_smtpad_id)
  }
  const terminals = getMovedTerminals(circuitJson, movedPortIds, movedPadIds)
  if (!terminals?.length) return null

  const placed = applyEditEvents({
    circuitJson,
    editEvents: [{ ...editEvent, original_center: component.center }],
  })
  const displacement = {
    x: center.x - component.center.x,
    y: center.y - component.center.y,
  }
  for (const diagonalFirst of [false, true]) {
    const repairs = new Map(
      terminals.map((terminal) => [
        terminal.trace.pcb_trace_id,
        repairTerminal({ terminal, displacement, diagonalFirst }),
      ]),
    )
    const candidate = placed.map((element) => {
      if (element.type === "pcb_trace")
        return repairs.get(element.pcb_trace_id) ?? element
      return element
    })
    const checked = structuredClone(candidate)
    if ((await runAllPlacementChecks(checked)).length > 0) continue
    if ((await runAllRoutingChecks(checked)).length === 0) return candidate
  }
  return null
}
