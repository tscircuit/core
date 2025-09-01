import type { NormalComponent } from "./NormalComponent"

/**
 * Auto-place passive refdes (R/C/L) so it doesn't overlap pads, silkscreen lines/text,
 * or other components on the same side/layer. If no free spot, keep original.
 */
export const NormalComponent_doInitialSilkscreenOverlapAdjustment = (
  component: NormalComponent<any>,
) => {
  const root = component.root
  if (!root || root.pcbDisabled) return
  const { db } = root

  const source = db.source_component.get(component.source_component_id!)
  const passiveFtypes = new Set([
    "simple_resistor",
    "simple_capacitor",
    "simple_inductor",
  ])
  if (!source || !passiveFtypes.has(source.ftype)) return

  if (!component.pcb_component_id) return
  const comp = db.pcb_component.get(component.pcb_component_id)
  if (!comp) return

  // --- helpers
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const inflate = (b: Aabb, k: number): Aabb => ({
    left: b.left - k,
    right: b.right + k,
    bottom: b.bottom - k,
    top: b.top + k,
  })
  const boxesOverlap = (a: Aabb, b: Aabb) =>
    !(
      a.right < b.left ||
      a.left > b.right ||
      a.top < b.bottom ||
      a.bottom > b.top
    )

  type Aabb = { left: number; right: number; top: number; bottom: number }

  // Determine the text object
  const text = db.pcb_silkscreen_text
    .list()
    .find(
      (t: any) =>
        t.pcb_component_id === comp.pcb_component_id &&
        t.text === component.name,
    )
  if (!text) return

  const textLayer = text.layer ?? "top" // "top" | "bottom" | ...
  const isTopText = textLayer === "top"
  const fontSize: number = (text as any).font_size ?? 1

  // More conservative width + clearance
  const GLYPH_WIDTH = 0.8 // ~monosans conservative avg
  const CLEARANCE = 0.2 // mm keepout around text
  const OBSTACLE_INFLATE = 0.1 // mm inflate obstacles

  const textWidth = Math.max(
    (text.text?.length ?? 0) * fontSize * GLYPH_WIDTH,
    fontSize,
  )
  const textHeight = fontSize

  const mkTextAabb = (x: number, y: number): Aabb => ({
    left: x - textWidth / 2,
    right: x + textWidth / 2,
    bottom: y - textHeight / 2,
    top: y + textHeight / 2,
  })
  const mkInflatedTextAabb = (x: number, y: number): Aabb =>
    inflate(mkTextAabb(x, y), CLEARANCE)

  // --- component AABBs (others)
  const components = db.pcb_component.list()
  const componentBounds = new Map<string, Aabb>()
  for (const c of components) {
    const rot = toRad(c.rotation ?? 0)
    const w = c.width ?? 0
    const h = c.height ?? 0
    const wRot = Math.abs(w * Math.cos(rot)) + Math.abs(h * Math.sin(rot))
    const hRot = Math.abs(w * Math.sin(rot)) + Math.abs(h * Math.cos(rot))
    componentBounds.set(c.pcb_component_id, {
      left: c.center.x - wRot / 2,
      right: c.center.x + wRot / 2,
      bottom: c.center.y - hRot / 2,
      top: c.center.y + hRot / 2,
    })
  }
  const myAabb = componentBounds.get(comp.pcb_component_id)
  if (!myAabb) return

  // --- pads (same side as text; TH collide always)
  const pads = [
    ...db.pcb_smtpad.list(),
    ...(db.pcb_plated_hole ? db.pcb_plated_hole.list() : []),
  ]

  const isSameSidePad = (p: any) => {
    // SMT pads typically have side or layer info; treat missing as both sides to be safe
    const side = p.side ?? p.layer ?? null
    if (
      p.type === "th" ||
      p.through_hole ||
      p.shape === "hole" ||
      "drill_diameter" in p
    )
      return true
    if (!side) return true // be safe if unknown
    return (
      (isTopText && (side === "top" || side === "both")) ||
      (!isTopText && (side === "bottom" || side === "both"))
    )
  }

  const getPadAabb = (p: any): Aabb => {
    // Return conservative AABB and inflate slightly
    if (p.shape === "circle") {
      const r = (p.radius ?? p.outer_diameter / 2) || 0
      return inflate(
        { left: p.x - r, right: p.x + r, bottom: p.y - r, top: p.y + r },
        OBSTACLE_INFLATE,
      )
    }
    if (p.shape === "rect") {
      const a = {
        left: p.x - p.width / 2,
        right: p.x + p.width / 2,
        bottom: p.y - p.height / 2,
        top: p.y + p.height / 2,
      }
      return inflate(a, OBSTACLE_INFLATE)
    }
    if (p.shape === "rotated_rect") {
      const rot = toRad(p.ccw_rotation ?? 0)
      const wRot =
        Math.abs(p.width * Math.cos(rot)) + Math.abs(p.height * Math.sin(rot))
      const hRot =
        Math.abs(p.width * Math.sin(rot)) + Math.abs(p.height * Math.cos(rot))
      const a = {
        left: p.x - wRot / 2,
        right: p.x + wRot / 2,
        bottom: p.y - hRot / 2,
        top: p.y + hRot / 2,
      }
      return inflate(a, OBSTACLE_INFLATE)
    }
    if (p.shape === "oval" || p.shape === "pill") {
      const a = {
        left: p.x - p.outer_width / 2,
        right: p.x + p.outer_width / 2,
        bottom: p.y - p.outer_height / 2,
        top: p.y + p.outer_height / 2,
      }
      return inflate(a, OBSTACLE_INFLATE)
    }
    if ("rect_pad_width" in p && "rect_pad_height" in p) {
      const rot = toRad(p.rect_ccw_rotation ?? 0)
      const wRot =
        Math.abs(p.rect_pad_width * Math.cos(rot)) +
        Math.abs(p.rect_pad_height * Math.sin(rot))
      const hRot =
        Math.abs(p.rect_pad_width * Math.sin(rot)) +
        Math.abs(p.rect_pad_height * Math.cos(rot))
      const a = {
        left: p.x - wRot / 2,
        right: p.x + wRot / 2,
        bottom: p.y - hRot / 2,
        top: p.y + hRot / 2,
      }
      return inflate(a, OBSTACLE_INFLATE)
    }
    return inflate(
      { left: p.x, right: p.x, bottom: p.y, top: p.y },
      OBSTACLE_INFLATE,
    )
  }

  const padBounds = pads.filter(isSameSidePad).map(getPadAabb)

  // --- silkscreen lines (same layer only)
  const lines = (
    db.pcb_silkscreen_line ? db.pcb_silkscreen_line.list() : []
  ).filter((ln: any) => (ln.layer ?? "top") === textLayer)
  const getLineAabb = (ln: any): Aabb => {
    const x1 = ln.start?.x ?? ln.x1 ?? 0
    const y1 = ln.start?.y ?? ln.y1 ?? 0
    const x2 = ln.end?.x ?? ln.x2 ?? 0
    const y2 = ln.end?.y ?? ln.y2 ?? 0
    const t = ln.stroke_width ?? ln.thickness ?? 0.15
    const a = {
      left: Math.min(x1, x2) - t / 2,
      right: Math.max(x1, x2) + t / 2,
      bottom: Math.min(y1, y2) - t / 2,
      top: Math.max(y1, y2) + t / 2,
    }
    return inflate(a, OBSTACLE_INFLATE)
  }
  const lineBounds = lines.map(getLineAabb)

  // --- other silkscreen texts (same layer; including other components)
  const otherTexts = db.pcb_silkscreen_text
    .list()
    .filter(
      (t: any) =>
        t.pcb_silkscreen_text_id !== text.pcb_silkscreen_text_id &&
        (t.layer ?? "top") === textLayer,
    )
  const getTextAabbConservative = (t: any): Aabb => {
    const fs: number = t.font_size ?? 1
    const width = Math.max((t.text?.length ?? 0) * fs * GLYPH_WIDTH, fs)
    const a = {
      left: t.anchor_position.x - width / 2,
      right: t.anchor_position.x + width / 2,
      bottom: t.anchor_position.y - fs / 2,
      top: t.anchor_position.y + fs / 2,
    }
    return inflate(a, OBSTACLE_INFLATE)
  }
  const otherTextBounds = otherTexts.map(getTextAabbConservative)

  // --- collision function
  const collides = (bb: Aabb) => {
    // pads
    for (const pb of padBounds) if (boxesOverlap(bb, pb)) return true
    // other components AABBs (except self)
    for (const other of components) {
      if (other.pcb_component_id === comp.pcb_component_id) continue
      const ob = componentBounds.get(other.pcb_component_id)
      if (ob && boxesOverlap(bb, ob)) return true
    }
    // silkscreen lines
    for (const lb of lineBounds) if (boxesOverlap(bb, lb)) return true
    // other texts
    for (const tb of otherTextBounds) if (boxesOverlap(bb, tb)) return true
    // also avoid overlapping THIS component's own silkscreen lines
    const myLines = lines.filter(
      (ln: any) => ln.pcb_component_id === comp.pcb_component_id,
    )
    for (const ln of myLines) if (boxesOverlap(bb, getLineAabb(ln))) return true
    return false
  }

  // --- keep current if clean
  const cur = mkInflatedTextAabb(text.anchor_position.x, text.anchor_position.y)
  if (!collides(cur)) return

  // --- candidate search: 16 directions × spiral radii
  const cx = (myAabb.left + myAabb.right) / 2
  const cy = (myAabb.top + myAabb.bottom) / 2

  const BASE_MARGIN = 0.25 // start a bit away from outline
  const MAX_RADIUS = 3.0 // mm
  const STEP = 0.35 // mm
  const DIRS = 16
  const angles = Array.from(
    { length: DIRS },
    (_, i) => (i * 2 * Math.PI) / DIRS,
  )

  // Start from just outside each side, then spiral out
  const initialRing: Array<{ x: number; y: number }> = [
    { x: cx, y: myAabb.top + textHeight / 2 + BASE_MARGIN }, // top (+y)
    { x: cx, y: myAabb.bottom - textHeight / 2 - BASE_MARGIN }, // bottom (-y)
    { x: myAabb.right + textWidth / 2 + BASE_MARGIN, y: cy }, // right (+x)
    { x: myAabb.left - textWidth / 2 - BASE_MARGIN, y: cy }, // left  (-x)
  ]

  // Try initial ring first (only check if 0.25mm-away spot is clear)
  for (const p of initialRing) {
    const bb = mkInflatedTextAabb(p.x, p.y)
    if (!collides(bb)) {
      db.pcb_silkscreen_text.update(text.pcb_silkscreen_text_id, {
        anchor_position: p,
      })
      return
    }
  }
  // Spiral search
  for (let r = BASE_MARGIN; r <= MAX_RADIUS; r += STEP) {
    for (const ang of angles) {
      const x = cx + r * Math.cos(ang)
      const y = cy + r * Math.sin(ang)
      const bb = mkInflatedTextAabb(x, y)
      if (!collides(bb)) {
        db.pcb_silkscreen_text.update(text.pcb_silkscreen_text_id, {
          anchor_position: { x, y },
        })
        return
      }
    }
  }

  // No safe spot: keep original
  return
}
