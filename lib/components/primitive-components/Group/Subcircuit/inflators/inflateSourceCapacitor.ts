import type {
  SourceSimpleCapacitor,
  PcbComponent,
  CadComponent,
} from "circuit-json"
import { Capacitor } from "lib/components/normal-components/Capacitor"
import { inflatePcbComponent } from "./inflatePcbComponent"
import type { InflatorContext } from "../InflatorFn"

export function inflateSourceCapacitor(
  sourceElm: SourceSimpleCapacitor,
  inflatorContext: InflatorContext,
) {
  const { injectionDb, subcircuit, groupsMap } = inflatorContext

  const pcbElm = injectionDb.pcb_component.getWhere({
    source_component_id: sourceElm.source_component_id,
  }) as PcbComponent | null

  const cadElm = injectionDb.cad_component.getWhere({
    source_component_id: sourceElm.source_component_id,
  }) as CadComponent | null

  const capacitor = new Capacitor({
    name: sourceElm.name,
    capacitance: sourceElm.capacitance,
  })

  if (pcbElm) {
    inflatePcbComponent(pcbElm, {
      ...inflatorContext,
      normalComponent: capacitor,
    })
  }

  // Add the capacitor to its group if it has one, otherwise add to subcircuit
  if (sourceElm.source_group_id && groupsMap?.has(sourceElm.source_group_id)) {
    const group = groupsMap.get(sourceElm.source_group_id)!
    group.add(capacitor)
  } else {
    subcircuit.add(capacitor)
  }
}
