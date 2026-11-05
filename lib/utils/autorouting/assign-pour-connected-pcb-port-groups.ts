import {
  copperPolygonsTouch,
  getPlatedHolePolygon,
  getPourPolygon,
  getSmtPadPolygon,
  getViaPolygon,
} from "@tscircuit/circuit-json-util"
import {
  CopperPourPipelineSolver,
  initializeManifoldGeometry,
} from "@tscircuit/copper-pour-solver"
import type {
  AnyCircuitElement,
  PcbCopperPour,
  PcbPlatedHole,
  PcbPort,
  PcbSmtPad,
  PcbVia,
} from "circuit-json"
import {
  collectResolvedCopperPours,
  createCopperPourInputProblem,
} from "lib/components/primitive-components/CopperPour/create-copper-pour-input-problem"
import type { ISubcircuit } from "lib/components/primitive-components/Group/Subcircuit/ISubcircuit"
import type { SimpleRouteJson } from "./SimpleRouteJson"

type PcbPortId = PcbPort["pcb_port_id"]
type CopperTerminal = PcbSmtPad | PcbPlatedHole | PcbVia

/**
 * Pads that touch one filled pour island are already connected. Mark them on
 * the net's automatic connection so the autorouter does not draw a spanning
 * trace through that copper.
 *
 * Polygons are board-world points in mm (+X right, +Y up). A pad on another
 * layer, or on the other side of a keepout, does not touch the island and
 * stays in the routing request.
 *
 * `externallyConnectedPointIds` is deprecated on the routing connection. The
 * autorouter still uses it to skip edges whose endpoints are already joined,
 * which leaves the escape to an outside pad in place.
 *
 * Returns the pad ids that were marked. A later signal can cut the island;
 * the caller uses these ids to notice that and route once more.
 */
export async function assignPourConnectedPcbPortGroups({
  simpleRouteJson,
  subcircuit,
  circuitJson,
}: {
  simpleRouteJson: SimpleRouteJson
  subcircuit: ISubcircuit
  circuitJson: AnyCircuitElement[]
}): Promise<PcbPortId[]> {
  const resolvedCopperPours = collectResolvedCopperPours(subcircuit)
  if (resolvedCopperPours.length === 0) return []

  const circuitJsonForPour = circuitJson.filter(
    (element) =>
      element.type !== "pcb_trace" || element.source_trace_id != null,
  )
  const inputProblem = createCopperPourInputProblem(
    subcircuit,
    circuitJsonForPour,
    resolvedCopperPours,
  )
  if (inputProblem.regionsForPour.length === 0) return []

  await initializeManifoldGeometry()
  const { brep_shapes_by_region } = new CopperPourPipelineSolver(
    inputProblem,
  ).getOutput()

  const terminalById = indexCopperTerminals(circuitJsonForPour)
  const groups = pourConnectedPcbPortGroups({
    inputProblem,
    brepShapesByRegion: brep_shapes_by_region,
    terminalById,
  })
  if (groups.length === 0) return []

  const assignedPcbPortIds = new Set<PcbPortId>()
  for (const connection of simpleRouteJson.connections) {
    if (connection.source_trace_id) continue
    const connectionPointIds = new Set<PcbPortId>()
    for (const point of connection.pointsToConnect) {
      if (point.pointId) connectionPointIds.add(point.pointId)
    }
    for (const group of groups) {
      const connectedPointIds = group.filter((pcbPortId) =>
        connectionPointIds.has(pcbPortId),
      )
      if (connectedPointIds.length < 2) continue
      connection.externallyConnectedPointIds ??= []
      connection.externallyConnectedPointIds.push(connectedPointIds)
      for (const pcbPortId of connectedPointIds) {
        assignedPcbPortIds.add(pcbPortId)
      }
    }
  }
  return [...assignedPcbPortIds]
}

function indexCopperTerminals(
  circuitJson: AnyCircuitElement[],
): Map<string, CopperTerminal> {
  const terminalById = new Map<string, CopperTerminal>()
  for (const element of circuitJson) {
    if (element.type === "pcb_smtpad") {
      terminalById.set(element.pcb_smtpad_id, element)
    } else if (element.type === "pcb_plated_hole") {
      terminalById.set(element.pcb_plated_hole_id, element)
    } else if (element.type === "pcb_via") {
      terminalById.set(element.pcb_via_id, element)
    }
  }
  return terminalById
}

function pourConnectedPcbPortGroups({
  inputProblem,
  brepShapesByRegion,
  terminalById,
}: {
  inputProblem: ReturnType<typeof createCopperPourInputProblem>
  brepShapesByRegion: ReturnType<
    CopperPourPipelineSolver["getOutput"]
  >["brep_shapes_by_region"]
  terminalById: Map<string, CopperTerminal>
}): PcbPortId[][] {
  const groups: PcbPortId[][] = []
  for (const [regionIndex, region] of inputProblem.regionsForPour.entries()) {
    for (const brepShape of brepShapesByRegion[regionIndex] ?? []) {
      if (!brepShape.outer_ring) continue
      // getPourPolygon reads the brep only. This object is not stored.
      const pourPolygon = getPourPolygon({
        type: "pcb_copper_pour",
        pcb_copper_pour_id: "pcb_copper_pour_preroute",
        shape: "brep",
        layer: region.layer,
        brep_shape: {
          ...brepShape,
          inner_rings: brepShape.inner_rings ?? [],
        },
        source_net_id: "source_net_preroute",
      } as PcbCopperPour)
      const islandPortIds: PcbPortId[] = []
      for (const pad of inputProblem.pads) {
        if (
          pad.layer !== region.layer ||
          pad.connectivityKey !== region.connectivityKey
        ) {
          continue
        }
        const terminal = terminalById.get(pad.padId)
        if (!terminal) continue
        if (!copperPolygonsTouch(terminalPolygon(terminal), pourPolygon)) {
          continue
        }
        for (const pcbPortId of terminalPcbPortIds(terminal)) {
          islandPortIds.push(pcbPortId)
        }
      }
      const uniquePortIds = [...new Set(islandPortIds)]
      if (uniquePortIds.length >= 2) groups.push(uniquePortIds)
    }
  }
  return groups
}

function terminalPolygon(terminal: CopperTerminal) {
  if (terminal.type === "pcb_smtpad") return getSmtPadPolygon(terminal)
  if (terminal.type === "pcb_plated_hole") return getPlatedHolePolygon(terminal)
  return getViaPolygon(
    { x: terminal.x, y: terminal.y },
    terminal.outer_diameter,
    terminal.hole_diameter,
  )
}

function terminalPcbPortIds(terminal: CopperTerminal): PcbPortId[] {
  if (terminal.type === "pcb_via") return terminal.pcb_port_ids ?? []
  return terminal.pcb_port_id ? [terminal.pcb_port_id] : []
}
