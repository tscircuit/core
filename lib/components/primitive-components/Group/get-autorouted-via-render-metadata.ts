import type { LayerRef, PcbTrace, PcbVia } from "circuit-json"
import { getAutoroutedViaLayers } from "lib/utils/getViaSpanLayers"

type AutoroutedViaPoint = Extract<
  PcbTrace["route"][number],
  { route_type: "via" }
> & {
  via_diameter?: number
  via_hole_diameter?: number
  outer_diameter?: number
  hole_diameter?: number
  layers?: readonly LayerRef[]
}

type AutoroutedViaRenderOptions = {
  defaultHoleDiameter: number
  defaultOuterDiameter: number
  layerCount: number
  allowBlindAndBuriedVias: boolean
}

export const getAutoroutedViaRenderMetadata = ({
  pcbTraceId,
  point,
  defaultHoleDiameter,
  defaultOuterDiameter,
  layerCount,
  allowBlindAndBuriedVias,
}: AutoroutedViaRenderOptions & {
  pcbTraceId: PcbTrace["pcb_trace_id"]
  point: AutoroutedViaPoint
}) => {
  const fromLayer = point.from_layer as LayerRef
  const toLayer = point.to_layer as LayerRef
  const holeDiameter =
    point.via_hole_diameter ?? point.hole_diameter ?? defaultHoleDiameter
  const outerDiameter =
    point.via_diameter ?? point.outer_diameter ?? defaultOuterDiameter
  const layers = getAutoroutedViaLayers({
    fromLayer,
    toLayer,
    layerCount,
    allowBlindAndBuriedVias,
    physicalLayers: point.layers,
  })

  return {
    fromLayer,
    toLayer,
    holeDiameter,
    outerDiameter,
    layers,
    logicalKey: [
      pcbTraceId,
      point.x,
      point.y,
      [...layers].sort().join(","),
    ].join(":"),
  }
}

export const assertNoConflictingSharedViaDimensions = ({
  outputPcbTraces,
  ...viaRenderOptions
}: AutoroutedViaRenderOptions & {
  outputPcbTraces: readonly (PcbTrace | PcbVia)[]
}) => {
  const viaDimensionsByLogicalKey = new Map<
    string,
    { holeDiameter: number; outerDiameter: number }
  >()

  for (const pcbTrace of outputPcbTraces) {
    if (pcbTrace.type !== "pcb_trace") continue
    for (const routePoint of pcbTrace.route) {
      if (routePoint.route_type !== "via") continue
      const viaMetadata = getAutoroutedViaRenderMetadata({
        pcbTraceId: pcbTrace.pcb_trace_id,
        point: routePoint as AutoroutedViaPoint,
        ...viaRenderOptions,
      })
      const existingDimensions = viaDimensionsByLogicalKey.get(
        viaMetadata.logicalKey,
      )
      if (
        existingDimensions &&
        (existingDimensions.holeDiameter !== viaMetadata.holeDiameter ||
          existingDimensions.outerDiameter !== viaMetadata.outerDiameter)
      ) {
        throw new Error(
          `Autorouter returned conflicting dimensions for shared via ${viaMetadata.logicalKey}`,
        )
      }
      viaDimensionsByLogicalKey.set(viaMetadata.logicalKey, {
        holeDiameter: viaMetadata.holeDiameter,
        outerDiameter: viaMetadata.outerDiameter,
      })
    }
  }
}
