import type { PcbComponent } from "circuit-json"
import type { InflatorContext } from "../InflatorFn"
import { inflatePcbComponentPrimitives } from "./inflatePcbComponentPrimitives"

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
 ) => {
  const { normalComponent } = inflatorContext
  if (!normalComponent) return null
  return inflatePcbComponentPrimitives(pcbElm, {
    componentName: normalComponent.name,
    inflatorContext,
  })
}
