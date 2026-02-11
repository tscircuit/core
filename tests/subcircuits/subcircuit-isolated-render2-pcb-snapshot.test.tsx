import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("isolated subcircuit produces valid pcb snapshot", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm">
      <resistor
        name="R1"
        resistance="1k"
        footprint="0402"
        pcbX={-5}
        schX={-5}
      />
      <subcircuit name="S1" _subcircuitCachingEnabled>
        <resistor
          name="R2"
          resistance="2k"
          footprint="0402"
          pcbX={3}
          schX={3}
        />
        <capacitor
          name="C1"
          capacitance="100nF"
          footprint="0402"
          pcbX={3}
          pcbY={2}
          schX={3}
          schY={2}
        />
      </subcircuit>
    </board>,
  )

  circuit.render()

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
