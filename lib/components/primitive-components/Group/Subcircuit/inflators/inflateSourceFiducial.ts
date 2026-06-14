import type { PcbComponent, SourceSimpleFiducial } from "circuit-json"
import { ImportedPcbComponent } from "lib/components/primitive-components/ImportedPcbComponent"
import type { InflatorContext } from "../InflatorFn"
import { inflatePcbComponentPrimitives } from "./inflatePcbComponentPrimitives"
import { getInflatedPcbPlacement } from "./getInflatedPcbPlacement"

export function inflateSourceFiducial(
  sourceElm: SourceSimpleFiducial,
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

  const fiducial = new ImportedPcbComponent({
    height: pcbElm?.height,
    name: sourceElm.name,
    layer: pcbElm?.layer,
    obstructsWithinBounds: pcbElm?.obstructs_within_bounds,
    pcbX,
    pcbY,
    pcbRotation: pcbElm?.rotation,
    doNotPlace: pcbElm?.do_not_place,
    width: pcbElm?.width,
  })

  if (pcbElm) {
    const footprint = inflatePcbComponentPrimitives(pcbElm, {
      componentName: sourceElm.name,
      inflatorContext,
    })

    if (footprint) {
      fiducial.add(footprint)
    }
  }

  if (sourceElm.source_group_id && groupsMap?.has(sourceElm.source_group_id)) {
    const group = groupsMap.get(sourceElm.source_group_id)!
    group.add(fiducial)
  } else {
    subcircuit.add(fiducial)
  }
}
