/**
 * Utility to get schematic bounds for a set of elements
 */
export function getBoundsForSchematic(db: any[]): {
  minX: number
  maxX: number
  minY: number
  maxY: number
} {
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity
  for (const elm of db) {
    let cx: number | undefined,
      cy: number | undefined,
      w: number | undefined,
      h: number | undefined
    if (elm.type === "schematic_component") {
      cx = elm.center?.x
      cy = elm.center?.y
      w = elm.size?.width
      h = elm.size?.height
    } else if (elm.type === "schematic_box") {
      cx = elm.x
      cy = elm.y
      w = elm.width
      h = elm.height
    } else if (elm.type === "schematic_port") {
      cx = elm.center?.x
      cy = elm.center?.y
      w = 0.2
      h = 0.2
    } else if (elm.type === "schematic_text") {
      cx = elm.position?.x
      cy = elm.position?.y
      w = (elm.text?.length ?? 0) * 0.1
      h = 0.2
    }
    if (
      typeof cx === "number" &&
      typeof cy === "number" &&
      typeof w === "number" &&
      typeof h === "number"
    ) {
      minX = Math.min(minX, cx - w / 2)
      maxX = Math.max(maxX, cx + w / 2)
      minY = Math.min(minY, cy - h / 2)
      maxY = Math.max(maxY, cy + h / 2)
    }
  }
  return { minX, maxX, minY, maxY }
}
