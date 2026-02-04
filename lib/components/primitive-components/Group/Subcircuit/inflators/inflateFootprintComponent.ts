import type { PcbComponent } from "circuit-json"
import { Footprint } from "lib/components/primitive-components/Footprint"
import { extractPcbPrimitivesFromCircuitJson } from "lib/utils/extractPcbPrimitivesFromCircuitJson"
import type { InflatorContext } from "../InflatorFn"

/**
 * Inflates a Footprint component from circuit JSON by extracting all PCB primitives
 * (pads, holes, silkscreen, etc.) and adding them to a new Footprint instance.
 *
 * @param pcbElm - The PCB component element from circuit JSON
 * @param inflatorContext - The inflator context containing the injection database
 * @returns A Footprint component containing all the PCB primitives, or null if no normalComponent
 */
export const inflateFootprintComponent = (
  pcbElm: PcbComponent,
  inflatorContext: InflatorContext,
): Footprint | null => {
  const { injectionDb, normalComponent } = inflatorContext
  if (!normalComponent) return null

  const primitives = extractPcbPrimitivesFromCircuitJson({
    pcbComponent: pcbElm,
    db: injectionDb,
    componentName: normalComponent.name,
  })

  if (primitives.length === 0) return null

  const footprint = new Footprint({})
  footprint.addAll(primitives)

  return footprint
}
