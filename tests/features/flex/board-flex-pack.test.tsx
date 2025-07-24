import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("board-flex-with-pack-groups", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board
      flex
      width="20mm"
      height="10mm"
      justifyContent="space-between"
      routingDisabled
    >
      <group subcircuit pack gap="2mm">
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
      </group>
      <group subcircuit pack gap="2mm">
        <chip footprint="soic8" name="U2" />
        <resistor
          footprint="0402"
          name="R2"
          resistance="1k"
          connections={{
            pin1: "U2.pin1",
          }}
        />
        <capacitor
          footprint="0603"
          name="C2"
          capacitance="100nF"
          connections={{
            pin1: "U2.pin5",
          }}
        />
      </group>
    </board>,
  )

  circuit.render()

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
