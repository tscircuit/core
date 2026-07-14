import { expect, it } from "bun:test"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

it("throws when a differential pair uses shorthand for a multi-port component", (): void => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="10mm" routingDisabled>
      <differentialpair
        name="USB"
        positiveConnection="R1"
        negativeConnection="USB_N"
      />
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={-6} />
      <resistor name="R2" resistance="1k" footprint="0402" pcbX={-4} />
      <led name="LED1" footprint="0402" pcbX={4} />
      <led name="LED2" footprint="0402" pcbX={6} />
      <trace name="USB_P" from=".R1 > .pin1" to=".LED1 > .anode" />
      <trace name="USB_N" from=".R2 > .pin1" to=".LED2 > .anode" />
    </board>,
  )

  circuit.render()

  const boardSubcircuit = circuit.firstChild
  if (!boardSubcircuit) {
    throw new Error("Expected the circuit to contain a board")
  }

  expect((): void => {
    getSimpleRouteJsonFromCircuitJson({
      circuitJson: circuit.getCircuitJson(),
      subcircuitComponent: boardSubcircuit,
    })
  }).toThrow(
    'Could not find source trace for trace name or port selector "R1" in differential pair "USB"',
  )
})
