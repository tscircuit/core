export interface PadBounds {
  id: string
  type: "pcb_smtpad" | "pcb_plated_hole"
  left: number
  right: number
  top: number
  bottom: number
}

/** Compute axis aligned bounds for a PCB pad */
export function getPadBounds(pad: any): PadBounds | null {
  if (pad.type === "pcb_smtpad") {
    const id = pad.pcb_smtpad_id
    const x = pad.x
    const y = pad.y
    if (pad.shape === "circle") {
      const r = pad.radius
      return {
        id,
        type: pad.type,
        left: x - r,
        right: x + r,
        top: y + r,
        bottom: y - r,
      }
    }
    if (pad.shape === "rect") {
      const w = pad.width
      const h = pad.height
      return {
        id,
        type: pad.type,
        left: x - w / 2,
        right: x + w / 2,
        top: y + h / 2,
        bottom: y - h / 2,
      }
    }
    if (pad.shape === "rotated_rect") {
      const w = pad.width
      const h = pad.height
      const angle = (pad.ccw_rotation * Math.PI) / 180
      const cos = Math.abs(Math.cos(angle))
      const sin = Math.abs(Math.sin(angle))
      const dx = cos * (w / 2) + sin * (h / 2)
      const dy = sin * (w / 2) + cos * (h / 2)
      return {
        id,
        type: pad.type,
        left: x - dx,
        right: x + dx,
        top: y + dy,
        bottom: y - dy,
      }
    }
    if (pad.shape === "pill") {
      const w = pad.width
      const h = pad.height
      return {
        id,
        type: pad.type,
        left: x - w / 2,
        right: x + w / 2,
        top: y + h / 2,
        bottom: y - h / 2,
      }
    }
    if (pad.shape === "polygon") {
      const points = pad.points
      const xs = points.map((p: any) => p.x)
      const ys = points.map((p: any) => p.y)
      const minX = Math.min(...xs)
      const maxX = Math.max(...xs)
      const minY = Math.min(...ys)
      const maxY = Math.max(...ys)
      return {
        id,
        type: pad.type,
        left: minX,
        right: maxX,
        top: maxY,
        bottom: minY,
      }
    }
  }
  if (pad.type === "pcb_plated_hole") {
    const id = pad.pcb_plated_hole_id
    const x = pad.x
    const y = pad.y
    if (pad.shape === "circle") {
      const d = pad.outer_diameter
      return {
        id,
        type: pad.type,
        left: x - d / 2,
        right: x + d / 2,
        top: y + d / 2,
        bottom: y - d / 2,
      }
    }
    if (pad.shape === "oval" || pad.shape === "pill") {
      const w = pad.outer_width
      const h = pad.outer_height
      return {
        id,
        type: pad.type,
        left: x - w / 2,
        right: x + w / 2,
        top: y + h / 2,
        bottom: y - h / 2,
      }
    }
    if (
      pad.shape === "circular_hole_with_rect_pad" ||
      pad.shape === "pill_hole_with_rect_pad"
    ) {
      const w = pad.rect_pad_width
      const h = pad.rect_pad_height
      return {
        id,
        type: pad.type,
        left: x - w / 2,
        right: x + w / 2,
        top: y + h / 2,
        bottom: y - h / 2,
      }
    }
  }
  return null
}

export interface PadOverlap {
  pad1: PadBounds
  pad2: PadBounds
}

/**
 * Detect overlapping PCB pads. Returns list of overlapping pairs.
 */
export function findOverlappingPads(soup: any[]): PadOverlap[] {
  const pads = soup.filter(
    (e) => e.type === "pcb_smtpad" || e.type === "pcb_plated_hole",
  )
  const bounds = pads
    .map((p) => getPadBounds(p))
    .filter((b): b is PadBounds => b !== null)

  const overlaps: PadOverlap[] = []
  for (let i = 0; i < bounds.length; i++) {
    const a = bounds[i]
    for (let j = i + 1; j < bounds.length; j++) {
      const b = bounds[j]
      if (
        a.left < b.right &&
        a.right > b.left &&
        a.bottom < b.top &&
        a.top > b.bottom
      ) {
        overlaps.push({ pad1: a, pad2: b })
      }
    }
  }
  return overlaps
}
