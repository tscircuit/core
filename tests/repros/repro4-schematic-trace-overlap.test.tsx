import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("repro4 schematic trace overlap", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm">
      <resistor
        name="R1"
        resistance="10k"
        footprint="0402"
        schX={0}
        schY={-2}
      />
      <resistor
        name="R2"
        resistance="10k"
        footprint="0402"
        schX={-2}
        schY={-1}
      />
      <resistor name="R3" resistance="10k" footprint="0402" schX={0} schY={2} />

      <trace from=".R1 > .pin2" to=".R3 > .pin1" />
      <trace from=".R2 > .pin2" to=".R3 > .pin2" />
    </board>,
  )

  circuit.render()

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
