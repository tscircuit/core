import { expect, it } from "bun:test"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

it("throws when a differential pair port selector matches multiple traces", (): void => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="14mm" routingDisabled>
      <differentialpair
        name="USB"
        positiveConnection=".R1 > .pin1"
        negativeConnection="USB_N"
      />
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={-6} pcbY={2} />
      <resistor
        name="R2"
        resistance="1k"
        footprint="0402"
        pcbX={-6}
        pcbY={-3}
      />
      <led name="LED1" footprint="0402" pcbX={6} pcbY={3} />
      <capacitor name="C1" capacitance="1uF" footprint="0402" pcbX={6} />
      <led name="LED2" footprint="0402" pcbX={6} pcbY={-3} />
      <trace name="USB_P_PRIMARY" from=".R1 > .pin1" to=".LED1 > .anode" />
      <trace name="USB_P_BRANCH" from=".R1 > .pin1" to=".C1 > .pin1" />
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
    'Trace name or port selector ".R1 > .pin1" matches multiple source traces for differential pair "USB"',
  )
})
