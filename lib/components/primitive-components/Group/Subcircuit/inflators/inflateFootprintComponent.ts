import type { PcbComponent } from "circuit-json"
import { Footprint } from "lib/components/primitive-components/Footprint"
import { SilkscreenText } from "lib/components/primitive-components/SilkscreenText"
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
  const { injectionDb, normalComponent, isPlacedPcbSilkscreenText } =
    inflatorContext
  if (!normalComponent) return null

  const primitives = extractPcbPrimitivesFromCircuitJson({
    pcbComponent: pcbElm,
    db: injectionDb,
    componentName: normalComponent.name,
  })

  if (primitives.length === 0) return null

  // Label placement leaves the text the circuit JSON placed where it is. Each
  // pcb_silkscreen_text becomes one SilkscreenText, in order.
  const pcbSilkscreenTexts = injectionDb.pcb_silkscreen_text.list({
    pcb_component_id: pcbElm.pcb_component_id,
  })
  primitives
    .filter(
      (primitive): primitive is SilkscreenText =>
        primitive instanceof SilkscreenText,
    )
    .forEach((silkscreenText, i) => {
      const pcbSilkscreenText = pcbSilkscreenTexts[i]
      if (pcbSilkscreenText && isPlacedPcbSilkscreenText(pcbSilkscreenText))
        silkscreenText._isPlacedInCircuitJson = true
    })

  const footprint = new Footprint({ originalLayer: pcbElm.layer })
  footprint.addAll(primitives)

  return footprint
}
