import type { RootCircuit } from "lib/RootCircuit"

/**
 * Annotate emitted board bounds and centers in circuit-world mm, in the
 * right-handed PCB frame (+X right, +Y top, +Z above). Centers are positions.
 * These review overlays leave the board and copper geometry unchanged.
 */
export const annotatePcbBoardBounds = (circuit: Pick<RootCircuit, "db">) => {
  for (const pcbBoard of circuit.db.pcb_board.list()) {
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
      width: 2,
      height: 2,
      corner_radius: 1,
      layer: "top",
      stroke_width: 0.25,
      is_filled: false,
      has_stroke: true,
      color: "#ffcc00",
    })
    circuit.db.pcb_note_rect.insert({
      center: pcbBoard.center,
      width: 0.4,
      height: 0.4,
      corner_radius: 0.2,
      layer: "top",
      stroke_width: 0,
      is_filled: true,
      has_stroke: false,
      color: "#ffcc00",
    })
    circuit.db.pcb_note_line.insert({
      x1: pcbBoard.center.x + 0.8,
      y1: pcbBoard.center.y + 0.8,
      x2: pcbBoard.center.x + 2.5,
      y2: pcbBoard.center.y + 2.5,
      layer: "top",
      stroke_width: 0.2,
      color: "#ffcc00",
    })
    circuit.db.pcb_note_text.insert({
      anchor_position: {
        x: pcbBoard.center.x + 3,
        y: pcbBoard.center.y + 3,
      },
      anchor_alignment: "bottom_left",
      text: `Center (${pcbBoard.center.x}, ${pcbBoard.center.y})`,
      font: "tscircuit2024",
      font_size: 1,
      layer: "top",
      color: "#ffcc00",
    })
  }
}
