import type {
  CadComponent,
  PcbComponent,
  SourceSimpleResistor,
} from "circuit-json"
import type { InflatorContext } from "../InflatorFn"
import { Resistor } from "lib/components/normal-components/Resistor"

export function inflateSourceResistor(
  sourceElm: SourceSimpleResistor,
  context: InflatorContext,
) {
  const { injectionDb, subcircuit } = context

  const pcbElm = injectionDb.pcb_component.getWhere({
    name: sourceElm.name,
  }) as PcbComponent

  const cadElm = injectionDb.cad_component.getWhere({
    name: sourceElm.name,
  }) as CadComponent

  const resistor = new Resistor({
    name: sourceElm.name,
    resistance: sourceElm.resistance,
    footprint: cadElm.footprinter_string,
  })

  subcircuit.add(resistor)
}
