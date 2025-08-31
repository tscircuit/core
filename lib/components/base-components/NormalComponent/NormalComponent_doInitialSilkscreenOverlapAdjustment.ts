import type { NormalComponent } from "./NormalComponent"

/**
 * Relocate passive component reference designators if the default
 * silkscreen placement overlaps with another component's bounds.
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

  const components = db.pcb_component.list()

  const getAabb = (c: any) => {
    const rotation = ((c.rotation ?? 0) * Math.PI) / 180
    const width = c.width ?? 0
    const height = c.height ?? 0
    const wRot =
      Math.abs(width * Math.cos(rotation)) +
      Math.abs(height * Math.sin(rotation))
    const hRot =
      Math.abs(width * Math.sin(rotation)) +
      Math.abs(height * Math.cos(rotation))
    return {
      left: c.center.x - wRot / 2,
      right: c.center.x + wRot / 2,
      bottom: c.center.y - hRot / 2,
      top: c.center.y + hRot / 2,
    }
  }

  const componentBounds = new Map<string, any>()
  for (const c of components) {
    componentBounds.set(c.pcb_component_id, getAabb(c))
  }

  const pads = [
    ...db.pcb_smtpad.list(),
    ...(db.pcb_plated_hole ? db.pcb_plated_hole.list() : []),
  ]

  const getPadAabb = (p: any) => {
    if (p.shape === "circle") {
      const r = (p.radius ?? p.outer_diameter / 2) || 0
      return {
        left: p.x - r,
        right: p.x + r,
        bottom: p.y - r,
        top: p.y + r,
      }
    }
    if (p.shape === "rect") {
      return {
        left: p.x - p.width / 2,
        right: p.x + p.width / 2,
        bottom: p.y - p.height / 2,
        top: p.y + p.height / 2,
      }
    }
    if (p.shape === "rotated_rect") {
      const rotation = ((p.ccw_rotation ?? 0) * Math.PI) / 180
      const wRot =
        Math.abs(p.width * Math.cos(rotation)) +
        Math.abs(p.height * Math.sin(rotation))
      const hRot =
        Math.abs(p.width * Math.sin(rotation)) +
        Math.abs(p.height * Math.cos(rotation))
      return {
        left: p.x - wRot / 2,
        right: p.x + wRot / 2,
        bottom: p.y - hRot / 2,
        top: p.y + hRot / 2,
      }
    }
    if (p.shape === "oval" || p.shape === "pill") {
      return {
        left: p.x - p.outer_width / 2,
        right: p.x + p.outer_width / 2,
        bottom: p.y - p.outer_height / 2,
        top: p.y + p.outer_height / 2,
      }
    }
    if ("rect_pad_width" in p && "rect_pad_height" in p) {
      const rotation = ((p.rect_ccw_rotation ?? 0) * Math.PI) / 180
      const wRot =
        Math.abs(p.rect_pad_width * Math.cos(rotation)) +
        Math.abs(p.rect_pad_height * Math.sin(rotation))
      const hRot =
        Math.abs(p.rect_pad_width * Math.sin(rotation)) +
        Math.abs(p.rect_pad_height * Math.cos(rotation))
      return {
        left: p.x - wRot / 2,
        right: p.x + wRot / 2,
        bottom: p.y - hRot / 2,
        top: p.y + hRot / 2,
      }
    }
    return { left: p.x, right: p.x, top: p.y, bottom: p.y }
  }

  const padBounds = pads.map(getPadAabb)

  const boxesOverlap = (a: any, b: any) =>
    !(
      a.right < b.left ||
      a.left > b.right ||
      a.top < b.bottom ||
      a.bottom > b.top
    )

  const text = db.pcb_silkscreen_text
    .list()
    .find(
      (t) =>
        t.pcb_component_id === comp.pcb_component_id &&
        t.text === component.name,
    )

  if (!text) return

  const fontSize = text.font_size ?? 1
  const textWidth = (text.text?.length ?? 0) * fontSize
  const textHeight = fontSize
  const currentBounds = {
    left: text.anchor_position.x - textWidth / 2,
    right: text.anchor_position.x + textWidth / 2,
    bottom: text.anchor_position.y - textHeight / 2,
    top: text.anchor_position.y + textHeight / 2,
  }

  let overlaps = padBounds.some((pb) => boxesOverlap(currentBounds, pb))
  if (!overlaps) {
    for (const other of components) {
      if (other.pcb_component_id === comp.pcb_component_id) continue
      const otherBounds = componentBounds.get(other.pcb_component_id)
      if (boxesOverlap(currentBounds, otherBounds)) {
        overlaps = true
        break
      }
    }
  }
  if (!overlaps) return

  const compBounds = componentBounds.get(comp.pcb_component_id)
  const margin = 0.2
  const cx = (compBounds.left + compBounds.right) / 2
  const cy = (compBounds.top + compBounds.bottom) / 2
  const candidates = [
    { x: cx, y: compBounds.top + textHeight / 2 + margin },
    { x: cx, y: compBounds.bottom - textHeight / 2 - margin },
    { x: compBounds.right + textWidth / 2 + margin, y: cy },
    { x: compBounds.left - textWidth / 2 - margin, y: cy },
  ]

  for (const cand of candidates) {
    const candBounds = {
      left: cand.x - textWidth / 2,
      right: cand.x + textWidth / 2,
      bottom: cand.y - textHeight / 2,
      top: cand.y + textHeight / 2,
    }
    let candOverlaps = padBounds.some((pb) => boxesOverlap(candBounds, pb))
    if (!candOverlaps) {
      for (const other of components) {
        if (other.pcb_component_id === comp.pcb_component_id) continue
        const otherBounds = componentBounds.get(other.pcb_component_id)
        if (boxesOverlap(candBounds, otherBounds)) {
          candOverlaps = true
          break
        }
      }
    }
    if (!candOverlaps) {
      db.pcb_silkscreen_text.update(text.pcb_silkscreen_text_id, {
        anchor_position: { x: cand.x, y: cand.y },
      })
      break
    }
  }
}
