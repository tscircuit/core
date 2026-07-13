import { expect, it } from "bun:test"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

it("throws when a differential pair references a missing trace", (): void => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="10mm" routingDisabled>
      <differentialpair
        name="USB"
        positiveConnection="USB_P_MISSING"
        negativeConnection="USB_N"
      />
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={-4} />
      <led name="LED1" footprint="0402" pcbX={4} />
      <trace name="USB_N" from=".R1 > .pin1" to=".LED1 > .anode" />
    </board>,
  )

  circuit.render()

  const subcircuitComponent = circuit.firstChild
  if (!subcircuitComponent) {
    throw new Error("Expected the circuit to contain a board")
  }

  expect((): void => {
    getSimpleRouteJsonFromCircuitJson({
      circuitJson: circuit.getCircuitJson(),
      subcircuitComponent,
    })
  }).toThrow(
    'Could not find source trace "USB_P_MISSING" for differential pair "USB"',
  )
})
