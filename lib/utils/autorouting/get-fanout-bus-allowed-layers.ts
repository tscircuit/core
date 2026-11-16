import type { SimpleRouteBus } from "./SimpleRouteJson"

/** Fanout layer preferences restrict carriers, matching the fanout bus adapter. */
export function getFanoutBusAllowedLayers(
  bus: Pick<
    SimpleRouteBus,
    "allowedLayers" | "preferredLayer" | "preferredLayers"
  >,
): SimpleRouteBus["allowedLayers"] {
  const requestedFanoutLayers = [
    ...(bus.preferredLayer === undefined ? [] : [bus.preferredLayer]),
    ...(bus.preferredLayers ?? []),
  ].filter((layer, index, layers) => layers.indexOf(layer) === index)
  if (requestedFanoutLayers.length === 0) return bus.allowedLayers
  const busAllowedLayers = bus.allowedLayers
  return busAllowedLayers === undefined
    ? requestedFanoutLayers
    : requestedFanoutLayers.filter((layer) => busAllowedLayers.includes(layer))
}
