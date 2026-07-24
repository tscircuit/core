import type { CircuitJsonUtilObjects } from "@tscircuit/circuit-json-util"
import type { Port } from "../../Port"

export const getMaxLengthFromConnectedCrystals = (
  ports: Port[],
  { db }: { db: CircuitJsonUtilObjects },
): number | undefined => {
  const crystalMaxLengths = ports
    .map((port) => {
      const sourcePort = db.source_port.get(port.source_port_id!)
      if (!sourcePort?.source_component_id) return null

      const sourceComponent = db.source_component.get(
        sourcePort.source_component_id,
      )
      if (sourceComponent?.ftype !== "simple_crystal") return null

      const crystalProps = (
        port.parent as unknown as {
          _parsedProps?: { maxTraceLength?: number }
        }
      )?._parsedProps

      return crystalProps?.maxTraceLength ?? 10
    })
    .filter((length): length is number => typeof length === "number")

  if (crystalMaxLengths.length === 0) return undefined
  return Math.min(...crystalMaxLengths)
}

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

  const crystalMaxLength = getMaxLengthFromConnectedCrystals(ports, { db })
  if (crystalMaxLength !== undefined) {
    componentMaxLengths.push(crystalMaxLength)
  }

  if (componentMaxLengths.length === 0) return undefined
  return Math.min(...componentMaxLengths)
}
