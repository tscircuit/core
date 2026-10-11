import type { Bus } from "lib/components/primitive-components/Bus"
import type { SimpleRouteBus } from "./SimpleRouteJson"

/** Resolves planar pad-centre lengths in board-world XY (+X right, +Y up), in mm. */
export const getBusTargetLengthBounds = (
  bus: Bus,
): Pick<SimpleRouteBus, "minLength" | "maxLength"> => {
  if (!bus.source_bus_id) return {}
  const { db } = bus.root!
  const sourceBus = db.source_bus.get(bus.source_bus_id)!
  if (sourceBus.target_length === undefined) return {}
  const tolerance = sourceBus.length_tolerance
  if (tolerance === undefined) {
    throw new Error(
      `Bus "${bus.name}" requires lengthTolerance with targetLength`,
    )
  }
  let targetLength: number
  if (typeof sourceBus.target_length === "number") {
    targetLength = sourceBus.target_length
  } else {
    const reference = sourceBus.target_length
    const sourceTraceIds =
      reference.source_trace_ids ?? sourceBus.source_trace_ids
    const manhattanLengths = sourceTraceIds.map((sourceTraceId) => {
      const sourceTrace = db.source_trace.get(sourceTraceId)!
      const pcbPorts = db.pcb_port
        .list()
        .filter((port) =>
          sourceTrace.connected_source_port_ids.includes(port.source_port_id),
        )
      if (pcbPorts.length !== 2) {
        throw new Error(
          `Bus "${bus.name}" targetLength requires two placed endpoint pads per reference trace`,
        )
      }
      return (
        Math.abs(pcbPorts[0].x - pcbPorts[1].x) +
        Math.abs(pcbPorts[0].y - pcbPorts[1].y)
      )
    })
    targetLength = Math.max(...manhattanLengths) + (reference.offset ?? 0)
  }
  return {
    minLength: Math.max(0, targetLength - tolerance),
    maxLength: targetLength + tolerance,
  }
}
