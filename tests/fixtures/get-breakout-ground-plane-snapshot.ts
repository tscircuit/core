import type { SimpleRouteConnection } from "@tscircuit/capacity-autorouter"
import { su } from "@tscircuit/circuit-json-util"
import type { AnyCircuitElement, LayerRef } from "circuit-json"
import { convertCircuitJsonToPcbSvg } from "circuit-to-svg"
import { stackSvgsHorizontally, stackSvgsVertically } from "stack-svgs"

const panelWidth = 560
const connectedColor = "#5eead4"
const requestColor = "#ff59b7"

const caption = ({
  title,
  detail,
  color = "#ffffff",
}: {
  title: string
  detail: string
  color?: string
}) => `<svg xmlns="http://www.w3.org/2000/svg" width="${panelWidth}" height="94">
  <rect width="${panelWidth}" height="94" fill="#172131" />
  <text x="20" y="35" fill="${color}" font-family="Arial, sans-serif" font-size="24" font-weight="bold">${title}</text>
  <text x="20" y="68" fill="#e2e8f0" font-family="Arial, sans-serif" font-size="18">${detail}</text>
</svg>`

/**
 * Three views of the same native PCB: top escapes, inner1 ground plane, and
 * the native point-pair requests. All note positions are points in right-handed
 * board-world mm (+X right, +Y up, +Z toward top). The renderer handles the
 * projection. Notes are overlays on rendered copies, never router input.
 */
export const getBreakoutGroundPlaneSnapshot = ({
  circuitJson,
  gndConnection,
  requestedRoutes,
}: {
  circuitJson: AnyCircuitElement[]
  gndConnection: SimpleRouteConnection
  requestedRoutes: SimpleRouteConnection[]
}) => {
  const db = su(circuitJson)
  const viaLabels: AnyCircuitElement[] = []
  const padLabels: AnyCircuitElement[] = []
  for (const [index, terminal] of gndConnection.pointsToConnect.entries()) {
    const breakout = db.pcb_breakout_point.get(terminal.pointId!)!
    const sourcePort = db.source_port.get(breakout.source_port_id!)!
    const component = db.source_component.get(sourcePort.source_component_id!)!
    const pad = db.pcb_port
      .list()
      .find((port) => port.source_port_id === sourcePort.source_port_id)!
    viaLabels.push(
      {
        type: "pcb_note_rect",
        pcb_note_rect_id: `via_marker_${index}`,
        layer: "top",
        center: { x: terminal.x, y: terminal.y },
        width: 0.65,
        height: 0.65,
        stroke_width: 0.045,
        is_filled: false,
        color: connectedColor,
      },
      {
        type: "pcb_note_line",
        pcb_note_line_id: `via_leader_${index}`,
        layer: "top",
        x1: terminal.x,
        y1: terminal.y - 0.4,
        x2: terminal.x,
        y2: -1.7,
        stroke_width: 0.025,
        color: connectedColor,
      },
      {
        type: "pcb_note_text",
        pcb_note_text_id: `via_label_${index}`,
        layer: "top",
        font: "tscircuit2024",
        anchor_position: { x: terminal.x, y: -2.15 },
        anchor_alignment: "center",
        text: `Via ${String.fromCharCode(65 + index)}`,
        font_size: 0.43,
        color: connectedColor,
      },
    )
    padLabels.push(
      {
        type: "pcb_note_line",
        pcb_note_line_id: `pad_leader_${index}`,
        layer: "top",
        x1: pad.x,
        y1: pad.y + 0.3,
        x2: pad.x - 0.8,
        y2: 1.9,
        stroke_width: 0.025,
        color: "#ffffff",
      },
      {
        type: "pcb_note_text",
        pcb_note_text_id: `pad_label_${index}`,
        layer: "top",
        font: "tscircuit2024",
        anchor_position: { x: pad.x - 0.4, y: 2.35 },
        anchor_alignment: "center",
        text: `${component.name} GND pad`,
        font_size: 0.4,
        color: "#ffffff",
      },
    )
  }

  const requestLines: AnyCircuitElement[] = requestedRoutes.map(
    (connection, index) => {
      const [start, end] = connection.pointsToConnect
      return {
        type: "pcb_note_line",
        pcb_note_line_id: `extra_request_${index}`,
        layer: "top",
        x1: start.x,
        y1: start.y,
        x2: end.x,
        y2: end.y,
        stroke_width: 0.09,
        is_dashed: true,
        color: requestColor,
      }
    },
  )
  const renderBoard = (layer: LayerRef, notes: AnyCircuitElement[]) =>
    convertCircuitJsonToPcbSvg([...circuitJson, ...viaLabels, ...notes], {
      width: panelWidth,
      height: 280,
      viewport: { minX: -6.5, maxX: 6.5, minY: -3.25, maxY: 3.25 },
      layer,
      includeVersion: false,
      showPinNumbers: false,
    })
  const panel = (sections: string[]) =>
    stackSvgsVertically(sections, { gap: 0, normalizeSize: false })
  const requests = requestedRoutes.length
  const panels = stackSvgsHorizontally(
    [
      panel([
        caption({
          title: "1. Pads connect to vias",
          detail: "TOP copper: short native escape traces.",
        }),
        renderBoard("top", padLabels),
        caption({
          title: "Pad → short trace → via",
          detail: "Teal markers identify the same vias in every view.",
          color: connectedColor,
        }),
      ]),
      panel([
        caption({
          title: "2. Vias share one ground plane",
          detail: "INNER1 copper: both vias already touch GND.",
        }),
        renderBoard("inner1", [
          {
            type: "pcb_note_text",
            pcb_note_text_id: "ground_plane_label",
            layer: "top",
            font: "tscircuit2024",
            anchor_position: { x: 0, y: 1.6 },
            anchor_alignment: "center",
            text: "ONE CONTINUOUS GND PLANE",
            font_size: 0.43,
            color: "#ffffff",
          },
        ]),
        caption({
          title: "Via A → GND plane → Via B",
          detail: "Brown fill is existing copper, joining both vias.",
          color: connectedColor,
        }),
      ]),
      panel([
        caption({
          title: requests
            ? "3. Core asks to connect again"
            : "3. Core keeps the connection",
          detail: `${requests ? "BUG" : "FIXED"}: ${requests} extra ${requests === 1 ? "connection" : "connections"} requested; expected 0.`,
          color: requests ? requestColor : connectedColor,
        }),
        renderBoard("top", [...padLabels, ...requestLines]),
        caption({
          title: requests
            ? "This extra connection is unnecessary"
            : "No extra connection is requested",
          detail: requests
            ? "Pink dashed line = a request, NOT existing copper."
            : "The same copper already connects both GND pads.",
          color: requests ? requestColor : connectedColor,
        }),
      ]),
    ],
    { gap: 16, normalizeSize: false },
  )
  const width = panelWidth * 3 + 32
  const explanation = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="112">
    <rect width="${width}" height="112" fill="#172131" />
    <text x="24" y="38" fill="#ffffff" font-family="Arial, sans-serif" font-size="24" font-weight="bold">Already connected: U1 GND pad → via A → ground plane → via B → U2 GND pad.</text>
    <text x="24" y="76" fill="${requests ? requestColor : connectedColor}" font-family="Arial, sans-serif" font-size="22">${requests ? "Bug: core forgets this plane connection when passing the breakout targets to the global router." : "Fixed: core tells the global router that these breakout targets are already connected by copper."}</text>
  </svg>`
  return stackSvgsVertically([panels, explanation], {
    gap: 16,
    normalizeSize: false,
  })
}
