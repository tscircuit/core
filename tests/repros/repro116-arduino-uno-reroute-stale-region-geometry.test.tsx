import { expect, test } from "bun:test"
import type { PcbTraceRoutePoint } from "circuit-json"
import {
  type RectRerouteRegion,
  expectArduinoUnoRerouteSvgSnapshot,
  getSourceTraceIdsFromRerouteConnectionName,
  renderArduinoUnoRerouteRegion,
} from "./repro116-arduino-uno-reroute-utils"

const rerouteRegion = {
  shape: "rect" as const,
  minX: -16,
  maxX: -6,
  minY: -2,
  maxY: 8,
}

const pointInsideRegion = (
  point: { x: number; y: number },
  region: RectRerouteRegion,
) =>
  point.x > region.minX + 1e-5 &&
  point.x < region.maxX - 1e-5 &&
  point.y > region.minY + 1e-5 &&
  point.y < region.maxY - 1e-5

const segmentPassesThroughRegion = (
  start: PcbTraceRoutePoint & { route_type: "wire" },
  end: PcbTraceRoutePoint & { route_type: "wire" },
  region: RectRerouteRegion,
) => {
  if (pointInsideRegion(start, region) || pointInsideRegion(end, region)) {
    return true
  }

  for (let index = 1; index < 20; index++) {
    const t = index / 20
    const sample = {
      x: start.x + (end.x - start.x) * t,
      y: start.y + (end.y - start.y) * t,
    }
    if (pointInsideRegion(sample, region)) return true
  }

  return false
}

test("repro116: rerouting imported arduino region should remove original geometry from the replaced region", async () => {
  const { afterRerouteCircuit, beforeRerouteCircuit, phaseInputs } =
    await renderArduinoUnoRerouteRegion({
      label: "STALE GEOMETRY REPRO",
      rerouteRegion,
    })

  expectArduinoUnoRerouteSvgSnapshot({
    afterRerouteCircuit,
    beforeRerouteCircuit,
    importMetaPath: import.meta.path,
    snapshotName: "repro116-arduino-uno-reroute-stale-region-geometry",
  })

  expect(phaseInputs).toHaveLength(1)
  const reroutedSourceTraceIds = new Set(
    phaseInputs[0]!.connections.flatMap((connection) =>
      getSourceTraceIdsFromRerouteConnectionName(connection.name),
    ),
  )

  const staleOriginalSegments = afterRerouteCircuit.db.pcb_trace
    .list()
    .flatMap((trace) => {
      if (!trace.source_trace_id) return []
      if (!reroutedSourceTraceIds.has(trace.source_trace_id)) return []
      if (trace.pcb_trace_id.includes("_reroute_")) return []

      const staleSegments: Array<{
        pcb_trace_id: string
        source_trace_id: string
        start: { x: number; y: number }
        end: { x: number; y: number }
      }> = []

      for (let index = 0; index < trace.route.length - 1; index++) {
        const start = trace.route[index]
        const end = trace.route[index + 1]
        if (start.route_type !== "wire" || end.route_type !== "wire") continue
        if (!segmentPassesThroughRegion(start, end, rerouteRegion)) continue

        staleSegments.push({
          pcb_trace_id: trace.pcb_trace_id,
          source_trace_id: trace.source_trace_id,
          start: {
            x: Number(start.x.toFixed(3)),
            y: Number(start.y.toFixed(3)),
          },
          end: {
            x: Number(end.x.toFixed(3)),
            y: Number(end.y.toFixed(3)),
          },
        })
      }

      return staleSegments
    })

  expect(staleOriginalSegments).toHaveLength(0)
}, 30_000)
