import { expect, it } from "bun:test"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

it("throws when a differential pair port selector has no trace", (): void => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="10mm" routingDisabled>
      <differentialpair
        maxLengthSkew={0.1}
        name="USB"
        positiveConnection=".R1 > .pin1"
        negativeConnection="USB_N"
      />
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={-6} />
      <resistor name="R2" resistance="1k" footprint="0402" pcbX={-4} />
      <led name="LED2" footprint="0402" pcbX={6} />
      <trace name="USB_N" from=".R2 > .pin1" to=".LED2 > .anode" />
    </board>,
  )

  expect(() => circuit.render()).toThrow("port selector")
})
