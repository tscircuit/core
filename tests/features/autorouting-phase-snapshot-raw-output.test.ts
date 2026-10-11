import { expect, test } from "bun:test"
import type { SimpleRouteJson } from "lib/utils/autorouting/SimpleRouteJson"
import type { AutoroutingPhaseIo } from "tests/fixtures/create-autorouting-phase-io-stack"
import "tests/fixtures/extend-expect-autorouting-phases-snapshot"

test("phase snapshots can show omitted input copper without reconstructing it", async () => {
  // SRJ route positions are board-world points in mm, +X right and +Y up.
  const startSimpleRouteJson: SimpleRouteJson = {
    layerCount: 2,
    minTraceWidth: 0.15,
    bounds: { minX: -6, maxX: 6, minY: -4, maxY: 4 },
    obstacles: [],
    connections: [],
    traces: [
      {
        type: "pcb_trace",
        pcb_trace_id: "earlier_phase_trace",
        route: [
          { route_type: "wire", x: -4, y: 0, width: 0.3, layer: "top" },
          { route_type: "wire", x: 4, y: 0, width: 0.3, layer: "top" },
        ],
      },
    ],
  }
  const phaseIo: AutoroutingPhaseIo[] = [
    {
      startSimpleRouteJson,
      endSimpleRouteJson: { ...startSimpleRouteJson, traces: [] },
    },
  ]
  const originalPhaseIo = structuredClone(phaseIo)

  await expect(phaseIo).toMatchAutoroutingPhaseIoStackSnapshot(
    import.meta.path,
    "autorouting-phase-snapshot-with-preloaded-traces",
    undefined,
    { diffThresholdPercent: 0 },
  )
  await expect(phaseIo).toMatchAutoroutingPhaseIoStackSnapshot(
    import.meta.path,
    "autorouting-phase-snapshot-raw-output",
    undefined,
    { includePreloadedTraces: false, diffThresholdPercent: 0 },
  )
  expect(phaseIo).toEqual(originalPhaseIo)
})
