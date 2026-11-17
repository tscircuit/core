import type { AnyCircuitElement } from "circuit-json"
import { convertCircuitJsonToPcbSvg } from "circuit-to-svg"
import type {
  SimpleRouteConnection,
  SimpleRouteJson,
} from "lib/utils/autorouting/SimpleRouteJson"

/** Board-world points in mm, +X right and +Y up; dashed notes are requests. */
const getRequestNotes = ({
  connections,
  color,
  phaseName,
}: {
  connections: readonly SimpleRouteConnection[]
  color: string
  phaseName: string
}): AnyCircuitElement[] =>
  connections.flatMap((connection) => {
    const first = connection.pointsToConnect[0]!
    return connection.pointsToConnect.slice(1).map(
      (point, terminalIndex): AnyCircuitElement => ({
        type: "pcb_note_line",
        pcb_note_line_id: `${phaseName}_${connection.name}_${terminalIndex}`,
        layer: "top",
        x1: first.x,
        y1: first.y,
        x2: point.x,
        y2: point.y,
        stroke_width: 0.035,
        color,
        is_dashed: true,
      }),
    )
  })

/** Notes use the board and pad positions Core emitted, without a new transform. */
export const getNativeGeometryNotes = (
  circuitJson: AnyCircuitElement[],
): AnyCircuitElement[] => {
  const board = circuitJson.find((element) => element.type === "pcb_board")
  if (!board || board.width === undefined || board.height === undefined) {
    throw new Error(
      "Native H3 board dimensions are missing from the emitted circuit",
    )
  }
  const corners = [
    {
      x: board.center.x - board.width / 2,
      y: board.center.y - board.height / 2,
    },
    {
      x: board.center.x + board.width / 2,
      y: board.center.y - board.height / 2,
    },
    {
      x: board.center.x + board.width / 2,
      y: board.center.y + board.height / 2,
    },
    {
      x: board.center.x - board.width / 2,
      y: board.center.y + board.height / 2,
    },
  ]
  const notes: AnyCircuitElement[] = corners.map((corner, cornerIndex) => ({
    type: "pcb_note_line",
    pcb_note_line_id: `native_board_boundary_${cornerIndex}`,
    layer: "top",
    x1: corner.x,
    y1: corner.y,
    x2: corners[(cornerIndex + 1) % corners.length]!.x,
    y2: corners[(cornerIndex + 1) % corners.length]!.y,
    stroke_width: 0.035,
    color: "#cbd5e1",
  }))
  for (const [designator, label] of [
    ["U1", "U1: Allwinner H3 CPU"],
    ["DU1", "DU1: DDR3 RAM"],
  ]) {
    const sourceComponent = circuitJson
      .filter((element) => element.type === "source_component")
      .find((component) => component.name === designator)
    const pcbComponent = circuitJson
      .filter((element) => element.type === "pcb_component")
      .find(
        (component) =>
          component.source_component_id ===
          sourceComponent?.source_component_id,
      )
    if (!pcbComponent)
      throw new Error(`Native ${label} is missing from the emitted circuit`)
    const pads = circuitJson
      .filter((element) => element.type === "pcb_smtpad")
      .filter((pad) => pad.pcb_component_id === pcbComponent.pcb_component_id)
    notes.push({
      type: "pcb_note_text",
      pcb_note_text_id: `native_${designator}_label`,
      pcb_group_id: "routing_status",
      text: label!,
      anchor_position: {
        x: pcbComponent.center.x,
        y:
          Math.max(
            ...pads.flatMap((pad) =>
              pad.shape === "polygon"
                ? pad.points.map((point) => point.y)
                : [pad.y],
            ),
          ) + 0.7,
      },
      font: "tscircuit2024",
      layer: "top",
      font_size: 0.45,
      anchor_alignment: "center",
    })
  }
  return notes
}

/** Render every native component/pad emitted by the actual Core circuit. */
export function getH3RoutingPhaseIntentSnapshot({
  circuitJson,
  phaseSimpleRouteJson,
  pendingConnections,
}: {
  circuitJson: AnyCircuitElement[]
  phaseSimpleRouteJson: SimpleRouteJson
  pendingConnections: readonly SimpleRouteConnection[]
}): string {
  const circuit: AnyCircuitElement[] = [
    ...circuitJson,
    ...getNativeGeometryNotes(circuitJson),
    ...getRequestNotes({
      connections: phaseSimpleRouteJson.connections,
      color: "#b23a24",
      phaseName: "active",
    }),
    ...getRequestNotes({
      connections: pendingConnections,
      color: "#087c91",
      phaseName: "pending",
    }),
    {
      type: "pcb_note_text",
      pcb_note_text_id: "h3_phase_intent_title",
      pcb_group_id: "routing_status",
      text: `Native H3 DDR subsystem: 445 pads, 53 declared signals, ${phaseSimpleRouteJson.connections.length} active requests (red)`,
      anchor_position: { x: 0, y: 11.1 },
      font: "tscircuit2024",
      layer: "top",
      font_size: 0.4,
      anchor_alignment: "center",
    },
    {
      type: "pcb_note_text",
      pcb_note_text_id: "h3_phase_intent_result",
      pcb_group_id: "routing_status",
      text: `Future intent exported: ${pendingConnections.length}/45 signals. Dashed red/teal lines are requests; capture stopped before copper routing.`,
      anchor_position: { x: 0, y: 10.1 },
      font: "tscircuit2024",
      layer: "top",
      font_size: 0.4,
      anchor_alignment: "center",
    },
  ]
  return convertCircuitJsonToPcbSvg(circuit, {
    backgroundColor: "white",
    width: 1500,
    height: 1000,
    shouldDrawErrors: false,
    shouldDrawRatsNest: false,
    showErrorsInTextOverlay: false,
    showDebugObjects: false,
    showPcbGroups: false,
  })
}
