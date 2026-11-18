import type { SourceNet } from "circuit-json"
import { Net } from "lib/components/primitive-components/Net"
import type { InflatorContext } from "../InflatorFn"

export function inflateSourceNet(
  sourceNet: SourceNet,
  { subcircuit }: InflatorContext,
) {
  // Imported traces resolve net selectors in the receiving subcircuit.
  // Create explicit nets before those traces can create name-only defaults.
  subcircuit.add(
    new Net({
      name: sourceNet.name,
      nominalTraceWidth: sourceNet.trace_width,
      minTraceClearance: sourceNet.min_trace_clearance,
      isPowerNet: sourceNet.is_power,
      isGroundNet: sourceNet.is_ground,
    }),
  )
}
