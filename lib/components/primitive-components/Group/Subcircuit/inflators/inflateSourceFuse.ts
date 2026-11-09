import type { SourceSimpleFuse } from "circuit-json"
import { Fuse } from "lib/components/normal-components/Fuse"
import type { InflatorContext } from "../InflatorFn"
import { inflateFootprintComponent } from "./inflateFootprintComponent"
import { getInflatedPcbPlacement } from "./getInflatedPcbPlacement"

export function inflateSourceFuse(
  sourceElm: SourceSimpleFuse,
  inflatorContext: InflatorContext,
) {
  const { injectionDb, subcircuit, groupsMap } = inflatorContext

  const pcbElm = injectionDb.pcb_component.getWhere({
    source_component_id: sourceElm.source_component_id,
  })

  const { pcbX, pcbY } = getInflatedPcbPlacement({
    pcbComponent: pcbElm,
    sourceGroupId: sourceElm.source_group_id,
    inflatorContext,
  })

  const fuse = new Fuse({
    name: sourceElm.name,
    currentRating: sourceElm.current_rating_amps,
    voltageRating: sourceElm.voltage_rating_volts,
    manufacturerPartNumber: sourceElm.manufacturer_part_number,
    supplierPartNumbers: sourceElm.supplier_part_numbers,
    displayName: sourceElm.display_name,
    layer: pcbElm?.layer,
    pcbX,
    pcbY,
    pcbRotation: pcbElm?.rotation,
    doNotPlace: pcbElm?.do_not_place,
    obstructsWithinBounds: pcbElm?.obstructs_within_bounds,
  })

  if (pcbElm) {
    const footprint = inflateFootprintComponent(pcbElm, {
      ...inflatorContext,
      normalComponent: fuse,
    })
    if (footprint) fuse.add(footprint)
  }

  if (sourceElm.source_group_id && groupsMap?.has(sourceElm.source_group_id)) {
    groupsMap.get(sourceElm.source_group_id)!.add(fuse)
  } else {
    subcircuit.add(fuse)
  }
}
