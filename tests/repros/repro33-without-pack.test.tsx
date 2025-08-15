import { expect, test } from "bun:test"
import { getTestFixture } from "../fixtures/get-test-fixture"

test("Same components without pcbPack to compare orientation", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board>
      <group>
        <chip 
          name="U1"
          footprint="soic8" 
          pinLabels={{ pin1: "VDD", pin2: "GND" }}
        />
        <group schX={2}>
          <resistor
            name="R1" 
            resistance="1k"
            footprint="0402"
            connections={{ pin1: "U1.VDD", pin2: "U1.GND" }}
          />
        </group>
      </group>
    </board>,
  )

  await circuit.renderUntilSettled()
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
