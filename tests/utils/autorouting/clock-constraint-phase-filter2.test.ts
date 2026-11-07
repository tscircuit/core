import { expect, test } from "bun:test"
import { Group_filterSimpleRouteJsonForPhase } from "lib/components/primitive-components/Group/Group_phasedAutoroutingUtils"
import { Trace } from "lib/components/primitive-components/Trace/Trace"

const createPhaseTrace = (sourceTraceId: string) => {
  const trace = new Trace({ from: ".U1 > .pin1", to: ".Y1 > .pin1" })
  trace.source_trace_id = sourceTraceId
  return trace
}

test("phase fallback prefers the owning branch, then the tightest branch, over list order", () => {
  const pointA = { x: 0, y: 0, layer: "top", pointId: "a" }
  const pointB = { x: 2, y: 0, layer: "top", pointId: "b" }
  const pointE = { x: 3, y: 0, layer: "top", pointId: "e" }
  const pointF = { x: 4, y: 0, layer: "top", pointId: "f" }
  const input = {
    layerCount: 2,
    minTraceWidth: 0.1,
    obstacles: [],
    bounds: { minX: -5, maxX: 5, minY: -5, maxY: 5 },
    connections: [
      // Listed first and containing both terminals: a first-match fallback
      // would wrongly attach both rules here.
      {
        name: "wide",
        source_trace_id: "wide",
        pointsToConnect: [pointA, pointB, pointE, pointF],
      },
      // The tightest match, but it does not own the clock rule.
      {
        name: "sibling",
        source_trace_id: "sibling",
        pointsToConnect: [pointA, pointB],
      },
      {
        name: "clock_branch",
        source_trace_id: "clock",
        pointsToConnect: [pointA, pointB, pointE],
      },
    ],
    routeConstraints: [
      {
        connectionName: "clock_net",
        sourceTraceId: "clock",
        pointIds: ["a", "b"],
        maxViaCount: 0,
        maxLength: 6,
      },
      // No phase connection belongs to this trace, so the tightest one wins.
      {
        connectionName: "unowned_net",
        sourceTraceId: "unowned",
        pointIds: ["a", "b"],
        maxLength: 8,
      },
    ],
  }
  const phase = Group_filterSimpleRouteJsonForPhase(input, {
    routingPhaseIndex: 0,
    traces: ["wide", "sibling", "clock"].map(createPhaseTrace),
    nets: [],
  })
  expect(phase.routeConstraints).toEqual([
    { ...input.routeConstraints[0]!, connectionName: "clock_branch" },
    { ...input.routeConstraints[1]!, connectionName: "sibling" },
  ])
})
