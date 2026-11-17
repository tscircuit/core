import { isDeepStrictEqual } from "node:util"
import {
  layer_ref,
  pcb_trace,
  pcb_via,
  type AnyCircuitElement,
  type PCBTrace,
  type LayerRef,
  type SourceTrace,
  type SourceNet,
  type PcbVia,
} from "circuit-json"
import { getAutoroutedViaLayers } from "lib/utils/getViaSpanLayers"
import type { H3RoutingStage } from "./run"
import type { SimpleRouteJson } from "lib/utils/autorouting/SimpleRouteJson"

type H3SourceConnectionId =
  | SourceTrace["source_trace_id"]
  | SourceNet["source_net_id"]

/** Materialize the stage's actual SRJ copper for diagnostics. Points stay in
 * board-world mm (+X right, +Y up, +Z above), without moving pads or traces.
 * Via spans follow Group._updatePcbTraceRenderFromPcbTraces and the shared
 * getAutoroutedViaLayers policy; a logical transition is not the physical span.
 */
export const getNativeH3SrjCopper = (
  srj: SimpleRouteJson,
): AnyCircuitElement[] => {
  const copper: AnyCircuitElement[] = []
  for (const trace of srj.traces ?? []) {
    copper.push(
      pcb_trace.parse({
        ...trace,
        source_trace_id: trace.connection_name,
      }),
    )
    for (const [pointIndex, point] of trace.route.entries()) {
      if (point.route_type !== "via") continue
      const outerDiameter = point.via_diameter ?? srj.minViaPadDiameter
      const holeDiameter = point.via_hole_diameter ?? srj.minViaHoleDiameter
      if (outerDiameter === undefined || holeDiameter === undefined) {
        throw new Error("Native H3 routed via dimensions are missing")
      }
      const fromLayer = layer_ref.parse(point.from_layer)
      const toLayer = layer_ref.parse(point.to_layer)
      copper.push(
        pcb_via.parse({
          type: "pcb_via",
          pcb_via_id: `h3_stage_${trace.pcb_trace_id}_via_${pointIndex}`,
          pcb_trace_id: trace.pcb_trace_id,
          x: point.x,
          y: point.y,
          outer_diameter: outerDiameter,
          hole_diameter: holeDiameter,
          from_layer: fromLayer,
          to_layer: toLayer,
          layers:
            point.layers !== undefined
              ? point.layers.map((layer) => layer_ref.parse(layer))
              : getAutoroutedViaLayers({
                  fromLayer,
                  toLayer,
                  layerCount: srj.layerCount,
                  allowBlindAndBuriedVias: srj.allowBlindAndBuriedVias,
                }),
        }),
      )
    }
  }
  return copper
}

export const getNativeH3StageCopper = (
  stage: H3RoutingStage,
): AnyCircuitElement[] =>
  stage.end ? getNativeH3SrjCopper(stage.end.simpleRouteJson) : []

/** Physical barrel identity in board-world mm (+X right, +Y up, +Z above).
 * A reversed logical transition does not change its occupied copper layers.
 */
export const getNativeH3ViaCopperKey = (
  via: Pick<PcbVia, "x" | "y" | "outer_diameter" | "hole_diameter" | "layers">,
) =>
  JSON.stringify([
    via.x,
    via.y,
    via.outer_diameter,
    via.hole_diameter,
    [...via.layers].sort(),
  ])

/** Physical segment endpoints are board-world mm, +X right and +Y up.
 * Widths describe the linear copper profile, independent of route direction.
 */
interface NativeCopperSegment {
  layer: LayerRef
  start: { x: number; y: number; width: number }
  end: { x: number; y: number; width: number }
}

