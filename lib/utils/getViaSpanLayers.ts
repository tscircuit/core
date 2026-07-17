import type { LayerRef } from "circuit-json"

/**
 * All copper layers a drilled via physically crosses between fromLayer and
 * toLayer (inclusive), in from→to order, for a board with `layerCount`
 * copper layers.
 *
 * A via barrel passes through every layer between its end layers, so
 * `pcb_via.layers` must list the intermediate inner layers too — copper pour
 * solvers and DRC rely on it to bond (same net) or antipad (foreign net) the
 * via on each plane it crosses. Listing only `[fromLayer, toLayer]` makes
 * inner planes flood solid over foreign via barrels.
 *
 * Falls back to `[fromLayer, toLayer]` when either layer is not part of the
 * stack implied by `layerCount` (e.g. an inner layer name on a 2-layer board).
 */
export const getViaSpanLayers = ({
  fromLayer,
  toLayer,
  layerCount,
}: {
  fromLayer: LayerRef
  toLayer: LayerRef
  layerCount: number
}): LayerRef[] => {
  if (fromLayer === toLayer) return [fromLayer]
  const stack: LayerRef[] = ["top"]
  for (let i = 1; i <= layerCount - 2; i++) {
    stack.push(`inner${i}` as LayerRef)
  }
  stack.push("bottom")
  const fromIndex = stack.indexOf(fromLayer)
  const toIndex = stack.indexOf(toLayer)
  if (fromIndex === -1 || toIndex === -1) return [fromLayer, toLayer]
  return fromIndex <= toIndex
    ? stack.slice(fromIndex, toIndex + 1)
    : stack.slice(toIndex, fromIndex + 1).reverse()
}

export const getViaBoardLayers = (layerCount: number): LayerRef[] => {
  if (layerCount <= 1) return ["top"]
  return getViaSpanLayers({
    fromLayer: "top",
    toLayer: "bottom",
    layerCount,
  })
}

/**
 * Copper layers ordered by routing preference. Outer layers retain their
 * historical priority, followed by inner layers from top to bottom.
 */
export const getBoardAvailableLayers = (layerCount: number): LayerRef[] => {
  const physicalLayerStack = getViaBoardLayers(layerCount)
  if (physicalLayerStack.length <= 1) return physicalLayerStack

  return [
    physicalLayerStack[0],
    physicalLayerStack[physicalLayerStack.length - 1],
    ...physicalLayerStack.slice(1, -1),
  ]
}
