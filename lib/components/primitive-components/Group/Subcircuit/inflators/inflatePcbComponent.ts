import type { PcbComponent } from "circuit-json"
import { extractPcbPrimitivesFromCircuitJson } from "lib/utils/extractPcbPrimitivesFromCircuitJson"
import type { InflatorContext } from "../InflatorFn"

/**
 * Inflates PCB component by extracting primitives from circuit JSON and adding them
 * to the normal component.
 *
 * @param pcbElm - The PCB component element from circuit JSON
 * @param inflatorContext - The inflator context containing the injection database
 */
export const inflatePcbComponent = (
  pcbElm: PcbComponent,
  inflatorContext: InflatorContext,
) => {
  const { injectionDb, normalComponent } = inflatorContext
  if (!normalComponent) return

  const components = extractPcbPrimitivesFromCircuitJson({
    pcbComponent: pcbElm,
    db: injectionDb,
    componentName: normalComponent.name,
  })

  normalComponent.addAll(components)
}
