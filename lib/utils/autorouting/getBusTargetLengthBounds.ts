import type { Bus } from "lib/components/primitive-components/Bus"
import type { SourceBusRouteLength } from "circuit-json"
import type { SimpleRouteBus } from "./SimpleRouteJson"

/** Resolves planar pad-centre lengths in board-world XY (+X right, +Y up), in mm. */
export const getBusTargetLengthBounds = (
  bus: Bus,
): Pick<SimpleRouteBus, "minLength" | "maxLength"> => {
  if (!bus.source_bus_id) return {}
  const { db } = bus.root!
  const sourceBus = db.source_bus.get(bus.source_bus_id)!
  const resolveLength = (
    routeLength: SourceBusRouteLength | undefined,
    property: "minLength" | "maxLength" | "targetLength",
  ): number | undefined => {
    if (routeLength === undefined || typeof routeLength === "number")
      return routeLength
    const reference = routeLength
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
          `Bus "${bus.name}" ${property} requires two placed endpoint pads per reference trace`,
        )
      }
      return (
        Math.abs(pcbPorts[0].x - pcbPorts[1].x) +
        Math.abs(pcbPorts[0].y - pcbPorts[1].y)
      )
    })
    return Math.max(...manhattanLengths) + (reference.offset ?? 0)
  }
  let minLength = resolveLength(sourceBus.min_length, "minLength")
  let maxLength = resolveLength(sourceBus.max_length, "maxLength")
  const targetLength = resolveLength(sourceBus.target_length, "targetLength")
  if (targetLength !== undefined) {
    const tolerance = sourceBus.length_tolerance
    if (tolerance === undefined) {
      throw new Error(
        `Bus "${bus.name}" requires lengthTolerance with targetLength`,
      )
    }
    minLength = Math.max(minLength ?? 0, targetLength - tolerance)
    maxLength = Math.min(maxLength ?? Infinity, targetLength + tolerance)
  }
  if (minLength !== undefined) minLength = Math.max(0, minLength)
  if (maxLength !== undefined && maxLength < (minLength ?? 0)) {
    throw new Error(
      `Bus "${bus.name}" has incompatible length bounds: minimum ${minLength ?? 0} mm exceeds maximum ${maxLength} mm`,
    )
  }
  return {
    ...(minLength !== undefined ? { minLength } : {}),
    ...(maxLength !== undefined ? { maxLength } : {}),
  }
}
