import { it, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

it("pnp & npn transistor collector & emitter pin mapping", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="10mm">
      <resistor
        name="R1"
        resistance="10k"
        footprint="0402"
        pcbX={-5}
        pcbY={3}
        schX={-2}
      />
      <transistor
        name="Q1"
        type="npn"
        footprint="sot23"
        pcbX={3}
        pcbY={3}
        schX={2}
      />
      <transistor
        name="Q2"
        type="pnp"
        footprint="sot23"
        pcbX={-3}
        pcbY={-3}
        schX={4}
      />
      <resistor
        name="R2"
        resistance="10k"
        footprint="0402"
        schY={-1}
        schX={0}
        pcbX={5}
        pcbY={-3}
      />
      <trace from=".Q1 > .collector" to=".R1 > .pin1" />
      <trace from=".Q2 > .collector" to=".R1 > .pin2" />
    </board>,
  )

  circuit.render()

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
