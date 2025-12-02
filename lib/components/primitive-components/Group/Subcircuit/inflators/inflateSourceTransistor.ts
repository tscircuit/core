import type {
  SourceSimpleTransistor,
  PcbComponent,
  CadComponent,
} from "circuit-json"
import { Transistor } from "lib/components/normal-components/Transistor"
import { inflatePcbComponent } from "./inflatePcbComponent"
import type { InflatorContext } from "../InflatorFn"

export function inflateSourceTransistor(
  sourceElm: SourceSimpleTransistor,
  inflatorContext: InflatorContext,
) {
  const { injectionDb, subcircuit, groupsMap } = inflatorContext

  const pcbElm = injectionDb.pcb_component.getWhere({
    source_component_id: sourceElm.source_component_id,
  }) as PcbComponent | null

  const cadElm = injectionDb.cad_component.getWhere({
    source_component_id: sourceElm.source_component_id,
  }) as CadComponent | null

  const transistor = new Transistor({
    name: sourceElm.name,
    type: sourceElm.transistor_type,
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
      normalComponent: transistor,
    })
  }

  // Add the transistor to its group if it has one, otherwise add to subcircuit
  if (sourceElm.source_group_id && groupsMap?.has(sourceElm.source_group_id)) {
    const group = groupsMap.get(sourceElm.source_group_id)!
    group.add(transistor)
  } else {
    subcircuit.add(transistor)
  }
}
