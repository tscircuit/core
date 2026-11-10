import { expect, test } from "bun:test"
import { Group_filterSimpleRouteJsonForPhase } from "lib/components/primitive-components/Group/Group_phasedAutoroutingUtils"
import type { Trace } from "lib/components/primitive-components/Trace/Trace"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"
import { DifferentialPairValidationBoard } from "tests/fixtures/differential-pair-validation-board"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("phase filtering retains complete multi-hop pairs and rejects a partially selected lane", () => {
  const { circuit } = getTestFixture()
  circuit.add(<DifferentialPairValidationBoard><differentialpair name="USB" positiveConnection={["DP1", "DP2"]} negativeConnection={["DM1", "DM2"]} maxLengthSkew={0.1} /></DifferentialPairValidationBoard>)
  circuit.render()
  const srj = getSimpleRouteJsonFromCircuitJson({ db: circuit.db }).simpleRouteJson
  const traces = circuit.firstChild!.selectAll<Trace>("trace")
  expect(Group_filterSimpleRouteJsonForPhase(srj, { routingPhaseIndex: 0, traces, nets: [] }).differentialPairs).toEqual(srj.differentialPairs)
  expect(Group_filterSimpleRouteJsonForPhase(srj, { routingPhaseIndex: 1, traces: [], nets: [] }).differentialPairs).toBeUndefined()
  expect(() => Group_filterSimpleRouteJsonForPhase(srj, { routingPhaseIndex: 0, traces: traces.slice(0, 1), nets: [] })).toThrow("cannot be split across autorouting phases")
})
