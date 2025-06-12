import { testpointProps } from "@tscircuit/props"
import { NormalComponent } from "../base-components/NormalComponent/NormalComponent"
import { Port } from "../primitive-components/Port"
import type {
  PcbSmtPad,
  PcbPlatedHoleCircle,
  PcbSmtPadRect,
  PcbSmtPadCircle,
  SourceSimpleTestPointInput,
} from "circuit-json"
import type { BaseSymbolName } from "lib/utils/constants"

export class Testpoint extends NormalComponent<typeof testpointProps> {
  pcb_component_id: string | null = null
  pcb_smtpad_id: string | null = null
  pcb_plated_hole_id: string | null = null

  get config() {
    return {
      componentName: "Testpoint",
      zodProps: testpointProps,
      schematicSymbolName:
        this.props.symbolName ?? ("testpoint" as BaseSymbolName),
    }
  }

  initPorts() {
    super.initPorts({
      additionalAliases: {
        pin1: ["pin1"],
      },
    })
  }

  getPcbSize(): { width: number; height: number } {
    const { _parsedProps: props } = this
    if (props.footprintVariant === "pad") {
      if (props.padShape === "rect") {
        return {
          width: props.width ?? props.padDiameter ?? 0,
          height: props.height ?? props.padDiameter ?? 0,
        }
      }
      const d = props.padDiameter ?? 0
      return { width: d, height: d }
    }
    const d = props.padDiameter ?? props.holeDiameter ?? 0
    return { width: d, height: d }
  }

  doInitialSourceRender(): void {
    const { db } = this.root!
    const { _parsedProps: props } = this
    const source_component = db.source_component.insert({
      ftype: "simple_test_point",
      name: props.name,
      footprint_variant: props.footprintVariant,
      pad_shape: props.padShape,
      pad_diameter: props.padDiameter,
      hole_diameter: props.holeDiameter,
      width: props.width,
      height: props.height,
      are_pins_interchangeable: true,
    } as SourceSimpleTestPointInput)
    this.source_component_id = source_component.source_component_id
  }

  doInitialPcbComponentRender() {
    if (this.root?.pcbDisabled) return
    const { db } = this.root!
    const { _parsedProps: props } = this
    const size = this.getPcbSize()
    const pcb_component = db.pcb_component.insert({
      center: { x: props.pcbX ?? 0, y: props.pcbY ?? 0 },
      width: size.width,
      height: size.height,
      layer: props.layer ?? "top",
      rotation: props.pcbRotation ?? 0,
      source_component_id: this.source_component_id!,
      subcircuit_id: this.getSubcircuit().subcircuit_id ?? undefined,
    })
    this.pcb_component_id = pcb_component.pcb_component_id
  }

  doInitialPcbPrimitiveRender(): void {
    if (this.root?.pcbDisabled) return
    const { db } = this.root!
    const { _parsedProps: props } = this
    const position = this._getGlobalPcbPositionBeforeLayout()
    const subcircuit = this.getSubcircuit()
    const pcb_group_id = this.getGroup()?.pcb_group_id ?? undefined
    if (props.footprintVariant === "pad") {
      if (props.padShape === "rect") {
        const pad = db.pcb_smtpad.insert({
          pcb_component_id: this.pcb_component_id!,
          shape: "rect",
          width: props.width ?? props.padDiameter!,
          height: props.height ?? props.padDiameter!,
          layer: props.layer ?? "top",
          port_hints: [],
          x: position.x,
          y: position.y,
          subcircuit_id: subcircuit?.subcircuit_id ?? undefined,
          pcb_group_id,
        } as Omit<PcbSmtPadRect, "type" | "pcb_smtpad_id">) as PcbSmtPadRect
        this.pcb_smtpad_id = pad.pcb_smtpad_id
      } else {
        const pad = db.pcb_smtpad.insert({
          pcb_component_id: this.pcb_component_id!,
          shape: "circle",
          radius: (props.padDiameter ?? 0) / 2,
          layer: props.layer ?? "top",
          port_hints: [],
          x: position.x,
          y: position.y,
          subcircuit_id: subcircuit?.subcircuit_id ?? undefined,
          pcb_group_id,
        } as Omit<PcbSmtPadCircle, "type" | "pcb_smtpad_id">) as PcbSmtPad
        this.pcb_smtpad_id = pad.pcb_smtpad_id
      }
    } else {
      const plated = db.pcb_plated_hole.insert({
        pcb_component_id: this.pcb_component_id!,
        shape: "circle" as const,
        outer_diameter: props.padDiameter ?? props.holeDiameter!,
        hole_diameter: props.holeDiameter!,
        x: position.x,
        y: position.y,
        layers: ["top", "bottom"],
        port_hints: [],
        subcircuit_id: subcircuit?.subcircuit_id ?? undefined,
        pcb_group_id,
      } as Omit<
        PcbPlatedHoleCircle,
        "type" | "pcb_plated_hole_id"
      >) as PcbPlatedHoleCircle
      this.pcb_plated_hole_id = plated.pcb_plated_hole_id
    }
  }

  _setPositionFromLayout(newCenter: { x: number; y: number }) {
    const { db } = this.root!
    if (this.pcb_component_id) {
      db.pcb_component.update(this.pcb_component_id, { center: newCenter })
    }
    if (this.pcb_smtpad_id) {
      db.pcb_smtpad.update(this.pcb_smtpad_id, {
        x: newCenter.x,
        y: newCenter.y,
      })
    }
    if (this.pcb_plated_hole_id) {
      db.pcb_plated_hole.update(this.pcb_plated_hole_id, {
        x: newCenter.x,
        y: newCenter.y,
      })
    }
  }
}
