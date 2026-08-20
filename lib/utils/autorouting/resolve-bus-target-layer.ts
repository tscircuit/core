export interface BusLayerPreferences {
  allowedLayers?: readonly string[]
  preferredLayer?: string
  preferredLayers?: readonly string[]
}

/** Resolve PCB layer candidates for both breakout placement and fanout. */
export const resolveBusTargetLayers = (
  bus: BusLayerPreferences,
  availableLayers: readonly string[],
): string[] => {
  if (bus.preferredLayer !== undefined) {
    return [bus.preferredLayer]
  }

  if (bus.preferredLayers !== undefined && bus.preferredLayers.length > 0) {
    return [...new Set(bus.preferredLayers)]
  }

  if (bus.allowedLayers !== undefined && bus.allowedLayers.length > 0) {
    return [...new Set(bus.allowedLayers)]
  }

  const uniqueAvailableLayers = [...new Set(availableLayers)]
  if (uniqueAvailableLayers.length > 0) return uniqueAvailableLayers
  return ["top"]
}
