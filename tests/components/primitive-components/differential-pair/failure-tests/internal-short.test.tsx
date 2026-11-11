import { expect, test } from "bun:test"
import { differentialPairPathPads } from "tests/fixtures/differential-pair-path-pads"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("rejects P/N shorts through internally connected pins", () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={20} height={10} schematicDisabled routingDisabled>
      <chip
        name="J1"
        pcbX={-5}
        footprint={differentialPairPathPads()}
        internallyConnectedPins={[["pin1", "pin2"]]}
      />
      <chip name="MCU" pcbX={5} footprint={differentialPairPathPads()} />
      <trace name="P" from=".J1 > .pin1" to=".MCU > .pin1" />
      <trace name="N" from=".J1 > .pin2" to=".MCU > .pin2" />
      <differentialpair
        name="USB"
        positiveConnection="P"
        negativeConnection="N"
        maxLengthSkew={0.1}
      />
    </board>,
  )
  expect(() => circuit.render()).toThrow("electrically shorted")
})
