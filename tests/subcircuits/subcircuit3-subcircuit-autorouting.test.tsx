import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("simple resistor on a board", async () => {
  const { circuit } = await getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm" autorouter="auto-cloud">
      <subcircuit name="S1" autorouter="auto-cloud">
        <resistor
          resistance="1k"
          footprint="0402"
          name="R1"
          schX={3}
          pcbX={3}
        />
        <resistor
          resistance="1k"
          footprint="0402"
          name="R2"
          schX={3}
          pcbX={3}
          pcbY={2}
        />
        <trace from=".R1 .pin1" to=".R2 .pin2" />
      </subcircuit>
      <subcircuit name="S2">
        <capacitor
          capacitance="1000pF"
          footprint="0603"
          name="C1"
          schX={-3}
          pcbX={-3}
        />
        <trace from=".C1 .pin1" to=".C1 .pin2" />
      </subcircuit>
      <trace from=".S1 .R1 > .pin1" to=".S2 .C1 > .pin1" />
    </board>,
  )

  // Render the circuit
  circuit.render()

  // Check if the circuit matches the expected PCB snapshot
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
