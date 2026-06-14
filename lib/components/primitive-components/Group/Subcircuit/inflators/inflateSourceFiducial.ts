import type { PcbComponent, SourceSimpleFiducial } from "circuit-json"
import { Footprint } from "lib/components/primitive-components/Footprint"
import { Group } from "lib/components/primitive-components/Group/Group"
import { extractPcbPrimitivesFromCircuitJson } from "lib/utils/extractPcbPrimitivesFromCircuitJson"
import type { InflatorContext } from "../InflatorFn"
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

  const primitives = pcbElm
    ? extractPcbPrimitivesFromCircuitJson({
        pcbComponent: pcbElm,
        db: injectionDb,
        componentName: sourceElm.name,
      })
    : []

  const fiducialFootprint = new Footprint({
    originalLayer: pcbElm?.layer,
  })
  fiducialFootprint.addAll(primitives)

  const fiducialGroup = new Group({
    name: sourceElm.name,
    pcbX,
    pcbY,
    pcbRotation: pcbElm?.rotation,
  })
  fiducialGroup.add(fiducialFootprint)

  if (sourceElm.source_group_id && groupsMap?.has(sourceElm.source_group_id)) {
    const group = groupsMap.get(sourceElm.source_group_id)!
    group.add(fiducialGroup)
  } else {
    subcircuit.add(fiducialGroup)
  }
}