const getWireSegments = (trace: PCBTrace): NativeCopperSegment[] =>
  trace.route.flatMap((start, index) => {
    const end = trace.route[index + 1]
    if (
      !end ||
      (start.route_type !== "wire" && start.route_type !== "via") ||
      (end.route_type !== "wire" && end.route_type !== "via")
    )
      return []
    const layer =
      start.route_type === "wire"
        ? start.layer
        : end.route_type === "wire"
          ? end.layer
          : undefined
    if (
      layer === undefined ||
      (start.route_type === "wire" &&
        end.route_type === "wire" &&
        start.layer !== end.layer) ||
      (start.x === end.x && start.y === end.y)
    )
      return []
    const width =
      start.route_type === "wire"
        ? start.width
        : end.route_type === "wire"
          ? end.width
          : undefined
    if (width === undefined) throw new Error("Native H3 wire width is missing")
    const startWidth =
      start.route_type === "wire" && start.width_interpolation_mode
        ? start.start_width
        : width
    const endWidth =
      start.route_type === "wire" && start.width_interpolation_mode
        ? start.end_width
        : trace.route_thickness_mode === "interpolated" &&
            end.route_type === "wire"
          ? end.width
          : width
    if (startWidth === undefined || endWidth === undefined)
      throw new Error("Native H3 taper width is missing")
    return [
      {
        layer,
        start: { x: start.x, y: start.y, width: startWidth },
        end: { x: end.x, y: end.y, width: endWidth },
      },
    ]
  })

// Compare the conductor union rather than its segmentation. Core can split a
// trace into multiple PCB rows or reverse it while preserving the same copper.
const segmentIsCovered = ({
  segment,
  candidates,
}: { segment: NativeCopperSegment; candidates: NativeCopperSegment[] }) => {
  const epsilon = 1e-8
  const dx = segment.end.x - segment.start.x
  const dy = segment.end.y - segment.start.y
  const lengthSquared = dx * dx + dy * dy
  const length = Math.sqrt(lengthSquared)
  const intervals: [number, number][] = []
  for (const candidate of candidates) {
    if (candidate.layer !== segment.layer) continue
    const startX = candidate.start.x - segment.start.x
    const startY = candidate.start.y - segment.start.y
    const endX = candidate.end.x - segment.start.x
    const endY = candidate.end.y - segment.start.y
    if (
      Math.abs(dx * startY - dy * startX) / length > epsilon ||
      Math.abs(dx * endY - dy * endX) / length > epsilon
    )
      continue
    const first = (startX * dx + startY * dy) / lengthSquared
    const last = (endX * dx + endY * dy) / lengthSquared
    const widthAt = (position: number) =>
      segment.start.width + position * (segment.end.width - segment.start.width)
    if (
      Math.abs(candidate.start.width - widthAt(first)) > epsilon ||
      Math.abs(candidate.end.width - widthAt(last)) > epsilon
    )
      continue
    const low = Math.max(0, Math.min(first, last))
    const high = Math.min(1, Math.max(first, last))
    if (high >= low) intervals.push([low, high])
  }
  intervals.sort((first, second) => first[0] - second[0])
  let coveredThrough = 0
  for (const [start, end] of intervals) {
    if (start > coveredThrough + epsilon) return false
    coveredThrough = Math.max(coveredThrough, end)
    if (coveredThrough >= 1 - epsilon) return true
  }
  return false
}

const getPhysicalCopper = (circuitJson: AnyCircuitElement[]) => {
  const wires = circuitJson
    .filter((element) => element.type === "pcb_trace")
    .flatMap(getWireSegments)
  const vias = new Set(
    circuitJson
      .filter((element) => element.type === "pcb_via")
      .map(getNativeH3ViaCopperKey),
  )
  return { wires, vias }
}

/** Compare copper by electrical membership and physical union, never one SRJ
 * row to one PCB row. Core may split/reverse routes and deduplicate shared vias.
 * Every wire width, coordinate, layer, drill diameter and physical via span must
 * remain present on the same net. Extra copper on that net is compared too.
 */
