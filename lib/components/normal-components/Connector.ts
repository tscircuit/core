import { guessCableInsertCenter } from "@tscircuit/infer-cable-insertion-point"
import { chipProps } from "@tscircuit/props"
import type { SourceSimpleConnector } from "circuit-json"
import { Chip } from "./Chip"

export class Connector<
  PinLabels extends string = never,
> extends Chip<PinLabels> {
  get config() {
    return {
      componentName: "Connector",
      zodProps: chipProps,
      shouldRenderAsSchematicBox: true,
    }
  }

  doInitialSourceRender(): void {
    const { db } = this.root!
    const { _parsedProps: props } = this

    const source_component = db.source_component.insert({
      ftype: "simple_connector",
      name: this.name,
      manufacturer_part_number: props.manufacturerPartNumber,
      supplier_part_numbers: props.supplierPartNumbers,
      display_name: props.displayName,
      standard: (props as any).standard,
    } as SourceSimpleConnector)

    this.source_component_id = source_component.source_component_id!
  }

  doInitialPcbComponentSizeCalculation(): void {
    super.doInitialPcbComponentSizeCalculation()
    if (this.root?.pcbDisabled) return
    if (!this.pcb_component_id || !this.source_component_id) return

    const { db } = this.root!
    const connectorCircuitJson = db.toArray().filter((elm: any) => {
      if (elm.type === "pcb_component") {
        return elm.pcb_component_id === this.pcb_component_id
      }
      if (elm.type === "source_component") {
        return elm.source_component_id === this.source_component_id
      }
      if (
        "pcb_component_id" in elm &&
        elm.pcb_component_id === this.pcb_component_id
      ) {
        return true
      }
      if (
        "source_component_id" in elm &&
        elm.source_component_id === this.source_component_id
      ) {
        return true
      }
      return false
    })

    if (connectorCircuitJson.length === 0) return

    const inferredInsertionCenter = guessCableInsertCenter(
      connectorCircuitJson as any,
    )

    db.pcb_component.update(this.pcb_component_id, {
      cable_insertion_center: {
        x: inferredInsertionCenter.x,
        y: inferredInsertionCenter.y,
      },
    })
  }
}
