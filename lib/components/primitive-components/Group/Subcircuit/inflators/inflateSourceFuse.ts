import type { SourceSimpleFuse } from "circuit-json"
import { Fuse } from "lib/components/normal-components/Fuse"
import type { InflatorContext } from "../InflatorFn"
import { inflateFootprintComponent } from "./inflateFootprintComponent"
import { getInflatedPcbPlacement } from "./getInflatedPcbPlacement"

export function inflateSourceFuse(
  sourceFuse: SourceSimpleFuse,
  inflatorContext: InflatorContext,
) {
  const { injectionDb, subcircuit, groupsMap } = inflatorContext
  const pcbComponent = injectionDb.pcb_component.getWhere({
    source_component_id: sourceFuse.source_component_id,
  })
  const { pcbX, pcbY } = getInflatedPcbPlacement({
    pcbComponent,
    sourceGroupId: sourceFuse.source_group_id,
    inflatorContext,
  })
  const fuse = new Fuse({
    name: sourceFuse.name,
    currentRating: sourceFuse.current_rating_amps,
    voltageRating: sourceFuse.voltage_rating_volts,
    manufacturerPartNumber: sourceFuse.manufacturer_part_number,
    supplierPartNumbers: sourceFuse.supplier_part_numbers,
    displayName: sourceFuse.display_name,
    layer: pcbComponent?.layer,
    pcbX,
    pcbY,
    pcbRotation: pcbComponent?.rotation,
    doNotPlace: pcbComponent?.do_not_place,
    obstructsWithinBounds: pcbComponent?.obstructs_within_bounds,
  })
  if (pcbComponent) {
    const footprint = inflateFootprintComponent(pcbComponent, {
      ...inflatorContext,
      normalComponent: fuse,
    })
    if (footprint) fuse.add(footprint)
  }
  const group = sourceFuse.source_group_id
    ? groupsMap?.get(sourceFuse.source_group_id)
    : undefined
  ;(group ?? subcircuit).add(fuse)
}
