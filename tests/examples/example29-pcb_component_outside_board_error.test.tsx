import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test.skip("example29: component outside board", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width={6} height={6} routingDisabled>
      <resistor
        resistance="1k"
        footprint="0402"
        name="R1"
        connections={{ pin2: "net.VCC" }}
      />
      <capacitor
        capacitance="1000pF"
        footprint="0402"
        name="C1"
        pcbX={6}
        pcbY={0}
        connections={{ pin2: "net.GND" }}
      />
      <chip
        name="U1"
        footprint="soic8"
        connections={{ pin1: "R1.pin1", pin4: "C1.pin1" }}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  const errors = circuit
    .getCircuitJson()
    .filter((e) => e.type === "pcb_component_outside_board_error")
  expect(errors.length).toBe(1)
  expect(errors[0].pcb_component_id).toBe("pcb_component_1")
  expect(errors[0].message).toMatch(/extends outside board boundaries/)
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
