import { expect, test } from "bun:test"
import { Group_filterSimpleRouteJsonForPhase } from "lib/components/primitive-components/Group/Group_phasedAutoroutingUtils"
import type { RoutingPhasePlan } from "lib/components/primitive-components/Group/GroupRoutingPhasePlan"
import { Trace } from "lib/components/primitive-components/Trace/Trace"
import type { SimpleRouteJson } from "lib/utils/autorouting/SimpleRouteJson"

test("phased autorouting expands substituted bounds around phase connection points", () => {
  const phaseTrace = new Trace({
    name: "DISPLAY_DATA",
    from: ".U1 > .pin1",
    to: ".J1 > .pin1",
  })
  phaseTrace.source_trace_id = "source_trace_display_data"

  const unrelatedTrace = new Trace({
    name: "UNRELATED",
    from: ".U2 > .pin1",
    to: ".J2 > .pin1",
  })
  unrelatedTrace.source_trace_id = "source_trace_unrelated"

  const simpleRouteJson: SimpleRouteJson = {
    layerCount: 2,
    minTraceWidth: 0.1,
    obstacles: [],
    connections: [
      {
        name: "source_trace_display_data",
        source_trace_id: "source_trace_display_data",
        pointsToConnect: [
          { x: -2.25, y: 0, layer: "top" },
          { x: 0, y: 1.5, layer: "top" },
        ],
      },
      {
        name: "source_trace_unrelated",
        source_trace_id: "source_trace_unrelated",
        pointsToConnect: [
          { x: 50, y: 50, layer: "top" },
          { x: 51, y: 50, layer: "top" },
        ],
      },
    ],
    bounds: { minX: -10, maxX: 10, minY: -10, maxY: 10 },
  }

  const phasePlan: RoutingPhasePlan = {
    routingPhaseIndex: 0,
    routingBounds: { minX: -1, maxX: 1, minY: -1, maxY: 1 },
    traces: [phaseTrace],
    nets: [],
  }

  const phaseInput = Group_filterSimpleRouteJsonForPhase(
    simpleRouteJson,
    phasePlan,
  )

  expect(phaseInput.bounds).toEqual({
    minX: -2.25,
    maxX: 1,
    minY: -1,
    maxY: 1.5,
  })
  expect(phaseInput.connections.map((connection) => connection.name)).toEqual([
    "source_trace_display_data",
  ])
})
