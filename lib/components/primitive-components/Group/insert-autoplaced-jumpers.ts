import type { LayerRef, PcbSmtPadRect } from "circuit-json"
import type { CircuitJsonUtilObjects } from "@tscircuit/circuit-json-util"

export interface AutoplacedJumper {
  jumper_footprint: string
  center: { x: number; y: number }
  orientation: string
  width?: number
  height?: number
  pads: Array<{
    center: { x: number; y: number }
    width: number
    height: number
    layer?: string
    layers?: string[]
  }>
}

/**
 * Insert autoplaced jumpers into the database without giving them explicit names
 * to avoid conflicts with user-specified component names.
 */
export function insertAutoplacedJumpers(params: {
  db: CircuitJsonUtilObjects
  output_jumpers: AutoplacedJumper[]
  subcircuit_id?: string | null
}): void {
  const { db, output_jumpers, subcircuit_id } = params

  for (
    let jumperIndex = 0;
    jumperIndex < output_jumpers.length;
    jumperIndex++
  ) {
    const jumper = output_jumpers[jumperIndex]
    const sourceComponent = db.source_component.insert({
      ftype: "simple_chip",
      // Use internal naming convention to avoid conflicts with user-specified names
      name: `__autoplaced_jumper_${jumperIndex}`,
      supplier_part_numbers: {},
    })

    // Calculate rotation from orientation
    const rotation = jumper.orientation === "horizontal" ? 0 : 90

    // Get layer from first pad - may be `layer` string or `layers` array
    const firstPadLayer =
      jumper.pads[0]?.layer || jumper.pads[0]?.layers?.[0] || "top"

    const pcbComponent = db.pcb_component.insert({
      source_component_id: sourceComponent.source_component_id,
      center: jumper.center,
      rotation,
      layer: firstPadLayer as LayerRef,
      width: jumper.width || 0,
      height: jumper.height || 0,
      obstructs_within_bounds: false,
    })

    // Create all pads from the jumper
    for (const pad of jumper.pads) {
      // Get layer from pad - may be `layer` string or `layers` array
      const padLayer = pad.layer || pad.layers?.[0] || "top"
      db.pcb_smtpad.insert({
        pcb_component_id: pcbComponent.pcb_component_id,
        shape: "rect",
        x: pad.center.x,
        y: pad.center.y,
        width: pad.width,
        height: pad.height,
        layer: padLayer as LayerRef,
      } as PcbSmtPadRect)
    }
  }
}
