import { expect, test } from "bun:test"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"
import { differentialPairPathPads } from "tests/fixtures/differential-pair-path-pads"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("rejects preserved pair copper before it can disappear from the routing request", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={16} height={10} schematicDisabled autorouter="auto_local">
      <chip name="J1" pcbX={-5} footprint={differentialPairPathPads()} />
      <chip name="MCU" pcbX={5} footprint={differentialPairPathPads()} />
      <trace name="P" from=".J1 > .pin1" to=".MCU > .pin1" />
      <trace name="N" from=".J1 > .pin2" to=".MCU > .pin2" />
      <differentialpair
        name="USB"
        positiveConnection="P"
        negativeConnection="N"
        maxLengthSkew={0}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  expect(circuit.db.pcb_trace.list()).toHaveLength(2)
  expect(() =>
    getSimpleRouteJsonFromCircuitJson({
      circuitJson: circuit.getCircuitJson(),
    }),
  ).toThrow("phased, preserved and breakout splitting is unsupported")
})
