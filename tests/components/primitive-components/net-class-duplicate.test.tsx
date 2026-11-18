import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("duplicate class names in one subcircuit are rejected", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board routingDisabled>
      <netclass name="Power" traceWidth="0.8mm" nets={["net.VCC"]} />
      <netclass name="Power" traceWidth="0.2mm" nets={["net.GND"]} />
    </board>,
  )
  await expect(circuit.renderUntilSettled()).rejects.toThrow(
    'Net class "Power" is defined more than once',
  )
})
