import type { Vec2 } from "@tscircuit/manifold-2d"
import type { PcbHole, PcbPlatedHole } from "circuit-json"

export interface DrillShapeBuilders {
  ellipse: (width: number, height: number) => Vec2[]
  rectangle: (width: number, height: number) => Vec2[]
  roundedRectangle: (width: number, height: number, radius: number) => Vec2[]
  place: (loop: Vec2[], x: number, y: number, rotation?: number) => Vec2[]
}

export function getBoardDrillLoop(
  hole: PcbHole | PcbPlatedHole,
  builders: DrillShapeBuilders,
): Vec2[] | undefined {
  const shape =
    hole.type === "pcb_hole"
      ? hole.hole_shape
      : hole.shape === "circular_hole_with_rect_pad"
        ? "circle"
        : hole.shape === "pill_hole_with_rect_pad"
          ? "pill"
          : hole.shape === "rotated_pill_hole_with_rect_pad"
            ? "rotated_pill"
            : hole.shape === "hole_with_polygon_pad"
              ? hole.hole_shape
              : hole.shape
  const diameter = "hole_diameter" in hole ? hole.hole_diameter : undefined
  const width = ("hole_width" in hole ? hole.hole_width : undefined) ?? diameter
  const height =
    ("hole_height" in hole ? hole.hole_height : undefined) ?? diameter
  if (!width || !height) return undefined
  let loop: Vec2[]
  if (shape === "circle" || shape === "oval")
    loop = builders.ellipse(width, height)
  else if (shape === "rect" || shape === "square")
    loop = builders.rectangle(width, height)
  else if (shape === "pill" || shape === "rotated_pill")
    loop = builders.roundedRectangle(width, height, Math.min(width, height) / 2)
  else return undefined
  const rotation =
    "hole_ccw_rotation" in hole && typeof hole.hole_ccw_rotation === "number"
      ? hole.hole_ccw_rotation
      : "ccw_rotation" in hole && typeof hole.ccw_rotation === "number"
        ? hole.ccw_rotation
        : 0
  return builders.place(
    loop,
    hole.x + ("hole_offset_x" in hole ? (hole.hole_offset_x ?? 0) : 0),
    hole.y + ("hole_offset_y" in hole ? (hole.hole_offset_y ?? 0) : 0),
    rotation,
  )
}
