import type { PcbBoard, PcbPanel, Point } from "circuit-json"
import type { IsolatedCircuit } from "lib/IsolatedCircuit"
import { getRectangularPanelBoardBounds } from "./get-rectangular-panel-board-bounds"

/** Emit score paths in the right-handed circuit-world XY plane (+X right, +Y up), in mm. Board bounds, panel centre and route endpoints are points, including placement translation. */
export function generatePanelVScoreAnnotations(
  { boards, panel }: { boards: PcbBoard[]; panel: PcbPanel },
  { db }: Pick<IsolatedCircuit, "db">,
) {
  if (panel.width <= 0 || panel.height <= 0)
    throw new Error(
      "V-scoring requires a panel with positive final dimensions; use grid layout or explicit panel dimensions",
    )
  const bounds = boards.map(getRectangularPanelBoardBounds)
  const verticalScores = [
    ...new Set(
      bounds.flatMap((boardBounds) => [boardBounds.minX, boardBounds.maxX]),
    ),
  ].sort((first, second) => first - second)
  const horizontalScores = [
    ...new Set(
      bounds.flatMap((boardBounds) => [boardBounds.minY, boardBounds.maxY]),
    ),
  ].sort((first, second) => first - second)
  for (const boardBounds of bounds) {
    if (
      verticalScores.some(
        (x) => x > boardBounds.minX + 1e-6 && x < boardBounds.maxX - 1e-6,
      ) ||
      horizontalScores.some(
        (y) => y > boardBounds.minY + 1e-6 && y < boardBounds.maxY - 1e-6,
      )
    )
      throw new Error(
        "V-score lines must align across the panel without crossing the interior of another board",
      )
  }
  const routes: Point[][] = [
    ...verticalScores.map((x) => [
      { x, y: panel.center.y - panel.height / 2 },
      { x, y: panel.center.y + panel.height / 2 },
    ]),
    ...horizontalScores.map((y) => [
      { x: panel.center.x - panel.width / 2, y },
      { x: panel.center.x + panel.width / 2, y },
    ]),
  ]
  for (const route of routes) {
    db.pcb_fabrication_note_path.insert({
      pcb_panel_id: panel.pcb_panel_id,
      layer: "top",
      route,
      stroke_width: 0.1,
    })
    db.pcb_fabrication_note_text.insert({
      pcb_panel_id: panel.pcb_panel_id,
      layer: "top",
      text: "V-SCORE",
      font: "tscircuit2024",
      font_size: 0.8,
      anchor_position: route[0]!,
      anchor_alignment: "center",
      ccw_rotation: route[0]!.x === route[1]!.x ? 90 : 0,
    })
  }
}
