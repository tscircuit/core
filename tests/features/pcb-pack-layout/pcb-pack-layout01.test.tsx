import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { writeGlobalDebugGraphics } from "tests/fixtures/writeGlobalDebugGraphics"

test("pcb-pack-layout01", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board pack gap="1.5mm">
      <chip footprint="soic8" name="U1" />
      <resistor
        footprint="0402"
        name="R1"
        resistance="1k"
        connections={{
          pin1: "U1.pin1",
        }}
      />
      <capacitor
        footprint="0603"
        name="C1"
        capacitance="100nF"
        connections={{
          pin1: "U1.pin5",
        }}
      />
    </board>,
  )

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
  writeGlobalDebugGraphics()
})
