import type { CircuitJson } from "circuit-json"
import type { PcbDifferentialPairLocalSkew } from "lib/utils/local-skew/pcb-differential-pair-local-skew"

type CircuitJsonWithLocalSkew = (
  | CircuitJson[number]
  | PcbDifferentialPairLocalSkew
)[]

/** The local skew elements core stored in `circuitJson`. */
export function getStoredLocalSkew(
  circuitJson: CircuitJsonWithLocalSkew,
): PcbDifferentialPairLocalSkew[] {
  return circuitJson.filter(
    (element) => element.type === "pcb_differential_pair_local_skew",
  )
}
