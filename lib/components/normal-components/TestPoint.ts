import { testpointProps } from "@tscircuit/props"
import { NormalComponent } from "../base-components/NormalComponent/NormalComponent"
import {
  FTYPE,
  type BaseSymbolName,
  type PassivePorts,
} from "lib/utils/constants"
import type {
  PcbSmtPad,
  PcbPlatedHoleCircle,
  PcbSmtPadRect,
} from "circuit-json"
export class TestPoint extends NormalComponent<
  typeof testpointProps,
  PassivePorts
> {
  pcb_smtpad_id: string | null = null
  pcb_plated_hole_id: string | null = null
  get config() {
    return {
      componentName: "TestPoint",
      schematicSymbolName: (this.props.symbolName ??
        ("testpoint" as BaseSymbolName)) as BaseSymbolName,
      zodProps: testpointProps,
      shouldRenderAsSchematicBox: false,
    }
  }

  doInitialSourceRender() {
    const { db } = this.root!
    const { _parsedProps: props } = this

    const source_component = db.source_component.insert({
      ftype: "simple_test_point",
      name: props.name,
      width: props.width,
      height: props.height,
      hole_diameter: props.holeDiameter,
      pad_shape: props.padShape,
      footprint_variant: props.footprintVariant,
      supplier_part_numbers: props.supplierPartNumbers,
      are_pins_interchangeable: false,
    } as any)
    this.source_component_id = source_component.source_component_id

    const pcb_component_id = source_component.source_component_id
    const port_hints = [props.name ?? "tp1"]
    const position = { x: 0, y: 0 }
    const pcb_group_id = undefined
    const subcircuit = undefined

    if (props.footprintVariant === "pad") {
      if (props.padShape === "rect") {
        const pad = db.pcb_smtpad.insert({
          pcb_component_id,
          shape: "rect",
          width: props.width ?? props.padDiameter ?? 1,
          height: props.height ?? props.padDiameter ?? 1,
          layer: props.layer ?? "top",
          port_hints,
          x: position.x,
          y: position.y,
          pcb_group_id,
        } as PcbSmtPadRect) as PcbSmtPadRect
        this.pcb_smtpad_id = pad.pcb_smtpad_id
      } else {
        const pad = db.pcb_smtpad.insert({
          pcb_component_id,
          shape: "circle",
          radius: (props.padDiameter ?? 1) / 2,
          layer: props.layer ?? "top",
          port_hints,
          x: position.x,
          y: position.y,
          pcb_group_id,
        } as PcbSmtPad) as PcbSmtPad
        this.pcb_smtpad_id = pad.pcb_smtpad_id
      }
    } else {
      // through_hole
      const plated = db.pcb_plated_hole.insert({
        shape: "circle" as const,
        outer_diameter: props.padDiameter ?? props.holeDiameter ?? 1,
        hole_diameter: props.holeDiameter ?? 0.8,
        x: position.x,
        y: position.y,
        layers: ["top", "bottom"],
        port_hints,
        pcb_group_id,
      } as PcbPlatedHoleCircle) as PcbPlatedHoleCircle
      this.pcb_plated_hole_id = plated.pcb_plated_hole_id
    }
  }
}
