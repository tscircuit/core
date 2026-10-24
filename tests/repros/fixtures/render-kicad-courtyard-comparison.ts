import type { AnyCircuitElement } from "circuit-json"
import { convertCircuitJsonToPcbSvg } from "circuit-to-svg"
import { stackSvgsVertically } from "stack-svgs"

const segmentColors = ["#55ddff", "#ffd166", "#a6ee77", "#d6a0ff"]

const courtyardPanel = (circuitJson: AnyCircuitElement[]) => {
  const sourceChip = circuitJson
    .filter((elm) => elm.type === "source_component")
    .find((elm) => elm.name === "U1")!
  const pcbChip = circuitJson
    .filter((elm) => elm.type === "pcb_component")
    .find((elm) => elm.source_component_id === sourceChip.source_component_id)!
  const courtyards = circuitJson
    .filter((elm) => elm.type === "pcb_courtyard_outline")
    .filter((elm) => elm.pcb_component_id === pcbChip.pcb_component_id)
  const points = courtyards.flatMap((courtyard) => courtyard.outline)
  const minX = Math.min(...points.map((point) => point.x))
  const maxX = Math.max(...points.map((point) => point.x))
  const minY = Math.min(...points.map((point) => point.y))
  const maxY = Math.max(...points.map((point) => point.y))
  const centerX = (minX + maxX) / 2
  const centerY = (minY + maxY) / 2
  const segmented = courtyards.length === 4
  const traceCount = circuitJson.filter(
    (elm) => elm.type === "pcb_trace",
  ).length

  // Annotation positions and the viewport use emitted board-world points in mm:
  // +X right, +Y up. The PCB renderer handles the conversion to SVG coordinates.
  const note = (
    text: string,
    x: number,
    y: number,
    color = "#ffffff",
  ): AnyCircuitElement => ({
    type: "pcb_note_text",
    pcb_note_text_id: `courtyard_label_${text}`,
    text,
    anchor_position: { x, y },
    anchor_alignment: "center",
    font: "tscircuit2024",
    font_size: 0.55,
    layer: "top",
    color,
  })
  const segmentLabels = segmented
    ? courtyards.map((courtyard, index) => {
        const midpointX = (courtyard.outline[0].x + courtyard.outline[1].x) / 2
        const midpointY = (courtyard.outline[0].y + courtyard.outline[1].y) / 2
        return note(
          `S${index + 1}`,
          midpointX + Math.sign(midpointX - centerX) * 0.85,
          midpointY + Math.sign(midpointY - centerY) * 0.85,
          segmentColors[index],
        )
      })
    : [note("Closed courtyard", centerX, maxY + 0.85, segmentColors[0])]

  // Emphasize the actual emitted courtyard polygons, preserving their points.
  // Inline styles survive the SVG stacker's per-panel ID remapping.
  const highlightCourtyards = (svg: string) =>
    courtyards.reduce(
      (highlightedSvg, courtyard, index) =>
        highlightedSvg.replace(
          `data-pcb-courtyard-outline-id="${courtyard.pcb_courtyard_outline_id}"`,
          `data-pcb-courtyard-outline-id="${courtyard.pcb_courtyard_outline_id}" style="stroke:${segmentColors[index]};stroke-width:3"`,
        ),
      svg,
    )
  const boardSvg = highlightCourtyards(
    convertCircuitJsonToPcbSvg(
      [...circuitJson, note("U1", centerX, maxY + 0.85)],
      {
        width: 620,
        height: 410,
        showCourtyards: true,
        showFabricationNotes: false,
      },
    ),
  )
  const zoomSvg = highlightCourtyards(
    convertCircuitJsonToPcbSvg(
      [...circuitJson, note("U1", centerX, centerY + 1.8), ...segmentLabels],
      {
        width: 510,
        height: 410,
        showCourtyards: true,
        showFabricationNotes: false,
        viewport: {
          minX: minX - 1.6,
          maxX: maxX + 1.6,
          minY: minY - 1.6,
          maxY: maxY + 1.6,
        },
      },
    ),
  )
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="600">
    <rect width="1200" height="600" fill="#101820"/>
    <g font-family="Arial, sans-serif" fill="#ffffff">
      <text x="24" y="32" font-size="24" font-weight="bold">${segmented ? "REPRO: four separate courtyard segments" : "CONTROL: one closed courtyard polygon"}</text>
      <text x="24" y="59" font-size="18">${segmented ? "Placement throws: A ring must enclose a non-zero area" : "Placement succeeds with the same pads, boundary and DRC settings"}</text>
      <text x="24" y="91" font-size="18">Whole board: ${traceCount} routed traces</text>
      <text x="666" y="91" font-size="18">U1 courtyard close-up</text>
      <svg x="16" y="106" width="620" height="410">${boardSvg}</svg>
      <svg x="666" y="106" width="510" height="410">${zoomSvg}</svg>
      <text x="24" y="548" font-size="18">${segmented ? "Even the independent R2-to-R3 net is blocked." : "All three nets route, including R2-to-R3."}</text>
      <text x="666" y="548" font-size="18">${segmented ? "S1-S4: four outlines, two vertices each" : "One outline, four vertices, non-zero area"}</text>
      <text x="24" y="579" font-size="16" fill="#b8c5d1">Highlighted lines = courtyards. Red pads and lines = copper.</text>
      <text x="666" y="579" font-size="16" fill="#b8c5d1">${segmented ? "Each colored edge is a separate outline." : "Cyan edges belong to the same polygon."}</text>
    </g>
  </svg>`
}

export const renderKicadCourtyardComparison = (
  segmentedCircuitJson: AnyCircuitElement[],
  closedCircuitJson: AnyCircuitElement[],
) =>
  stackSvgsVertically(
    [courtyardPanel(segmentedCircuitJson), courtyardPanel(closedCircuitJson)],
    { gap: 12, normalizeSize: false },
  )
