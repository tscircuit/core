import type {
  PcbFabricationNotePath,
  PcbFabricationNoteText,
  SourcePort,
} from "circuit-json"
import { applyToPoint, compose, rotate, translate } from "transformation-matrix"
import type { Diode } from "./Diode"

const generatedNotes = new WeakMap<
  Diode,
  { paths: PcbFabricationNotePath[]; labels: PcbFabricationNoteText[] }
>()

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
 * Adds fallback assembly artwork when a diode footprint supplies no fabrication
 * notes. Geometry uses emitted PCB port points in right-handed board/world mm:
 * +X right, +Y toward the board's top, +Z above the PCB. The local symbol's +X
 * direction runs from anode to cathode; emitted ports already include footprint
 * rotation and layer mirroring, so no additional layer flip is applied.
 */
export const Diode_addPolarityFabricationNotes = (diode: Diode): void => {
  const root = diode.root
  if (!root) return
  const { db } = root
  const previous = generatedNotes.get(diode)
  for (const path of previous?.paths ?? []) {
    db.pcb_fabrication_note_path.delete(path.pcb_fabrication_note_path_id)
  }
  for (const label of previous?.labels ?? []) {
    db.pcb_fabrication_note_text.delete(label.pcb_fabrication_note_text_id)
  }
  generatedNotes.delete(diode)
  if (root.pcbDisabled || !diode.pcb_component_id) return
  const pcb = db.pcb_component.get(diode.pcb_component_id)
  if (!pcb || (pcb.layer !== "top" && pcb.layer !== "bottom")) return

  // Existing footprint/user artwork remains authoritative; do not overlay a
  // second symbol on named diode footprints or imported fabrication drawings.
  const filter = { pcb_component_id: pcb.pcb_component_id }
  if (
    db.pcb_fabrication_note_path.list(filter).length ||
    db.pcb_fabrication_note_text.list(filter).length ||
    db.pcb_fabrication_note_rect.list(filter).length ||
    db.pcb_fabrication_note_dimension.list(filter).length
  ) {
    return
  }

  const ports = db.source_port.list({
    source_component_id: diode.source_component_id!,
  })
  const anodes = ports.filter((port) => getPolarity(port) === "anode")
  const cathodes = ports.filter((port) => getPolarity(port) === "cathode")
  if (anodes.length !== 1 || cathodes.length !== 1) return
  const anode = db.pcb_port.getWhere({
    source_port_id: anodes[0]!.source_port_id,
  })
  const cathode = db.pcb_port.getWhere({
    source_port_id: cathodes[0]!.source_port_id,
  })
  if (!anode || !cathode) return
  const distance = Math.hypot(cathode.x - anode.x, cathode.y - anode.y)
  if (distance < 1e-6) return

  // Same board-space frame as Led_addPolarityFabricationSymbol: orient from
  // the emitted A/K pair, rather than reconstructing pcbRotation/layer rules.
  const frame = compose(
    translate((anode.x + cathode.x) / 2, (anode.y + cathode.y) / 2),
    rotate(Math.atan2(cathode.y - anode.y, cathode.x - anode.x)),
  )
  const point = (x: number, y: number) => applyToPoint(frame, { x, y })
  const common = {
    pcb_component_id: pcb.pcb_component_id,
    subcircuit_id: diode.getSubcircuit()?.subcircuit_id ?? undefined,
    layer: pcb.layer,
  }
  const notes = {
    paths: [] as PcbFabricationNotePath[],
    labels: [] as PcbFabricationNoteText[],
  }
  generatedNotes.set(diode, notes)
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
    notes.paths.push(
      db.pcb_fabrication_note_path.insert({
        ...common,
        route,
        stroke_width: Math.min(0.08, halfLength * 0.2),
      }),
    )
  }
  for (const [text, terminal] of [
    ["+", anode],
    ["-", cathode],
  ] as const) {
    notes.labels.push(
      db.pcb_fabrication_note_text.insert({
        ...common,
        text,
        font: "tscircuit2024",
        font_size: Math.min(distance * 0.25, 0.45),
        anchor_alignment: "center",
        anchor_position: { x: terminal.x, y: terminal.y },
        ccw_rotation: 0,
      }),
    )
  }
}
