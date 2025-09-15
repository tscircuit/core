import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

// Ports should start disconnected and become connected after a trace links them

test("schematic_port.is_connected is updated", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <resistor name="R1" resistance="10k" footprint="0402" pcbX={0} pcbY={0} />
      <trace from=".R1 > .pin1" to=".R1 > .pin2" />
    </board>,
  )

  circuit.render()

  const ports = circuit.db.schematic_port.list()
  expect(ports).toHaveLength(2)
  expect(ports.every((p) => p.is_connected)).toBe(true)
})

test("schematic_port.is_connected defaults to false", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <resistor name="R1" resistance="10k" footprint="0402" pcbX={0} pcbY={0} />
    </board>,
  )

  circuit.render()

  const ports = circuit.db.schematic_port.list()
  expect(ports).toHaveLength(2)
  expect(ports.every((p) => p.is_connected === false)).toBe(true)
})
