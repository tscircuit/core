import type { CircuitJson } from "circuit-json"
import type { PcbDifferentialPairLocalSkew } from "lib/utils/local-skew/pcb-differential-pair-local-skew"

type CircuitJsonWithLocalSkew = (
  | CircuitJson[number]
  | PcbDifferentialPairLocalSkew
)[]

export function getStoredLocalSkew(circuitJson: CircuitJsonWithLocalSkew) {
  return circuitJson.filter(
    (element) => element.type === "pcb_differential_pair_local_skew",
  )
}
