import type { PcbFabricationNotePath, SourcePort } from "circuit-json"
import { applyToPoint, compose, rotate, translate } from "transformation-matrix"
import type { Led } from "./Led"

const generatedNotes = new WeakMap<Led, PcbFabricationNotePath[]>()

const getPolarity = (port: SourcePort) => {
  const hints = [port.name, ...(port.port_hints ?? [])].map((hint) =>
    hint.toLowerCase().replace(/[^a-z0-9+-]/g, ""),
  )
  const anode = hints.some((hint) =>
    ["a", "anode", "pos", "positive", "+"].includes(hint),
  )
  const cathode = hints.some((hint) =>
    ["k", "c", "cathode", "neg", "negative", "-"].includes(hint),
  )
  if (anode === cathode) return null
  return anode ? "anode" : "cathode"
}

/**
 * Adds a fabrication-only diode symbol using emitted PCB port positions.
 * Positions are points in right-handed board/world coordinates (mm), +X right,
 * +Y up, +Z above the PCB. The diode axis is the direction from A to K, derived
 * after footprint rotation and layer mirroring; no second layer flip is applied.
 */
export const Led_addPolarityFabricationSymbol = (led: Led): void => {
  const root = led.root
  if (!root) return
  const { db } = root
  const previous = generatedNotes.get(led)
  for (const path of previous ?? []) {
    db.pcb_fabrication_note_path.delete(path.pcb_fabrication_note_path_id)
  }
  generatedNotes.delete(led)
  if (root.pcbDisabled || !led.pcb_component_id) return
  const pcb = db.pcb_component.get(led.pcb_component_id)
  if (!pcb || (pcb.layer !== "top" && pcb.layer !== "bottom")) return

  const ports = db.source_port.list({
    source_component_id: led.source_component_id!,
  })
  const anodes = ports.filter((port) => getPolarity(port) === "anode")
  const cathodes = ports.filter((port) => getPolarity(port) === "cathode")
  if (anodes.length !== 1 || cathodes.length !== 1) return
  const anode = anodes[0]!
  const cathode = cathodes[0]!
  const a = db.pcb_port.getWhere({ source_port_id: anode.source_port_id })
  const k = db.pcb_port.getWhere({ source_port_id: cathode.source_port_id })
  if (!a || !k) return
  const distance = Math.hypot(k.x - a.x, k.y - a.y)
  if (distance < 1e-6) return

  const angle = Math.atan2(k.y - a.y, k.x - a.x)
  const frame = compose(
    translate((a.x + k.x) / 2, (a.y + k.y) / 2),
    rotate(angle),
  )
  const point = (x: number, y: number) => applyToPoint(frame, { x, y })
  const common = {
    pcb_component_id: pcb.pcb_component_id,
    subcircuit_id: led.getSubcircuit()?.subcircuit_id ?? undefined,
    layer: pcb.layer,
  }
  const notes: PcbFabricationNotePath[] = []
  generatedNotes.set(led, notes)

  const halfLength = Math.min(distance * 0.2, 0.4)
  const halfHeight = halfLength * 0.75
  const routes = [
    [point(-distance / 2, 0), point(-halfLength, 0)],
    [
      point(-halfLength, -halfHeight),
      point(halfLength, 0),
      point(-halfLength, halfHeight),
      point(-halfLength, -halfHeight),
    ],
    [point(halfLength, -halfHeight), point(halfLength, halfHeight)],
    [point(halfLength, 0), point(distance / 2, 0)],
  ]
  for (const route of routes) {
    notes.push(
      db.pcb_fabrication_note_path.insert({
        ...common,
        route,
        stroke_width: 0.08,
      }),
    )
  }
}
