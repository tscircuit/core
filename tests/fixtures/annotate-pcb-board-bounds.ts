import { getBoundsFromPoints } from "@tscircuit/math-utils"
import type { RootCircuit } from "lib/RootCircuit"

/**
 * Annotate emitted board bounds and centers in circuit-world mm, in the
 * right-handed PCB frame (+X right, +Y top, +Z above). Centers are positions.
 * These review overlays leave the board and copper geometry unchanged.
 */
export const annotatePcbBoardBounds = (circuit: Pick<RootCircuit, "db">) => {
  const pcbBoards = circuit.db.pcb_board.list()
  const bounds = getBoundsFromPoints([
    ...pcbBoards.flatMap((pcbBoard) => pcbBoard.outline ?? []),
    ...[...pcbBoards, ...circuit.db.pcb_panel.list()].flatMap(
      (pcbBoardOrPanel) => [
        {
          x: pcbBoardOrPanel.center.x - pcbBoardOrPanel.width! / 2,
          y: pcbBoardOrPanel.center.y - pcbBoardOrPanel.height! / 2,
        },
        {
          x: pcbBoardOrPanel.center.x + pcbBoardOrPanel.width! / 2,
          y: pcbBoardOrPanel.center.y + pcbBoardOrPanel.height! / 2,
        },
      ],
    ),
  ])
  if (!bounds) return

  // Keep review markers readable when explicit placement or panels widen the view.
  const markerScale = Math.max(
    1,
    (bounds.maxX - bounds.minX) / 40,
    (bounds.maxY - bounds.minY) / 30,
  )
  for (const pcbBoard of pcbBoards) {
    const labelDirection =
      pcbBoard.center.x > (bounds.minX + bounds.maxX) / 2 ? -1 : 1
    circuit.db.pcb_note_rect.insert({
      center: pcbBoard.center,
      width: pcbBoard.width!,
      height: pcbBoard.height!,
      layer: "top",
      stroke_width: 0.2,
      is_filled: false,
      has_stroke: true,
      is_stroke_dashed: true,
      color: "#4da6ff",
    })
    circuit.db.pcb_note_rect.insert({
      center: pcbBoard.center,
      width: 2 * markerScale,
      height: 2 * markerScale,
      corner_radius: markerScale,
      layer: "top",
      stroke_width: 0.25 * markerScale,
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
    circuit.db.pcb_note_line.insert({
      x1: pcbBoard.center.x + labelDirection * 0.8 * markerScale,
      y1: pcbBoard.center.y + 0.8 * markerScale,
      x2: pcbBoard.center.x + labelDirection * 2.5 * markerScale,
      y2: pcbBoard.center.y + 2.5 * markerScale,
      layer: "top",
      stroke_width: 0.2,
      color: "#ffcc00",
    })
    circuit.db.pcb_note_text.insert({
      anchor_position: {
        x: pcbBoard.center.x + labelDirection * 3 * markerScale,
        y: pcbBoard.center.y + 3 * markerScale,
      },
      anchor_alignment: labelDirection === 1 ? "bottom_left" : "bottom_right",
      text: `Center (${pcbBoard.center.x}, ${pcbBoard.center.y})`,
      font: "tscircuit2024",
      font_size: markerScale,
      layer: "top",
      color: "#ffcc00",
    })
  }
  circuit.db.pcb_note_text.insert({
    anchor_position: {
      x: bounds.minX + markerScale,
      y: bounds.minY + 0.5 * markerScale,
    },
    anchor_alignment: "bottom_left",
    text: "Blue dashed: bounds | Yellow circle/dot: center",
    font: "tscircuit2024",
    font_size: 0.7 * markerScale,
    layer: "top",
    color: "#4da6ff",
  })
}
