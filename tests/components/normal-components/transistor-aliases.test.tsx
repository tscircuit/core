import { it, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

it("should generate transistor pcb ports aliases", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <transistor name="Q1" type="npn" footprint="sot23" pcbX={2} pcbY={0} />
    </board>,
  )

  circuit.render()

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})

it("pnp transistor collector pin mapping", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <resistor name="R1" resistance="10k" footprint="0402" schX={-2} />
      <transistor name="Q1" type="npn" footprint="sot23" schX={2} />
      <trace from=".Q1 > .collector" to=".R1 > .pin1" />
    </board>,
  )

  circuit.render()

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
