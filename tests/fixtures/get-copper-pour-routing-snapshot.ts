import type { SimpleRouteConnection } from "@tscircuit/capacity-autorouter"
import { su } from "@tscircuit/circuit-json-util"
import type { AnyCircuitElement, LayerRef } from "circuit-json"
import { convertCircuitJsonToPcbSvg } from "circuit-to-svg"
import { stackSvgsHorizontally, stackSvgsVertically } from "stack-svgs"

const panelWidth = 720
const connectedColor = "#5eead4"
const requestColor = "#ff59b7"

const createCaption = (
  eyebrow: string,
  title: string,
  detail: string,
  color: string,
) => `<svg xmlns="http://www.w3.org/2000/svg" width="${panelWidth}" height="120" viewBox="0 0 ${panelWidth} 120">
  <rect width="${panelWidth}" height="120" fill="#172131" />
  <text x="24" y="29" fill="#cbd5e1" font-family="Arial, sans-serif" font-size="15" font-weight="bold">${eyebrow}</text>
  <text x="24" y="66" fill="${color}" font-family="Arial, sans-serif" font-size="29" font-weight="bold">${title}</text>
  <text x="24" y="96" fill="#e2e8f0" font-family="Arial, sans-serif" font-size="17">${detail}</text>
</svg>`

