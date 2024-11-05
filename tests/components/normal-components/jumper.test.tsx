import { it, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

it("should render a jumper with pinrow4 footprint", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <jumper
        name="J1"
        footprint="pinrow4"
        pcbX={0}
        pcbY={0}
        schX={0}
        schY={0}
      />
    </board>,
  )

  circuit.render()

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
