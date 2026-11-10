import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("rejects a named fragment instead of warning about ambiguous net membership", (): void => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="14mm" routingDisabled>
      <differentialpair
        maxLengthSkew={0.1}
        name="USB_DATA"
        positiveConnection="DP_FROM_J1"
        negativeConnection="DM"
      />
      <chip name="J1" footprint="soic8" pcbX={-7} />
      <chip name="U1" footprint="soic8" pcbX={2} />
      <testpoint name="TP1" footprintVariant="pad" pcbX={7} />
      <trace name="DP_FROM_J1" from=".J1 > .pin1" to="net.DP" />
      <trace from="net.DP" to=".U1 > .pin1" />
      <trace from="net.DP" to=".TP1 > .pin1" />
      <trace name="DM" from=".J1 > .pin2" to=".U1 > .pin2" />
    </board>,
  )

  expect(() => circuit.render()).toThrow("exactly two distinct ports")
})
