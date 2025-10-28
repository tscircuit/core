import type {
  CadComponent,
  PcbComponent,
  SourceSimpleResistor,
} from "circuit-json"
import type { InflatorContext } from "../InflatorFn"
import { Resistor } from "lib/components/normal-components/Resistor"
import { inflatePcbComponent } from "./inflatePcbComponent"

export function inflateSourceResistor(
  sourceElm: SourceSimpleResistor,
  inflatorContext: InflatorContext,
) {
  const { injectionDb, subcircuit, groupsMap } = inflatorContext

  const pcbElm = injectionDb.pcb_component.getWhere({
    source_component_id: sourceElm.source_component_id,
  }) as PcbComponent | null

  const cadElm = injectionDb.cad_component.getWhere({
    source_component_id: sourceElm.source_component_id,
  }) as CadComponent | null

  const resistor = new Resistor({
    name: sourceElm.name,
    resistance: sourceElm.resistance,
  })

  if (pcbElm) {
    inflatePcbComponent(pcbElm, {
      ...inflatorContext,
      normalComponent: resistor,
    })
  }

  // Add the resistor to its group if it has one, otherwise add to subcircuit
  if (sourceElm.source_group_id && groupsMap?.has(sourceElm.source_group_id)) {
    const group = groupsMap.get(sourceElm.source_group_id)!
    group.add(resistor)
  } else {
    subcircuit.add(resistor)
  }
}
