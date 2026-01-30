/**
 * Utility to get schematic bounds for a set of elements
 */
function normalizeAngle(angle: number): number {
  const normalized = angle % 360
  return normalized < 0 ? normalized + 360 : normalized
}

function isAngleBetween(
  angle: number,
  start: number,
  end: number,
  direction: "clockwise" | "counterclockwise",
): boolean {
  if (direction === "counterclockwise") {
    if (end >= start) {
      return angle >= start && angle <= end
    }
    return angle >= start || angle <= end
  }

  if (end <= start) {
    return angle <= start && angle >= end
  }
  return angle <= start || angle >= end
}

function getArcBounds(
  elm: any,
): { minX: number; maxX: number; minY: number; maxY: number } | null {
  const center = elm.center
  const radius = elm.radius
  const startAngle = elm.start_angle_degrees
  const endAngle = elm.end_angle_degrees
  const direction: "clockwise" | "counterclockwise" =
    elm.direction ?? "counterclockwise"

  if (
    !center ||
    typeof center.x !== "number" ||
    typeof center.y !== "number" ||
    typeof radius !== "number" ||
    typeof startAngle !== "number" ||
    typeof endAngle !== "number"
  ) {
    return null
  }

  const start = normalizeAngle(startAngle)
  const end = normalizeAngle(endAngle)
  const consideredAngles = new Set<number>([start, end])
  const cardinalAngles = [0, 90, 180, 270]

  for (const cardinal of cardinalAngles) {
    if (isAngleBetween(cardinal, start, end, direction)) {
      consideredAngles.add(cardinal)
    }
  }

  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity

  for (const angle of consideredAngles) {
    const radians = (angle * Math.PI) / 180
    const x = center.x + radius * Math.cos(radians)
    const y = center.y + radius * Math.sin(radians)
    minX = Math.min(minX, x)
    maxX = Math.max(maxX, x)
    minY = Math.min(minY, y)
    maxY = Math.max(maxY, y)
  }

  if (!Number.isFinite(minX) || !Number.isFinite(minY)) {
    return null
  }

  return { minX, maxX, minY, maxY }
}

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
    } else if (elm.type === "schematic_line") {
      const x1 = elm.x1 ?? 0
      const y1 = elm.y1 ?? 0
      const x2 = elm.x2 ?? 0
      const y2 = elm.y2 ?? 0
      cx = (x1 + x2) / 2
      cy = (y1 + y2) / 2
      w = Math.abs(x2 - x1)
      h = Math.abs(y2 - y1)
    } else if (elm.type === "schematic_rect") {
      cx = elm.center?.x
      cy = elm.center?.y
      w = elm.width
      h = elm.height
    } else if (elm.type === "schematic_circle") {
      cx = elm.center?.x
      cy = elm.center?.y
      const radius = elm.radius
      if (typeof radius === "number") {
        w = radius * 2
        h = radius * 2
      }
    } else if (elm.type === "schematic_arc") {
      const bounds = getArcBounds(elm)
      if (bounds) {
        minX = Math.min(minX, bounds.minX)
        maxX = Math.max(maxX, bounds.maxX)
        minY = Math.min(minY, bounds.minY)
        maxY = Math.max(maxY, bounds.maxY)
      }
      continue
    } else if (elm.type === "schematic_path") {
      const points = elm.points
      if (Array.isArray(points)) {
        for (const point of points) {
          if (typeof point.x === "number" && typeof point.y === "number") {
            minX = Math.min(minX, point.x)
            maxX = Math.max(maxX, point.x)
            minY = Math.min(minY, point.y)
            maxY = Math.max(maxY, point.y)
          }
        }
      }
      continue
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
