import { expect, test } from "bun:test"
import { TscircuitAutorouter } from "lib/utils/autorouting/CapacityMeshAutorouter"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"
import { NoMeanderDifferentialPairBoard } from "tests/fixtures/no-meander-differential-pair-board"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("synchronous local routing preserves the structured measured skew failure", () => {
  const { circuit } = getTestFixture()
  circuit.add(<NoMeanderDifferentialPairBoard routingDisabled />)
  circuit.render()
  const { simpleRouteJson } = getSimpleRouteJsonFromCircuitJson({
    db: circuit.db,
  })
  const autorouter = new TscircuitAutorouter(simpleRouteJson)
  expect(() => autorouter.solveSync()).toThrow()
  expect(autorouter.routingFailure?.reason).toBe("length_skew")
  if (autorouter.routingFailure?.reason !== "length_skew")
    throw new Error("Expected measured lane skew")
  expect(autorouter.routingFailure.pairIndex).toBe(0)
  expect(autorouter.routingFailure.laneLengthsMm[0]).toBeCloseTo(21.2)
  expect(autorouter.routingFailure.laneLengthsMm[1]).toBeCloseTo(20)
  expect(JSON.parse(JSON.stringify(autorouter.routingFailure))).toEqual(
    autorouter.routingFailure,
  )
})
