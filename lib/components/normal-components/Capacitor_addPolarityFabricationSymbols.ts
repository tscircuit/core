import type { PcbFabricationNotePath, SourcePort } from "circuit-json"
import { applyToPoint, compose, rotate, translate } from "transformation-matrix"
import type { Capacitor } from "./Capacitor"

const generatedPaths = new WeakMap<Capacitor, PcbFabricationNotePath[]>()

const getPolarity = (port: SourcePort) => {
  const hints = [port.name, ...(port.port_hints ?? [])].map((hint) =>
    hint.toLowerCase().replace(/[^a-z0-9+-]/g, ""),
  )
  const positive = hints.some((hint) =>
    ["a", "anode", "pos", "positive", "+"].includes(hint),
  )
  const negative = hints.some((hint) =>
    ["k", "cathode", "neg", "negative", "-"].includes(hint),
  )
  if (positive === negative) return null
  return positive ? "positive" : "negative"
}

/**
 * Draws compact +/- fabrication symbols using emitted PCB port points in
 * right-handed board/world coordinates: mm, +X right, +Y up, +Z above the PCB.
 * The positive-to-negative direction already includes footprint rotation and
 * layer mirroring. Only the local symbol geometry is transformed into that frame.
 */
export const Capacitor_addPolarityFabricationSymbols = (
  capacitor: Capacitor,
): void => {
  const root = capacitor.root
  if (!root) return
  const { db } = root
  for (const path of generatedPaths.get(capacitor) ?? []) {
    db.pcb_fabrication_note_path.delete(path.pcb_fabrication_note_path_id)
  }
  generatedPaths.delete(capacitor)
  if (
    root.pcbDisabled ||
    !capacitor.props.polarized ||
    !capacitor.pcb_component_id
  )
    return
  const pcb = db.pcb_component.get(capacitor.pcb_component_id)
  if (!pcb || (pcb.layer !== "top" && pcb.layer !== "bottom")) return
  const ports = db.source_port.list({
    source_component_id: capacitor.source_component_id!,
  })
  const positives = ports.filter((port) => getPolarity(port) === "positive")
  const negatives = ports.filter((port) => getPolarity(port) === "negative")
  if (positives.length !== 1 || negatives.length !== 1) return
  const positive = db.pcb_port.getWhere({
    source_port_id: positives[0]!.source_port_id,
  })
  const negative = db.pcb_port.getWhere({
    source_port_id: negatives[0]!.source_port_id,
  })
  if (!positive || !negative) return
  const distance = Math.hypot(negative.x - positive.x, negative.y - positive.y)
  if (distance < 1e-6) return
  const frame = compose(
    translate((positive.x + negative.x) / 2, (positive.y + negative.y) / 2),
    rotate(Math.atan2(negative.y - positive.y, negative.x - positive.x)),
  )
  const point = (x: number, y: number) => applyToPoint(frame, { x, y })
  // Keep both signs between the pad centers rather than outside the footprint.
  const offset = distance / 4
  const halfSize = Math.min(distance * 0.12, 0.3)
  const routes = [
    [point(-offset - halfSize, 0), point(-offset + halfSize, 0)],
    [point(-offset, -halfSize), point(-offset, halfSize)],
    [point(offset - halfSize, 0), point(offset + halfSize, 0)],
  ]
  const paths: PcbFabricationNotePath[] = []
  generatedPaths.set(capacitor, paths)
  for (const route of routes) {
    paths.push(
      db.pcb_fabrication_note_path.insert({
        pcb_component_id: pcb.pcb_component_id,
        subcircuit_id: capacitor.getSubcircuit()?.subcircuit_id ?? undefined,
        layer: pcb.layer,
        route,
        stroke_width: Math.min(0.08, halfSize * 0.4),
      }),
    )
  }
}
