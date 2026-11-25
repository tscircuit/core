import type { PcbSvgOptions } from "circuit-to-svg"
import type { RootCircuit } from "lib/RootCircuit"

type PcbSnapshotViewport = NonNullable<PcbSvgOptions["viewport"]>

/**
 * Annotate board positions in circuit-world mm, in the right-handed PCB frame
 * (+X right, +Y up, +Z above). The viewport corners and centers are points.
 * Each fixture supplies the same viewport before and after, independently of
 * emitted center metadata. Native fabrication-note text/paths and PCB-note
 * rectangles are rendered by toMatchPcbSnapshot, without SVG postprocessing.
 * Review notes never change board or copper geometry.
 */
export const annotatePcbBoardBounds = (
  circuit: Pick<RootCircuit, "db">,
  {
    title,
    viewport,
    gridStepMm,
  }: { title: string; viewport: PcbSnapshotViewport; gridStepMm: number },
): PcbSvgOptions => {
  const { minX, minY, maxX, maxY } = viewport
  const markerScale = Math.max((maxX - minX) / 55, (maxY - minY) / 45)
  const addLine = (
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    color: string,
    strokeWidth: number,
  ) => {
    circuit.db.pcb_fabrication_note_path.insert({
      route: [
        { x: x1, y: y1 },
        { x: x2, y: y2 },
      ],
      layer: "top",
      stroke_width: strokeWidth * markerScale,
      color,
    })
  }
  const addText = (
    x: number,
    y: number,
    text: string,
    color: string,
    fontSize = 1.2,
  ) => {
    circuit.db.pcb_fabrication_note_text.insert({
      anchor_position: { x, y },
      anchor_alignment: "bottom_left",
      text,
      font: "tscircuit2024",
      font_size: fontSize * markerScale,
      layer: "top",
      color,
    })
  }

  // Draw the grid in world mm; the renderer's grid option uses SVG pixels.
  for (
    let x = Math.ceil(minX / gridStepMm) * gridStepMm;
    x <= maxX;
    x += gridStepMm
  ) {
    addLine(x, minY, x, maxY, "rgba(148, 163, 184, 0.2)", 0.06)
    addText(x - 0.5 * markerScale, minY - 2 * markerScale, `${x}`, "#cbd5e1")
  }
  for (
    let y = Math.ceil(minY / gridStepMm) * gridStepMm;
    y <= maxY;
    y += gridStepMm
  ) {
    addLine(minX, y, maxX, y, "rgba(148, 163, 184, 0.2)", 0.06)
    addText(minX - 4 * markerScale, y - 0.4 * markerScale, `${y}`, "#cbd5e1")
  }
  addLine(minX, 0, maxX, 0, "#5eead4", 0.12)
  addLine(0, minY, 0, maxY, "#5eead4", 0.12)
  addLine(-0.8 * markerScale, 0, 0.8 * markerScale, 0, "#5eead4", 0.3)
  addLine(0, -0.8 * markerScale, 0, 0.8 * markerScale, "#5eead4", 0.3)
  addText(-8 * markerScale, markerScale, "Origin (0, 0)", "#5eead4")
  addText(maxX - 5 * markerScale, markerScale, "+X (mm)", "#5eead4")
  addText(markerScale, maxY - 2 * markerScale, "+Y (mm)", "#5eead4")

  for (const pcbBoard of circuit.db.pcb_board.list()) {
    // Highlight the emitted outline above the grid without moving its points.
    const outline = pcbBoard.outline ?? []
    for (const [pointIndex, point] of outline.entries()) {
      const nextPoint = outline[(pointIndex + 1) % outline.length]
      addLine(point.x, point.y, nextPoint.x, nextPoint.y, "#f8fafc", 0.18)
    }
    circuit.db.pcb_note_rect.insert({
      center: pcbBoard.center,
      width: pcbBoard.width!,
      height: pcbBoard.height!,
      layer: "top",
      stroke_width: 0.2 * markerScale,
      is_filled: false,
      has_stroke: true,
      is_stroke_dashed: true,
      color: "#60a5fa",
    })
    circuit.db.pcb_note_rect.insert({
      center: pcbBoard.center,
      width: 2 * markerScale,
      height: 2 * markerScale,
      corner_radius: markerScale,
      layer: "top",
      stroke_width: 0.2 * markerScale,
      is_filled: false,
      has_stroke: true,
      color: "#ffcc00",
    })
    circuit.db.pcb_note_rect.insert({
      center: pcbBoard.center,
      width: 0.4 * markerScale,
      height: 0.4 * markerScale,
      corner_radius: 0.2 * markerScale,
      layer: "top",
      stroke_width: 0,
      is_filled: true,
      has_stroke: false,
      color: "#ffcc00",
    })
    const labelDirection = pcbBoard.center.x > (minX + maxX) / 2 ? -1 : 1
    addLine(
      pcbBoard.center.x + labelDirection * 0.8 * markerScale,
      pcbBoard.center.y + 0.8 * markerScale,
      pcbBoard.center.x + labelDirection * 2.5 * markerScale,
      pcbBoard.center.y + 2.5 * markerScale,
      "#ffcc00",
      0.15,
    )
    circuit.db.pcb_fabrication_note_text.insert({
      anchor_position: {
        x: pcbBoard.center.x + labelDirection * 3 * markerScale,
        y: pcbBoard.center.y + 3 * markerScale,
      },
      anchor_alignment: labelDirection === 1 ? "bottom_left" : "bottom_right",
      text: `Center (${pcbBoard.center.x}, ${pcbBoard.center.y})`,
      font: "tscircuit2024",
      font_size: 1.4 * markerScale,
      layer: "top",
      color: "#ffcc00",
    })
  }
  addText(minX, maxY + 3 * markerScale, title, "#f8fafc", 1.6)
  addText(minX, minY - 5 * markerScale, "White: actual outline", "#f8fafc")
  addText(
    minX,
    minY - 7 * markerScale,
    "Blue dashed: reported board bounds",
    "#60a5fa",
  )
  addText(
    minX,
    minY - 9 * markerScale,
    "Yellow circle/dot: reported center",
    "#ffcc00",
  )

  return {
    showFabricationNotes: true,
    width: 1200,
    height: 1000,
    backgroundColor: "#0f172a",
    colorOverrides: { boardOutline: "#f8fafc" },
    viewport: {
      minX: minX - 6 * markerScale,
      minY: minY - 11 * markerScale,
      maxX: maxX + 3 * markerScale,
      maxY: maxY + 7 * markerScale,
    },
  }
}
