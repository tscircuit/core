import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("schematic traces routing through symbols - horz", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <resistor resistance="1k" footprint="0402" name="R1" schX={-3} pcbX={3} />
      <capacitor
        capacitance="1000pF"
        footprint="0402"
        name="C1"
        schX={3}
        pcbX={-3}
      />
      <trace from=".R1 > .pin1" to=".C1 > .pin1" />
    </board>,
  )

  circuit.render()

  expect(circuit).toMatchSchematicSnapshot(import.meta.path + "horz")
})

test("schematic traces routing through symbols - vert", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <resistor
        resistance="1k"
        footprint="0402"
        name="R1"
        schRotation={90}
        schY={-1}
        pcbY={1}
      />
      <capacitor
        capacitance="1000pF"
        footprint="0402"
        name="C1"
        schRotation={90}
        schY={1}
        pcbY={-1}
      />
      <trace from=".R1 > .pin2" to=".C1 > .pin2" />
    </board>,
  )

  circuit.render()

  expect(circuit).toMatchSchematicSnapshot(import.meta.path + "vert")
})
