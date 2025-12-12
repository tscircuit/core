import type { NinePointAnchor } from "circuit-json"
import type { Point } from "circuit-json"

interface Bounds {
  minX: number
  maxX: number
  minY: number
  maxY: number
}

interface SchematicElement {
  type: string
  center?: Point
  position?: Point
  x?: number
  y?: number
  x1?: number
  y1?: number
  x2?: number
  y2?: number
  width?: number
  height?: number
  size?: { width: number; height: number }
  radius?: number
  text?: string
}

function getLabelBounds(
  probePosition: Point,
  labelText: string,
  alignment: NinePointAnchor,
  labelOffset = 0.3,
): Bounds {
  const charWidth = 0.1
  const labelWidth = Math.max(labelText.length * charWidth, 0.3)
  const labelHeight = 0.25

  let anchorX = probePosition.x
  let anchorY = probePosition.y

  const offsetMultiplier = labelOffset + labelWidth / 2

  if (alignment.includes("top")) {
    anchorY += offsetMultiplier
  } else if (alignment.includes("bottom")) {
    anchorY -= offsetMultiplier
  }

  if (alignment.includes("right")) {
    anchorX += offsetMultiplier
  } else if (alignment.includes("left")) {
    anchorX -= offsetMultiplier
  }

  let minX: number, maxX: number, minY: number, maxY: number

  if (alignment.includes("left")) {
    minX = anchorX
    maxX = anchorX + labelWidth
  } else if (alignment.includes("right")) {
    minX = anchorX - labelWidth
    maxX = anchorX
  } else {
    minX = anchorX - labelWidth / 2
    maxX = anchorX + labelWidth / 2
  }

  if (alignment.includes("top")) {
    minY = anchorY - labelHeight
    maxY = anchorY
  } else if (alignment.includes("bottom")) {
    minY = anchorY
    maxY = anchorY + labelHeight
  } else {
    minY = anchorY - labelHeight / 2
    maxY = anchorY + labelHeight / 2
  }

  return { minX, maxX, minY, maxY }
}

function getElementBounds(elm: SchematicElement): Bounds | null {
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
  } else {
    return null
  }

  if (
    typeof cx === "number" &&
    typeof cy === "number" &&
    typeof w === "number" &&
    typeof h === "number"
  ) {
    return {
      minX: cx - w / 2,
      maxX: cx + w / 2,
      minY: cy - h / 2,
      maxY: cy + h / 2,
    }
  }

  return null
}

function boundsOverlap(a: Bounds, b: Bounds): boolean {
  return !(
    a.maxX < b.minX ||
    a.minX > b.maxX ||
    a.maxY < b.minY ||
    a.minY > b.maxY
  )
}

function getOverlapArea(a: Bounds, b: Bounds): number {
  if (!boundsOverlap(a, b)) return 0

  const overlapWidth = Math.min(a.maxX, b.maxX) - Math.max(a.minX, b.minX)
  const overlapHeight = Math.min(a.maxY, b.maxY) - Math.max(a.minY, b.minY)

  return overlapWidth * overlapHeight
}

export function selectBestLabelAlignment(
  probePosition: Point,
  labelText: string,
  schematicElements: SchematicElement[],
  defaultAlignment: NinePointAnchor = "top_right",
): NinePointAnchor {
  const alignmentOptions: NinePointAnchor[] = [
    "top_right",
    "top_left",
    "bottom_right",
    "bottom_left",
    "top_center",
    "bottom_center",
    "center_right",
    "center_left",
    "center",
  ]

  const orderedAlignments = [
    defaultAlignment,
    ...alignmentOptions.filter((a) => a !== defaultAlignment),
  ]

  let bestAlignment = defaultAlignment
  let minOverlapArea = Infinity

  for (const alignment of orderedAlignments) {
    const labelBounds = getLabelBounds(probePosition, labelText, alignment)
    let totalOverlapArea = 0

    for (const element of schematicElements) {
      if (element.type === "schematic_voltage_probe") {
        continue
      }

      const elementBounds = getElementBounds(element)
      if (elementBounds) {
        totalOverlapArea += getOverlapArea(labelBounds, elementBounds)
      }
    }

    if (totalOverlapArea === 0) {
      return alignment
    }

    if (totalOverlapArea < minOverlapArea) {
      minOverlapArea = totalOverlapArea
      bestAlignment = alignment
    }
  }

  return bestAlignment
}
