import type { CircuitJsonUtilObjects } from "@tscircuit/circuit-json-util"
import type { PcbComponent } from "circuit-json"
import { Footprint } from "lib/components/primitive-components/Footprint"

export const deriveFootprintFromPcbComponent = (
  pcbComponent: PcbComponent,
  injectionDb: CircuitJsonUtilObjects,
) => {
  new Footprint({
    circuitJson: pcbComponent,
  })
}
