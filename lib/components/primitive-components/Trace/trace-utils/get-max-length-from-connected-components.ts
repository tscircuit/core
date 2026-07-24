import type { CircuitJsonUtilObjects } from "@tscircuit/circuit-json-util"
import type { Port } from "../../Port"

export const getMaxLengthFromConnectedComponents = (
  ports: Port[],
  { db }: { db: CircuitJsonUtilObjects },
): number | undefined => {
  const componentMaxLengths = ports
    .map((port) => {
      const sourcePort = db.source_port.get(port.source_port_id!)
      if (!sourcePort?.source_component_id) return null

      const sourceComponent = db.source_component.get(
        sourcePort.source_component_id,
      )

      if (sourceComponent?.ftype === "simple_capacitor") {
        return sourceComponent.max_decoupling_trace_length
      }

      return null
    })
    .filter((length): length is number => typeof length === "number")

  if (componentMaxLengths.length === 0) return undefined
  return Math.min(...componentMaxLengths)
}
