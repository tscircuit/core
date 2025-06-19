import { it, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

it("should render a pinheader with pinrow4 footprint", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <pinheader
        name="P1"
        pinCount={4}
        footprint="pinrow4"
        schRotation={90}
        facingDirection="left"
        schWidth={2}
      />
    </board>,
  )

  circuit.render()

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