const createLegend = (firstLine: string, secondLine: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${panelWidth}" height="82" viewBox="0 0 ${panelWidth} 82">
    <rect width="${panelWidth}" height="82" fill="#172131" />
    <text x="24" y="31" fill="#e2e8f0" font-family="Arial, sans-serif" font-size="17">${firstLine}</text>
    <text x="24" y="59" fill="#cbd5e1" font-family="Arial, sans-serif" font-size="16">${secondLine}</text>
  </svg>`

/**
 * Show the same physical PCB and viewport in both panels. Annotation positions
 * are board-world points in mm (+X right, +Y up), passed to the PCB renderer so
 * it applies the same SVG transform to pads, labels, and routing requests.
 * Notes are added only to the rendered copies, never to the router's input.
 */
export const getCopperPourRoutingSnapshot = ({
  circuitJson,
  gndConnection,
  requestedRoutes,
  layer = "top",
}: {
  circuitJson: AnyCircuitElement[]
  gndConnection: SimpleRouteConnection
  requestedRoutes: SimpleRouteConnection[]
  layer?: LayerRef
}) => {
  const db = su(circuitJson)
  const hasBreakoutEndpoints = gndConnection.pointsToConnect.some((terminal) =>
    db.pcb_breakout_point
      .list()
      .some((point) => point.pcb_breakout_point_id === terminal.pointId),
  )
  const terminalAnnotations: AnyCircuitElement[] = []
  for (const [
    terminalIndex,
    terminal,
  ] of gndConnection.pointsToConnect.entries()) {
    const pcbPort = db.pcb_port
      .list()
      .find((port) => port.pcb_port_id === terminal.pointId)
    const breakoutPoint = db.pcb_breakout_point
      .list()
      .find((point) => point.pcb_breakout_point_id === terminal.pointId)
    const sourcePortId =
      pcbPort?.source_port_id ?? breakoutPoint?.source_port_id
    const sourcePort = sourcePortId && db.source_port.get(sourcePortId)
    const sourceComponent = sourcePort?.source_component_id
      ? db.source_component.get(sourcePort.source_component_id)
      : undefined
    if (!sourcePort || !sourceComponent) {
      throw new Error(
        "Expected a named component and pin for each GND terminal",
      )
    }

    terminalAnnotations.push(
      {
        type: "pcb_note_rect",
        layer,
        pcb_note_rect_id: `gnd_terminal_${terminalIndex}`,
        center: { x: terminal.x, y: terminal.y },
        width: 1.3,
        height: 1.8,
        stroke_width: 0.07,
        is_filled: false,
        color: connectedColor,
      },
      {
        type: "pcb_note_line",
        layer,
        pcb_note_line_id: `gnd_terminal_label_${terminalIndex}`,
        x1: terminal.x,
        y1: terminal.y - 1,
        x2: terminal.x,
        y2: terminal.y - 1.9,
        stroke_width: 0.035,
        color: connectedColor,
      },
      {
        type: "pcb_note_text",
        layer,
        font: "tscircuit2024",
        pcb_note_text_id: `gnd_terminal_name_${terminalIndex}`,
        anchor_position: { x: terminal.x, y: terminal.y - 2.5 },
        anchor_alignment: "center",
        text: `${sourceComponent.name} pin ${sourcePort.pin_number}${breakoutPoint ? " via" : ""} = GND`,
        font_size: 0.48,
        color: connectedColor,
      },
    )
  }

  const annotatedCircuitJson: AnyCircuitElement[] = [
    ...circuitJson,
    ...terminalAnnotations,
    {
      type: "pcb_note_text",
      layer,
      font: "tscircuit2024",
      pcb_note_text_id: "existing_gnd_pour_label",
      anchor_position: { x: 0, y: 4 },
      anchor_alignment: "center",
      text: hasBreakoutEndpoints
        ? `ONE CONTINUOUS ${layer.toUpperCase()} GND PLANE`
        : "ONE CONTINUOUS GND COPPER POUR",
      font_size: 0.52,
      color: "#ffffff",
    },
  ]
  const requestAnnotations: AnyCircuitElement[] = requestedRoutes.map(
    (connection, routeIndex) => {
      const [start, end] = connection.pointsToConnect
      return {
        type: "pcb_note_line",
        layer,
        pcb_note_line_id: `requested_route_${routeIndex}`,
        x1: start.x,
        y1: start.y,
        x2: end.x,
        y2: end.y,
        stroke_width: 0.13,
        is_dashed: true,
        color: requestColor,
      }
    },
  )
  const remainingRouteCount = requestedRoutes.length
  const renderBoard = (annotations: AnyCircuitElement[] = []) =>
    convertCircuitJsonToPcbSvg([...annotatedCircuitJson, ...annotations], {
      width: panelWidth,
      height: 432,
      showPinNumbers: true,
      includeVersion: false,
      viewport: { minX: -11, maxX: 11, minY: -6.6, maxY: 6.6 },
      layer,
    })

  const expectedPanel = stackSvgsVertically(
    [
      createCaption(
        "EXPECTED / PHYSICAL CONNECTION",
        "0 new routes needed",
        hasBreakoutEndpoints
          ? `Both GND escape vias already touch the same ${layer} plane.`
          : "Both highlighted GND pads already touch the same copper.",
        connectedColor,
      ),
      renderBoard(),
      createLegend(
        hasBreakoutEndpoints
          ? "Filled area = GND plane. Teal boxes = GND escape vias."
          : "Red area = existing copper. Teal boxes = connected GND pads.",
        "The pour carries the connection; an extra track is unnecessary.",
      ),
    ],
    { gap: 0, normalizeSize: false },
  )
  const actualPanel = stackSvgsVertically(
    [
      createCaption(
        "ACTUAL / AUTOROUTER POINT-PAIR STAGE",
        `${remainingRouteCount} ${remainingRouteCount === 1 ? "extra route requested" : "extra routes requested"}`,
        remainingRouteCount > 0
          ? hasBreakoutEndpoints
            ? "The router asks to join vias already connected by the plane."
            : "The router asks to connect pads that are already connected."
          : "The router recognizes the connection through existing copper.",
        remainingRouteCount > 0 ? requestColor : connectedColor,
      ),
      renderBoard(requestAnnotations),
      createLegend(
        remainingRouteCount > 0
          ? "Dashed pink line = unnecessary connection request."
          : "No pink line: no extra connection is requested.",
        "Same PCB and scale. A request line is not a routed PCB track.",
      ),
    ],
    { gap: 0, normalizeSize: false },
  )

  return stackSvgsHorizontally([expectedPanel, actualPanel], {
    gap: 16,
    normalizeSize: false,
  })
}
