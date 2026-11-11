import { expect, test } from "bun:test"
import { differentialPairPathPads } from "tests/fixtures/differential-pair-path-pads"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("rejects a four-terminal choke as an unsupported series bridge", () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={24} height={14} routingDisabled schematicDisabled>
      <chip name="J1" pcbX={-7} footprint={differentialPairPathPads()} />
      <chip name="MCU" pcbX={7} footprint={differentialPairPathPads()} />
      <chip name="CHOKE" footprint="soic4" />
      <trace name="DP1" from=".J1 > .pin1" to=".CHOKE > .pin1" />
      <trace name="DP2" from=".CHOKE > .pin4" to=".MCU > .pin1" />
      <trace name="DM1" from=".J1 > .pin2" to=".CHOKE > .pin2" />
      <trace name="DM2" from=".CHOKE > .pin3" to=".MCU > .pin2" />
      <differentialpair
        name="USB"
        positiveConnection={["DP1", "DP2"]}
        negativeConnection={["DM1", "DM2"]}
        maxLengthSkew={0.1}
      />
    </board>,
  )
  expect(() => circuit.render()).toThrow(
    "Unsupported bridge (including chips and chokes)",
  )
})
