import type { LayerRef } from "circuit-json"
import { z } from "zod"
import { PrimitiveComponent } from "../base-components/PrimitiveComponent"

const importedPcbComponentProps = z.object({
  doNotPlace: z.boolean().optional(),
  height: z.number().optional(),
  layer: z.custom<LayerRef>().optional(),
  name: z.string().optional(),
  obstructsWithinBounds: z.boolean().optional(),
  pcbRotation: z.number().optional(),
  pcbX: z.number().optional(),
  pcbY: z.number().optional(),
  width: z.number().optional(),
})

export class ImportedPcbComponent extends PrimitiveComponent<
  typeof importedPcbComponentProps
> {
  isPrimitiveContainer = true

  get config() {
    return {
      componentName: "ImportedPcbComponent",
      sourceFtype: "simple_fiducial" as const,
      zodProps: importedPcbComponentProps,
    }
  }

  protected _getPcbComponentLayer(): LayerRef | undefined {
    return this._parsedProps.layer
  }

  doInitialSourceRender() {
    const { db } = this.root!
    const sourceComponent = db.source_component.insert({
      ftype: "simple_fiducial",
      name: this.name,
    })

    this.source_component_id = sourceComponent.source_component_id
  }

  doInitialPcbComponentRender() {
    if (this.root?.pcbDisabled) return
    const { db } = this.root!
    const { _parsedProps: props } = this
    const { pcbX = 0, pcbY = 0 } = this.getResolvedPcbPositionProp()

    const pcbComponent = db.pcb_component.insert({
      center: { x: pcbX, y: pcbY },
      width: props.width ?? 0,
      height: props.height ?? 0,
      layer: props.layer ?? "top",
      rotation: props.pcbRotation ?? 0,
      source_component_id: this.source_component_id!,
      subcircuit_id: this.getSubcircuit().subcircuit_id ?? undefined,
      pcb_group_id: this.getGroup()?.pcb_group_id ?? undefined,
      do_not_place: props.doNotPlace ?? false,
      obstructs_within_bounds: props.obstructsWithinBounds ?? true,
    })

    this.pcb_component_id = pcbComponent.pcb_component_id
  }
}
