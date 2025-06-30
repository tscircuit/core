import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("nc net labels become symbols", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <resistor
        name="R1"
        resistance="10k"
        footprint="0402"
        schX={0}
        schY={0}
        schRotation="90deg"
      />
      <trace from=".R1 > .pin1" to="net.NC" />
    </board>,
  )

  circuit.render()

  const labels = circuit.db.schematic_net_label.list()
  expect(labels).toHaveLength(1)
  expect(labels[0].symbol_name).toBe("not_connected")
  expect(labels[0].text).toBe("NC")

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
