import type { PcbComponent, SourceSimpleMosfet } from "circuit-json"
import { Mosfet } from "lib/components/normal-components/Mosfet"
import type { InflatorContext } from "../InflatorFn"
import { getInflatedPcbPlacement } from "./getInflatedPcbPlacement"
import { inflateFootprintComponent } from "./inflateFootprintComponent"

export function inflateSourceMosfet(
  sourceElm: SourceSimpleMosfet,
  inflatorContext: InflatorContext,
) {
  const { injectionDb, subcircuit, groupsMap } = inflatorContext

  const pcbElm = injectionDb.pcb_component.getWhere({
    source_component_id: sourceElm.source_component_id,
  }) as PcbComponent | null

  const { pcbX, pcbY } = getInflatedPcbPlacement({
    pcbComponent: pcbElm,
    sourceGroupId: sourceElm.source_group_id,
    inflatorContext,
  })

  const mosfet = new Mosfet({
    name: sourceElm.name,
    channelType: sourceElm.channel_type,
    mosfetMode: sourceElm.mosfet_mode,
    manufacturerPartNumber: sourceElm.manufacturer_part_number,
    supplierPartNumbers: sourceElm.supplier_part_numbers ?? undefined,
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
      normalComponent: mosfet,
    })

    if (footprint) {
      mosfet.add(footprint)
    }
  }

  if (sourceElm.source_group_id && groupsMap?.has(sourceElm.source_group_id)) {
    groupsMap.get(sourceElm.source_group_id)!.add(mosfet)
  } else {
    subcircuit.add(mosfet)
  }
}
