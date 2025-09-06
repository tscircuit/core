import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("repro7-rotated-rect-obstacle", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="30mm" height="30mm" autorouter="sequential-trace">
      <resistor
        name="R1"
        resistance="10k"
        footprint="0402"
        pcbX={-6}
        pcbY={0}
      />
      <resistor name="R2" resistance="10k" footprint="0402" pcbX={6} pcbY={0} />
      <trace from=".R1 > .pin2" to=".R2 > .pin1" />

      <chip
        name="obstacle1"
        pcbX={0}
        pcbY={0}
        pcbRotation={33}
        footprint="ms012"
      />

      <resistor
        name="R3"
        resistance="10k"
        footprint="0402"
        pcbX={-6}
        pcbY={-10}
      />
      <resistor
        name="R4"
        resistance="10k"
        footprint="0402"
        pcbX={6}
        pcbY={-10}
      />
      <trace from=".R3 > .pin2" to=".R4 > .pin1" />

      <chip
        name="obstacle2"
        pcbX={0}
        pcbY={-10}
        pcbRotation={140}
        footprint="ms012"
      />
    </board>,
  )

  circuit.render()

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
