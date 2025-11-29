import type {
  SourceSimpleInductor,
  PcbComponent,
  CadComponent,
} from "circuit-json"
import { Inductor } from "lib/components/normal-components/Inductor"
import { inflatePcbComponent } from "./inflatePcbComponent"
import type { InflatorContext } from "../InflatorFn"

export function inflateSourceInductor(
  sourceElm: SourceSimpleInductor,
  inflatorContext: InflatorContext,
) {
  const { injectionDb, subcircuit, groupsMap } = inflatorContext

  const pcbElm = injectionDb.pcb_component.getWhere({
    source_component_id: sourceElm.source_component_id,
  }) as PcbComponent | null

  const cadElm = injectionDb.cad_component.getWhere({
    source_component_id: sourceElm.source_component_id,
  }) as CadComponent | null

  const inductor = new Inductor({
    name: sourceElm.name,
    inductance: (sourceElm as any).inductance,
    layer: pcbElm?.layer,
    pcbX: pcbElm?.center?.x,
    pcbY: pcbElm?.center?.y,
    pcbRotation: pcbElm?.rotation,
    doNotPlace: pcbElm?.do_not_place,
    obstructsWithinBounds: pcbElm?.obstructs_within_bounds,
  })

  if (pcbElm) {
    inflatePcbComponent(pcbElm, {
      ...inflatorContext,
      normalComponent: inductor,
    })
  }

  // Add the inductor to its group if it has one, otherwise add to subcircuit
  if (sourceElm.source_group_id && groupsMap?.has(sourceElm.source_group_id)) {
    const group = groupsMap.get(sourceElm.source_group_id)!
    group.add(inductor)
  } else {
    subcircuit.add(inductor)
  }
}
