import type { PcbComponent } from "circuit-json"
import { Footprint } from "lib/components/primitive-components/Footprint"
import { extractPcbPrimitivesFromCircuitJson } from "lib/utils/extractPcbPrimitivesFromCircuitJson"
import type { InflatorContext } from "../InflatorFn"

export const inflatePcbComponentPrimitives = (
  pcbComponent: PcbComponent,
  {
    componentName,
    inflatorContext,
  }: {
    componentName: string
    inflatorContext: InflatorContext
  },
): Footprint | null => {
  const primitives = extractPcbPrimitivesFromCircuitJson({
    pcbComponent,
    db: inflatorContext.injectionDb,
    componentName,
  })

  if (primitives.length === 0) return null

  const footprint = new Footprint({ originalLayer: pcbComponent.layer })
  footprint.addAll(primitives)

  return footprint
}
