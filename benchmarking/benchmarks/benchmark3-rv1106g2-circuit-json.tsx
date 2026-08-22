import type { CircuitJson } from "circuit-json"
import rv1106g2CircuitJson from "./benchmark3-rv1106g2-circuit.json"

const compatibleCircuitJson = rv1106g2CircuitJson.map((element) => {
  if (element.type !== "source_component") return element
  if (
    element.ftype !== "simple_crystal" &&
    element.ftype !== "simple_pin_header"
  ) {
    return element
  }

  return { ...element, ftype: "simple_chip" as const }
}) as CircuitJson

export const Benchmark3Rv1106g2CircuitJson = () => (
  <board circuitJson={compatibleCircuitJson} />
)
