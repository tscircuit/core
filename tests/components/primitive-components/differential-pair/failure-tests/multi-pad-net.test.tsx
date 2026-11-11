import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { differentialPairPathPads } from "tests/fixtures/differential-pair-path-pads"

test("explains that nets with more than 2 pads are not supported yet", () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={24} height={14} schematicDisabled routingDisabled>
      <chip name="J1" pcbX={-7} footprint={differentialPairPathPads()} />
      <chip name="ESD" footprint={differentialPairPathPads()} />
      <chip name="MCU" pcbX={7} footprint={differentialPairPathPads()} />
      <trace from=".J1 > .pin1" to="net.USB_DP" />
      <trace from=".ESD > .pin1" to="net.USB_DP" />
      <trace from=".MCU > .pin1" to="net.USB_DP" />
      <trace from=".J1 > .pin2" to="net.USB_DM" />
      <trace from=".ESD > .pin2" to="net.USB_DM" />
      <trace from=".MCU > .pin2" to="net.USB_DM" />
      <differentialpair
        name="USB"
        positiveConnection="net.USB_DP"
        negativeConnection="net.USB_DM"
        maxLengthSkew={0.1}
      />
    </board>,
  )
  expect(() => circuit.render()).toThrow(
    "net.USB_DP has 3 pads, so the signal order between them is ambiguous. " +
      "Differential pairs on nets with more than 2 pads aren't supported yet; " +
      'list the traces in signal order instead, e.g. positiveConnection={["DP1","DP2"]}',
  )
})
