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

it("supports record-style pinLabels", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <pinheader
        name="P2"
        pinCount={2}
        pinLabels={{ 1: "VCC", 2: "GND" }}
        pitch="2.54mm"
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const platedHoles = circuit.db.pcb_plated_hole.list()
  expect(platedHoles).toHaveLength(2)
})
