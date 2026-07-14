import { expect, test } from "bun:test"
import { Group_filterSimpleRouteJsonForPhase } from "lib/components/primitive-components/Group/Group_phasedAutoroutingUtils"
import type { RoutingPhasePlan } from "lib/components/primitive-components/Group/GroupRoutingPhasePlan"
import { Trace } from "lib/components/primitive-components/Trace/Trace"
import type { SimpleRouteJson } from "lib/utils/autorouting/SimpleRouteJson"

test("phased autorouting keeps differential pairs together", (): void => {
  const positiveTrace = new Trace({
    name: "USB_P",
    from: ".R1 > .pin1",
    to: ".LED1 > .anode",
  })
  positiveTrace.source_trace_id = "source_trace_positive"

  const negativeTrace = new Trace({
    name: "USB_N",
    from: ".R2 > .pin1",
    to: ".LED2 > .anode",
  })
  negativeTrace.source_trace_id = "source_trace_negative"

  const unrelatedTrace = new Trace({
    name: "STATUS",
    from: ".R3 > .pin1",
    to: ".LED3 > .anode",
  })
  unrelatedTrace.source_trace_id = "source_trace_unrelated"

  const simpleRouteJson: SimpleRouteJson = {
    layerCount: 2,
    minTraceWidth: 0.1,
    obstacles: [],
    connections: [
      {
        name: "source_trace_positive",
        source_trace_id: "source_trace_positive",
        pointsToConnect: [],
      },
      {
        name: "source_trace_negative",
        source_trace_id: "source_trace_negative",
        pointsToConnect: [],
      },
      {
        name: "source_trace_unrelated",
        source_trace_id: "source_trace_unrelated",
        pointsToConnect: [],
      },
    ],
    differentialPairs: [
      {
        connectionNames: ["source_trace_positive", "source_trace_negative"],
        lengthTolerance: 0.05,
      },
    ],
    bounds: { minX: -10, maxX: 10, minY: -5, maxY: 5 },
  }

  const completePairPhase: RoutingPhasePlan = {
    routingPhaseIndex: 0,
    traces: [positiveTrace, negativeTrace],
    nets: [],
  }
  const completePairInput: SimpleRouteJson =
    Group_filterSimpleRouteJsonForPhase(simpleRouteJson, completePairPhase)
  expect(completePairInput.differentialPairs).toEqual(
    simpleRouteJson.differentialPairs,
  )

  const unrelatedPhase: RoutingPhasePlan = {
    routingPhaseIndex: 1,
    traces: [unrelatedTrace],
    nets: [],
  }
  const unrelatedInput: SimpleRouteJson = Group_filterSimpleRouteJsonForPhase(
    simpleRouteJson,
    unrelatedPhase,
  )
  expect(unrelatedInput.differentialPairs).toBeUndefined()

  const splitPairPhase: RoutingPhasePlan = {
    routingPhaseIndex: 2,
    traces: [positiveTrace],
    nets: [],
  }
  expect((): void => {
    Group_filterSimpleRouteJsonForPhase(simpleRouteJson, splitPairPhase)
  }).toThrow(
    'Differential pair "source_trace_positive/source_trace_negative" cannot be split across autorouting phases',
  )
})
