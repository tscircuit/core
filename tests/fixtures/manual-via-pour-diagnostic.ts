import { BooleanOperations, Circle, Point, Polygon } from "@flatten-js/core"
import { checkCopperPourShorts } from "@tscircuit/checks"
import { getPourPolygon } from "@tscircuit/circuit-json-util"
import type { AnyCircuitElement } from "circuit-json"
import type { RootCircuit } from "lib/RootCircuit"
import { getAutoroutedViaLayers } from "lib/utils/getViaSpanLayers"

/**
 * Independent physical diagnostic in board-world XY (mm, +X right/+Y up).
 * Only the compiled manual via's layer span is resolved from the declared board
 * policy. XY, land/drill diameters, logical route points and solved pours stay
 * unchanged. This exposes a short hidden by the defective emitted via metadata.
 */
export function getManualViaPourDiagnostic(circuit: RootCircuit) {
  const compiled = circuit.getCircuitJson()
  const board = circuit.db.pcb_board.list()[0]!
  const vias = circuit.db.pcb_via.list().filter((via) => via.pcb_trace_id)
  const viaIds = new Set(vias.map((via) => via.pcb_via_id))
  const physical: AnyCircuitElement[] = compiled.map((element) =>
    element.type === "pcb_via" && viaIds.has(element.pcb_via_id)
      ? {
          ...element,
          layers: getAutoroutedViaLayers({
            fromLayer: element.from_layer!,
            toLayer: element.to_layer!,
            layerCount: board.num_layers,
            allowBlindAndBuriedVias: board.allow_blind_and_buried_vias ?? false,
          }),
        }
      : element,
  )
  const pours = circuit.db.pcb_copper_pour
    .list()
    .filter((pour) => pour.layer === "bottom")
  let foreignLandOverlapArea = 0
  for (const via of physical) {
    if (
      via.type !== "pcb_via" ||
      !viaIds.has(via.pcb_via_id) ||
      !via.layers.includes("bottom")
    )
      continue
    const center = new Point(via.x, via.y)
    const land = new Polygon(new Circle(center, via.outer_diameter / 2))
    const drill = new Polygon(new Circle(center, via.hole_diameter / 2))
    const annulus = BooleanOperations.subtract(land, drill)
    for (const pour of pours) {
      foreignLandOverlapArea += BooleanOperations.intersect(
        getPourPolygon(pour),
        annulus,
      ).area()
    }
  }
  const physicalDrc = checkCopperPourShorts(physical)
  const reportTemplate = compiled.find(
    (element) => element.type === "pcb_note_text",
  )!
  const snapshot = [
    // Project vias onto BOTTOM explicitly: the SVG renderer otherwise draws
    // every via even when a blind/buried land is absent from the viewed layer.
    ...physical.filter((element) => {
      if (element.type === "pcb_via") return element.layers.includes("bottom")
      if (element.type === "pcb_trace") {
        return element.route.some(
          (point) => point.route_type === "wire" && point.layer === "bottom",
        )
      }
      return true
    }),
    {
      ...reportTemplate,
      pcb_note_text_id: `${reportTemplate.pcb_note_text_id}_physical_report`,
      anchor_position: { x: 0, y: -4.2 },
      text: `Physical check: ${physicalDrc.length} GND shorts / ${foreignLandOverlapArea.toFixed(3)} mm2 land overlap`,
      font_size: 0.4,
      color: physicalDrc.length ? "#ff5555" : "#00dd88",
    },
  ]
  return {
    compiled,
    physical,
    vias,
    pours,
    foreignLandOverlapArea,
    compiledDrc: checkCopperPourShorts(compiled),
    physicalDrc,
    snapshot,
  }
}
