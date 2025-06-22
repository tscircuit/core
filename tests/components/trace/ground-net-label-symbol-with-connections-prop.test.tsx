import { test, expect } from "bun:test"
import { sel } from "lib/sel"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("ground net labels with schDisplayLabel become symbols", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <solderjumper
        name="R1"
        pinCount={2}
        footprint="0402"
        schX={0}
        schY={0}
        schRotation="90deg"
        connections={{
          pin1: [sel.net.GND],
          pin2: sel.net.VCC,
        }}
      />
    </board>,
  )

  circuit.render()

  const labels = circuit.db.schematic_net_label.list()
  expect(labels).toHaveLength(2)
  expect(labels[0].symbol_name).toBe("ground_down")
  expect(labels[0].text).toBe("GND")

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
