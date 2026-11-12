import type { SimpleRouteConnection } from "@tscircuit/capacity-autorouter"
import { su } from "@tscircuit/circuit-json-util"
import type { AnyCircuitElement, LayerRef } from "circuit-json"
import { convertCircuitJsonToPcbSvg } from "circuit-to-svg"
import { stackSvgsHorizontally, stackSvgsVertically } from "stack-svgs"

const panelWidth = 600
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
}) => `<svg xmlns="http://www.w3.org/2000/svg" width="${panelWidth}" height="100">
  <rect width="${panelWidth}" height="100" fill="#172131" />
  <text x="24" y="40" fill="${color}" font-family="Arial, sans-serif" font-size="30" font-weight="bold">${title}</text>
  <text x="24" y="76" fill="#e2e8f0" font-family="Arial, sans-serif" font-size="20">${detail}</text>
</svg>`

const layerLabel = (text: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${panelWidth}" height="40">
    <rect width="${panelWidth}" height="40" fill="#172131" />
    <text x="24" y="28" fill="#ffffff" font-family="Arial, sans-serif" font-size="20">${text}</text>
  </svg>`

/**
 * Expected/actual comparison of the same native PCB, with its top and inner1
 * layers aligned in both columns. All note positions are points in right-handed
 * board-world mm (+X right, +Y up, +Z toward top). The renderer handles the
 * projection. Captions use screen pixels (+X right, +Y down). Notes are
 * overlays on rendered copies, never router input. The expected column shows
 * existing copper without requests; only the actual column uses native requests.
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
        text: `${component.name}.GND`,
        font_size: 0.48,
        color: "#ffffff",
      },
    )
  }

  const requestNotes: AnyCircuitElement[] = requestedRoutes.flatMap(
    (connection, index) => {
      const [start, end] = connection.pointsToConnect
      return [
        {
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
        },
        {
          type: "pcb_note_text",
          pcb_note_text_id: `extra_request_label_${index}`,
          layer: "top",
          font: "tscircuit2024",
          anchor_position: {
            x: (start.x + end.x) / 2,
            y: (start.y + end.y) / 2 + 0.65,
          },
          anchor_alignment: "center",
          text: "Unnecessary request",
          font_size: 0.42,
          color: requestColor,
        },
      ]
    },
  )
  const renderBoard = (layer: LayerRef, notes: AnyCircuitElement[]) =>
    convertCircuitJsonToPcbSvg([...circuitJson, ...viaLabels, ...notes], {
      width: panelWidth,
      height: 300,
      viewport: { minX: -6.5, maxX: 6.5, minY: -3.25, maxY: 3.25 },
      layer,
      includeVersion: false,
      showPinNumbers: false,
    })
  const panel = (sections: string[]) =>
    stackSvgsVertically(sections, { gap: 0, normalizeSize: false })
  const requests = requestedRoutes.length
  const planeNotes: AnyCircuitElement[] = [
    {
      type: "pcb_note_text",
      pcb_note_text_id: "ground_plane_label",
      layer: "top",
      font: "tscircuit2024",
      anchor_position: { x: 0, y: 1.6 },
      anchor_alignment: "center",
      text: "SHARED GND COPPER",
      font_size: 0.55,
      color: "#ffffff",
    },
  ]
  const panels = stackSvgsHorizontally(
    [
      panel([
        caption({
          title: "EXPECTED: 0 new routes",
          detail: "Both GND pads are already connected.",
          color: connectedColor,
        }),
        layerLabel("TOP LAYER · Each GND pad connects to a via"),
        renderBoard("top", padLabels),
        layerLabel("INNER1 LAYER · The ground copper joins both vias"),
        renderBoard("inner1", planeNotes),
      ]),
      panel([
        caption({
          title: `ACTUAL: ${requests} ${requests === 1 ? "route" : "routes"} requested`,
          detail: requests
            ? "BUG: core asks to connect them again."
            : "FIXED: core recognizes the existing connection.",
          color: requests ? requestColor : connectedColor,
        }),
        layerLabel("TOP LAYER · Same pads, traces and vias"),
        renderBoard("top", [...padLabels, ...requestNotes]),
        layerLabel("INNER1 LAYER · Same ground copper"),
        renderBoard("inner1", planeNotes),
      ]),
    ],
    { gap: 16, normalizeSize: false },
  )
  const width = panelWidth * 2 + 16
  const explanation = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="136">
    <rect width="${width}" height="136" fill="#172131" />
    <text x="24" y="34" fill="#ffffff" font-family="Arial, sans-serif" font-size="24" font-weight="bold">Existing connection: U1.GND → via A → ground copper → via B → U2.GND</text>
    <text x="24" y="70" fill="#e2e8f0" font-family="Arial, sans-serif" font-size="21">Each column shows the same board. Vias are plated holes joining its copper layers.</text>
    <text x="24" y="108" fill="${requests ? requestColor : connectedColor}" font-family="Arial, sans-serif" font-size="22">${requests ? "Pink dashed line = unnecessary routing request, not a copper trace." : "No pink line: the fix removes the extra request. The copper stays unchanged."}</text>
  </svg>`
  return stackSvgsVertically([panels, explanation], {
    gap: 16,
    normalizeSize: false,
  })
}
