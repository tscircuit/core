import type { SourceNet } from "circuit-json"
import { Net } from "lib/components/primitive-components/Net"
import type { InflatorContext } from "../InflatorFn"

export function inflateSourceNet(
  sourceNet: SourceNet,
  inflatorContext: InflatorContext,
) {
  inflatorContext.subcircuit.add(new Net({ name: sourceNet.name }))
}