export const getNativeH3CopperPreservation = ({
  stages,
  circuitJson,
}: {
  stages: H3RoutingStage[]
  circuitJson: AnyCircuitElement[]
}) => {
  const byte0Copper = stages[0]?.end?.simpleRouteJson.traces ?? []
  const byte1Copper = stages[1]?.end?.simpleRouteJson.traces ?? []
  const initialToByte0Preserved =
    stages[0]?.end !== undefined &&
    (stages[0].start.simpleRouteJson.traces ?? []).every((trace) =>
      isDeepStrictEqual(
        byte0Copper.find(
          (candidate) => candidate.pcb_trace_id === trace.pcb_trace_id,
        ),
        trace,
      ),
    )
  const byte0ToByte1Preserved =
    byte0Copper.length > 0 &&
    byte0Copper.every(
      (trace) =>
        isDeepStrictEqual(
          stages[1]?.start.simpleRouteJson.traces?.find(
            (candidate) => candidate.pcb_trace_id === trace.pcb_trace_id,
          ),
          trace,
        ) &&
        isDeepStrictEqual(
          byte1Copper.find(
            (candidate) => candidate.pcb_trace_id === trace.pcb_trace_id,
          ),
          trace,
        ),
    )
  const stage = stages[1]
  if (!stage || byte1Copper.length === 0)
    return {
      initialToByte0Preserved,
      byte0ToByte1Preserved,
      byte1ToFinalPreserved: false,
    }
  const expectedCopper = getNativeH3StageCopper(stage)
  const finalTraces = circuitJson.filter(
    (element) => element.type === "pcb_trace",
  )
  const sourceTraces = circuitJson.filter(
    (element) => element.type === "source_trace",
  )
  const byte1ToFinalPreserved = byte1Copper.every((trace) => {
    // Expand the explicit source net/trace membership emitted by Core. Keep
    // identifiers structured; no IDs are used as labels in the diagnostic SVG.
    const sourceIds = new Set<H3SourceConnectionId>(
      [trace.connection_name, ...(trace.connectsTo ?? [])].filter(
        (sourceId): sourceId is H3SourceConnectionId => sourceId !== undefined,
      ),
    )
    for (const sourceTrace of sourceTraces) {
      if (
        sourceIds.has(sourceTrace.source_trace_id) ||
        sourceTrace.connected_source_net_ids?.some((netId) =>
          sourceIds.has(netId),
        )
      ) {
        sourceIds.add(sourceTrace.source_trace_id)
        for (const netId of sourceTrace.connected_source_net_ids ?? [])
          sourceIds.add(netId)
      }
    }
    const netTraceIds = new Set(
      finalTraces
        .filter(
          (candidate) =>
            candidate.source_trace_id &&
            sourceIds.has(candidate.source_trace_id),
        )
        .map((candidate) => candidate.pcb_trace_id),
    )
    if (netTraceIds.size === 0) return false
    const expectedTraceIds = new Set(
      byte1Copper
        .filter(
          (candidate) =>
            (candidate.connection_name !== undefined &&
              sourceIds.has(candidate.connection_name)) ||
            candidate.connectsTo?.some((sourceId) => sourceIds.has(sourceId)),
        )
        .map((candidate) => candidate.pcb_trace_id),
    )
    const expected = getPhysicalCopper(
      expectedCopper.filter((element) =>
        element.type === "pcb_trace"
          ? expectedTraceIds.has(element.pcb_trace_id)
          : element.type === "pcb_via" &&
            !!element.pcb_trace_id &&
            expectedTraceIds.has(element.pcb_trace_id),
      ),
    )
    const actual = getPhysicalCopper(
      circuitJson.filter((element) =>
        element.type === "pcb_trace"
          ? netTraceIds.has(element.pcb_trace_id)
          : element.type === "pcb_via" &&
            !!element.pcb_trace_id &&
            netTraceIds.has(element.pcb_trace_id),
      ),
    )
    return (
      isDeepStrictEqual(actual.vias, expected.vias) &&
      expected.wires.every((segment) =>
        segmentIsCovered({ segment, candidates: actual.wires }),
      ) &&
      actual.wires.every((segment) =>
        segmentIsCovered({ segment, candidates: expected.wires }),
      )
    )
  })
  return {
    initialToByte0Preserved,
    byte0ToByte1Preserved,
    byte1ToFinalPreserved,
  }
}
