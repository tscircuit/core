import { pinAttributeMap } from "@tscircuit/props"
import type { SourcePort } from "circuit-json"
import type { Port } from "../../primitive-components/Port"

type SourcePortId = SourcePort["source_port_id"]

/** Resolve explicit pin tolerances using the same alias order as source attributes. */
export const resolveSourcePinVoltageTolerances = (ports: Port[]) => {
  const tolerances = new Map<SourcePortId, number>()
  for (const port of ports) {
    if (!port.source_port_id) continue
    for (const attributes of port._getMatchingPinAttributes()) {
      if (attributes.requiredVoltageTolerance === undefined) continue
      tolerances.set(
        port.source_port_id,
        pinAttributeMap.shape.requiredVoltageTolerance
          .unwrap()
          .parse(attributes.requiredVoltageTolerance),
      )
    }
  }
  return tolerances
}
