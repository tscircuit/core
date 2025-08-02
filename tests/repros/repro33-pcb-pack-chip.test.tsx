import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

// Reproduction for pcb packing with chain including a chip

test("pcb pack layout with chip chain repro", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board pcbPack pcbGap="1mm">
      <chip name="U1" footprint="soic8" connections={{ pin1: "R1.pin1" }} />
      <resistor name="R1" resistance="1k" footprint="0402" />
      <resistor
        name="R2"
        resistance="2.2k"
        footprint="0605"
        connections={{ pin1: "R1.pin2" }}
      />
      <capacitor
        name="C1"
        capacitance="100nF"
        footprint="0402"
        connections={{ pin1: "R2.pin2" }}
      />
      <capacitor
        name="C2"
        capacitance="10uF"
        footprint="0402"
        connections={{ pin1: "C1.pin2" }}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
