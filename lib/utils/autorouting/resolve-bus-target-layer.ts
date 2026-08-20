export interface BusLayerPreferences {
  preferredLayer?: string
  preferredLayers?: readonly string[]
}

/** Resolve the one PCB layer targeted by both breakout placement and fanout. */
export const resolveBusTargetLayer = (bus: BusLayerPreferences): string => {
  if (bus.preferredLayer !== undefined) {
    return bus.preferredLayer
  }

  const firstPreferredLayer = bus.preferredLayers?.[0]
  if (firstPreferredLayer !== undefined) {
    return firstPreferredLayer
  }

  return "top"
}
