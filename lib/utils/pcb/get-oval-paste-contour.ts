import type { Point } from "circuit-json"

/** Ellipse perimeter points in the input PCB frame (+X right, +Y up, mm).
 * Match the 64-segment ellipse used for Gerber paste regions. */
export function getOvalPasteContour(
  center: Point,
  width: number,
  height: number,
): Point[] {
  return Array.from({ length: 64 }, (_, i) => {
    const angle = (i * 2 * Math.PI) / 64
    return {
      x: center.x + (width / 2) * Math.cos(angle),
      y: center.y + (height / 2) * Math.sin(angle),
    }
  })
}
