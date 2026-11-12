import type { SimpleRouteConnection } from "@tscircuit/capacity-autorouter"
import { su } from "@tscircuit/circuit-json-util"
import type { AnyCircuitElement } from "circuit-json"
import { convertCircuitJsonToPcbSvg, type PcbSvgOptions } from "circuit-to-svg"
import { stackSvgsHorizontally, stackSvgsVertically } from "stack-svgs"

const connectedColor = "#5eead4"
const requestColor = "#ff59b7"
const detailColor = "#64b5ff"
const background = "#172131"
const fullWidth = 480
const detailWidth = 340
const totalWidth = fullWidth + detailWidth * 2 + 32

const caption = ({ width, lines }: { width: number; lines: string[] }) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${lines.length * 32 + 12}">
    <rect width="${width}" height="100%" fill="${background}" />
    ${lines.map((line, index) => `<text x="16" y="${index * 32 + 29}" fill="#ffffff" font-family="Arial, sans-serif" font-size="19">${line}</text>`).join("")}
  </svg>`

/**
 * Full imported U70 footprint plus two aligned layer close-ups. All geometry
 * and note positions are points in right-handed board-world mm (+X right,
 * +Y up, +Z above). circuit-to-svg owns the projection. Captions use screen
 * pixels (+X right, +Y down). Notes never enter the router's input.
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
  const detailViewport = { minX: -4.5, maxX: -1.3, minY: 15.2, maxY: 18.4 }
  const viaMarkers: AnyCircuitElement[] = []
  const padLabels: AnyCircuitElement[] = []
  const planeLabels: AnyCircuitElement[] = []
  for (const ballName of ["F7", "G6"]) {
    const sourcePort = db.source_port.getWhere({ name: `${ballName}_VSS` })!
    const pad = db.pcb_port.getWhere({
      source_port_id: sourcePort.source_port_id,
    })!
    const breakout = db.pcb_breakout_point.getWhere({
      source_port_id: sourcePort.source_port_id,
    })!
    viaMarkers.push({
      type: "pcb_note_rect",
      pcb_note_rect_id: `via_marker_${ballName}`,
      layer: "top",
      center: { x: breakout.x, y: breakout.y },
      width: 0.4,
      height: 0.4,
      stroke_width: 0.025,
      is_filled: false,
      color: connectedColor,
    })
    padLabels.push({
      type: "pcb_note_text",
      pcb_note_text_id: `pad_label_${ballName}`,
      layer: "top",
      font: "tscircuit2024",
      anchor_position: { x: pad.x, y: pad.y },
      anchor_alignment: "center",
      text: ballName,
      font_size: 0.16,
      color: "#ffffff",
    })
    planeLabels.push({
      type: "pcb_note_text",
      pcb_note_text_id: `via_label_${ballName}`,
      layer: "top",
      font: "tscircuit2024",
      anchor_position: { x: breakout.x + 0.25, y: breakout.y + 0.15 },
      anchor_alignment: "bottom_left",
      text: `${ballName} via`,
      font_size: 0.16,
      color: connectedColor,
    })
  }
  const requestNotes: AnyCircuitElement[] = requestedRoutes.map(
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
        stroke_width: 0.025,
        is_dashed: true,
        color: requestColor,
      }
    },
  )
  const detailBox: AnyCircuitElement = {
    type: "pcb_note_rect",
    pcb_note_rect_id: "detail_region",
    layer: "top",
    center: {
      x: (detailViewport.minX + detailViewport.maxX) / 2,
      y: (detailViewport.minY + detailViewport.maxY) / 2,
    },
    width: detailViewport.maxX - detailViewport.minX,
    height: detailViewport.maxY - detailViewport.minY,
    stroke_width: 0.08,
    is_filled: false,
    color: detailColor,
  }
  const renderBoard = ({
    notes,
    ...options
  }: PcbSvgOptions & { notes: AnyCircuitElement[] }) => {
    const svg = convertCircuitJsonToPcbSvg([...circuitJson, ...notes], {
      includeVersion: false,
      showPinNumbers: false,
      showCourtyards: false,
      ...options,
    })
    // stack-svgs unwraps the outer SVG. Keep a nested viewport so the full
    // native board is clipped to the close-up without deleting any copper.
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${options.width}" height="${options.height}">${svg}</svg>`
  }
  const panel = (sections: string[]) =>
    stackSvgsVertically(sections, { gap: 0, normalizeSize: false })
  const requests = requestedRoutes.length
  const headline = `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="116">
    <rect width="${totalWidth}" height="116" fill="${background}" />
    <text x="20" y="38" fill="#ffffff" font-family="Arial, sans-serif" font-size="29" font-weight="bold">STM32MP157DAB1: ground-plane connectivity</text>
    <text x="20" y="84" fill="${connectedColor}" font-family="Arial, sans-serif" font-size="27" font-weight="bold">EXPECTED: 0 new routes</text>
    <text x="500" y="84" fill="${requests ? requestColor : connectedColor}" font-family="Arial, sans-serif" font-size="27" font-weight="bold">ACTUAL: ${requests} ${requests ? "unnecessary requests" : "requests — fixed"}</text>
  </svg>`
  const panels = stackSvgsHorizontally(
    [
      panel([
        caption({
          width: fullWidth,
          lines: [
            `FULL U70 · ${db.pcb_smtpad.list().length} pads / ${gndConnection.pointsToConnect.length} GND escapes`,
          ],
        }),
        renderBoard({
          width: fullWidth,
          height: fullWidth,
          layer: "top",
          viewport: { minX: -9, maxX: 9, minY: 11, maxY: 29 },
          notes: [detailBox],
        }),
      ]),
      panel([
        caption({
          width: detailWidth,
          lines: ["DETAIL · TOP copper + requests"],
        }),
        renderBoard({
          width: detailWidth,
          height: detailWidth,
          layer: "top",
          viewport: detailViewport,
          notes: [...viaMarkers, ...padLabels, ...requestNotes],
        }),
        caption({
          width: detailWidth,
          lines: [
            "F7 and G6 are GND pads.",
            "Teal boxes mark their vias.",
            requests
              ? "Pink dashes = extra requests."
              : "No extra requests remain.",
            "Request lines are not copper.",
          ],
        }),
      ]),
      panel([
        caption({ width: detailWidth, lines: ["SAME DETAIL · INNER1 copper"] }),
        renderBoard({
          width: detailWidth,
          height: detailWidth,
          layer: "inner1",
          viewport: detailViewport,
          notes: [...viaMarkers, ...planeLabels],
        }),
        caption({
          width: detailWidth,
          lines: [
            "Brown = one GND plane.",
            "Both vias already touch it.",
            "The plane connects the pads.",
            "No extra route is needed.",
          ],
        }),
      ]),
    ],
    { gap: 16, normalizeSize: false },
  )
  const explanation = `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="100">
    <rect width="${totalWidth}" height="100" fill="${background}" />
    <text x="20" y="32" fill="${detailColor}" font-family="Arial, sans-serif" font-size="21">Blue box = the region enlarged on the right. Both close-ups show identical coordinates.</text>
    <text x="20" y="65" fill="#ffffff" font-family="Arial, sans-serif" font-size="20">Full imported footprint + all 104 motherboard GND assignments. Other nets are omitted in this test.</text>
    <text x="20" y="92" fill="#cbd5e1" font-family="Arial, sans-serif" font-size="18">Native dogbone → ground pour → core export → native point-pair requests. No saved or injected routes.</text>
  </svg>`
  return panel([headline, panels, explanation])
}
