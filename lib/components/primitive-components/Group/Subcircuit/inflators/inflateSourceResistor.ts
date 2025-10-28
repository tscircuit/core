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
  const { injectionDb, subcircuit } = inflatorContext

  const pcbElm = injectionDb.pcb_component.getWhere({
    source_component_id: sourceElm.source_component_id,
  }) as PcbComponent | null

  console.log("sourceElm", sourceElm)
  console.log("pcbComponents", injectionDb.pcb_component.list())

  const cadElm = injectionDb.cad_component.getWhere({
    source_component_id: sourceElm.source_component_id,
  }) as CadComponent | null

  console.log("cadElm", cadElm)
  console.log("pcbElm", pcbElm)
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

  subcircuit.add(resistor)
}
