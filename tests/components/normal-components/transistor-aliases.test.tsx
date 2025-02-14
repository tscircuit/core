import { it, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

it("should generate transistor pcb ports aliases", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <resistor name="R1" resistance="10k" footprint="0402" pcbX={-3} />
      <transistor name="Q1" type="npn" footprint="sot23" pcbX={2} />
      <trace from=".Q1 > .base" to=".R1 > .pin2" />
    </board>,
  )

  circuit.render()

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
