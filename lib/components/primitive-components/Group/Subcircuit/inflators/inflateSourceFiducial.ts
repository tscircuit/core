import type {
  PcbComponent,
  PcbSmtPadCircle,
  SourceSimpleFiducial,
} from "circuit-json"
import { Fiducial } from "lib/components/primitive-components/Fiducial"
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

  const smtPad = pcbElm
    ? (injectionDb.pcb_smtpad.getWhere({
        pcb_component_id: pcbElm.pcb_component_id,
      }) as PcbSmtPadCircle | null)
    : null

  const fiducial = new Fiducial({
    name: sourceElm.name,
    pcbX,
    pcbY,
    layer: pcbElm?.layer as any,
    pcbRotation: pcbElm?.rotation,
    padDiameter: smtPad?.radius != null ? smtPad.radius * 2 : undefined,
  })

  if (sourceElm.source_group_id && groupsMap?.has(sourceElm.source_group_id)) {
    const group = groupsMap.get(sourceElm.source_group_id)!
    group.add(fiducial)
  } else {
    subcircuit.add(fiducial)
  }
}
