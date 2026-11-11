import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("rejects a zero-terminal hop before routing", (): void => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="14mm" routingDisabled>
      <differentialpair
        maxLengthSkew={0.1}
        name="USB_DATA"
        positiveConnection="DP_EMPTY"
        negativeConnection="DM"
      />
      <chip name="J1" footprint="soic8" pcbX={-6} />
      <chip name="U1" footprint="soic8" pcbX={6} />
      <trace name="DP_EMPTY" from="net.DP" to="net.DP" />
      <trace name="DM" from=".J1 > .pin2" to=".U1 > .pin2" />
    </board>,
  )

  expect(() => circuit.render()).toThrow("exactly two distinct ports")
})
