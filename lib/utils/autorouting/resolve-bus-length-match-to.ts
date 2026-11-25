import type { SimpleRouteJson } from "./SimpleRouteJson"

/** Resolve TSX lengthMatchTo against current connections and completed copper.
 * Route points are board-world XY in mm (+X right, +Y up, right-handed).
 * Planar length excludes via height; no route points or layers are changed. */
export function resolveBusLengthMatchTo(
  input: SimpleRouteJson,
): SimpleRouteJson {
  if (!input.buses?.some((bus) => bus.lengthMatchToConnectionNames?.length)) {
    return input
  }
  const activeConnectionNames = new Set(
    input.connections.map((connection) => connection.name),
  )
  return {
    ...input,
    buses: input.buses.map((bus) => {
      const { lengthMatchToConnectionNames, ...routingBus } = bus
      if (!lengthMatchToConnectionNames?.length) return bus
      // The parsed public prop requires an explicit maxLengthSkew.
      const maxLengthSkew = bus.maxLengthSkew!
      const completedLengths = lengthMatchToConnectionNames.flatMap(
        (connectionName) => {
          if (activeConnectionNames.has(connectionName)) return []
          const traces = (input.traces ?? []).filter(
            (trace) => trace.connection_name === connectionName,
          )
          if (traces.length === 0) {
            throw new Error(
              `Bus "${bus.name}" requires lengthMatchTo references to route in the same or an earlier phase`,
            )
          }
          const length = traces.reduce(
            (total, trace) =>
              total +
              trace.route.slice(1).reduce((sum, point, index) => {
                const previous = trace.route[index]
                if (
                  point.route_type !== "wire" ||
                  previous.route_type !== "wire" ||
                  point.layer !== previous.layer
                )
                  return sum
                return (
                  sum + Math.hypot(point.x - previous.x, point.y - previous.y)
                )
              }, 0),
            0,
          )
          return [length]
        },
      )
      const connectionNames = [
        ...new Set([
          ...bus.connectionNames,
          ...lengthMatchToConnectionNames.filter((name) =>
            activeConnectionNames.has(name),
          ),
        ]),
      ]
      if (completedLengths.length === 0)
        return { ...routingBus, connectionNames }
      const shortest = Math.min(...completedLengths)
      const longest = Math.max(...completedLengths)
      if (longest - shortest > maxLengthSkew + 1e-7) {
        throw new Error(
          `Bus "${bus.name}" completed lengthMatchTo references already exceed maxLengthSkew`,
        )
      }
      const minLength = Math.max(bus.minLength ?? 0, longest - maxLengthSkew)
      const maxLength = Math.min(
        bus.maxLength ?? Infinity,
        shortest + maxLengthSkew,
      )
      if (minLength > maxLength) {
        throw new Error(
          `Bus "${bus.name}" lengthMatchTo references conflict with its declared length bounds`,
        )
      }
      return { ...routingBus, connectionNames, minLength, maxLength }
    }),
  }
}
