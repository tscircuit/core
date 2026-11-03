import { expect, test } from "bun:test"
import { Group_filterSimpleRouteJsonForPhase } from "lib/components/primitive-components/Group/Group_phasedAutoroutingUtils"
import { Trace } from "lib/components/primitive-components/Trace/Trace"
import type { SimpleRouteJson } from "lib/utils/autorouting/SimpleRouteJson"

test("routing phases retain only the clock rules for their included connections", () => {
  const trace = new Trace({
    name: "X48_N",
    from: ".U1 > .X48N",
    to: ".Y1 > .pin3",
  })
  trace.source_trace_id = "clock"
  const input: SimpleRouteJson = {
    layerCount: 2,
    minTraceWidth: 0.1,
    obstacles: [],
    bounds: { minX: -5, maxX: 5, minY: -5, maxY: 5 },
    connections: [
      {
        name: "clock",
        pointsToConnect: [
          { x: 0, y: 0, layer: "top", pointId: "a" },
          { x: 2, y: 0, layer: "top", pointId: "b" },
        ],
      },
      {
        name: "other",
        pointsToConnect: [
          { x: 0, y: 2, layer: "top", pointId: "c" },
          { x: 2, y: 2, layer: "top", pointId: "d" },
        ],
      },
    ],
    routeConstraints: [
      {
        connectionName: "clock",
        sourceTraceId: "clock",
        pointIds: ["a", "b"],
        maxViaCount: 0,
        maxLength: 6,
      },
      {
        connectionName: "other",
        sourceTraceId: "other",
        pointIds: ["c"],
        maxLength: 1,
      },
    ],
  }
  const original = structuredClone(input)
  const phase = Group_filterSimpleRouteJsonForPhase(input, {
    routingPhaseIndex: 0,
    traces: [trace],
    nets: [],
  })
  expect(phase.routeConstraints).toEqual([input.routeConstraints![0]!])
  expect(input).toEqual(original)
})
