import { expect, it } from "bun:test"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

it("throws when a differential pair uses a component selector", (): void => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="10mm" routingDisabled>
      <differentialpair
        maxLengthSkew={0.1}
        name="USB"
        positiveConnection="TP1"
        negativeConnection="USB_N"
      />
      <testpoint name="TP1" footprintVariant="pad" pcbX={-6} />
      <resistor name="R2" resistance="1k" footprint="0402" pcbX={-4} />
      <led name="LED1" footprint="0402" pcbX={4} />
      <led name="LED2" footprint="0402" pcbX={6} />
      <trace name="USB_P" from=".TP1 > .pin1" to=".LED1 > .anode" />
      <trace name="USB_N" from=".R2 > .pin1" to=".LED2 > .anode" />
    </board>,
  )

  expect(() => circuit.render()).toThrow("could not find source trace")
})
