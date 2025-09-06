import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("repro53: connectivity id in schematic trace", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board>
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
        connections={{ pin2: "net.GND" }}
      />
      <chip
        name="U1"
        footprint="soic8"
        connections={{ pin1: "R1.pin1", pin4: "C1.pin1" }}
      />
    </board>,
  )

  circuit.render()

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
