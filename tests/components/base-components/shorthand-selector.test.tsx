import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

// Verify that shorthand selectors like "R1.1" or "LED1.pos" work

test("shorthand selectors resolve correctly", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <resistor name="R1" resistance="10k" footprint="0402" />
      <led name="LED1" footprint="0402" />
      <trace from="R1.1" to="LED1.pos" />
    </board>,
  )

  circuit.render()

  const shorthandPort = circuit.selectOne("R1.1") as any
  const explicitPort = circuit.selectOne(".R1 > .pin1") as any
  expect(shorthandPort).not.toBeNull()
  expect(explicitPort).not.toBeNull()
  expect(shorthandPort!.pcb_port_id).toBe(explicitPort!.pcb_port_id)
})

test("shorthand selector errors use original selector", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <resistor name="R1" resistance="10k" footprint="0402" />
      <trace from="R1.3" to="net.GND" />
    </board>,
  )

  const circuitJson = circuit.getCircuitJson()
  const errors = circuitJson.filter(
    (c: any) => c.type === "source_trace_not_connected",
  )

  expect(errors.length).toBe(1)

  expect((errors[0] as any).message).toBe(
    'Could not find port for selector "R1.3". Component "R1" found, but does not have pin "3". It has [pin1, anode, pos, left, 1, pin2, cathode, neg, right, 2]',
  )
})
