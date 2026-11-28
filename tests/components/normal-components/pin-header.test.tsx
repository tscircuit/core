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

it("handles holeDiameter or platedDiameter independently in implied footprint", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm">
      <pinheader name="P_ID" pinCount={2} pitch="2.54mm" holeDiameter="1mm" />
      <pinheader
        name="P_OD"
        pinCount={2}
        pitch="2.54mm"
        platedDiameter="1.8mm"
      />
      <pinheader name="P_NO_PITCH" pinCount={2} holeDiameter="1.1mm" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const platedHoles = circuit.db.pcb_plated_hole.list()
  expect(platedHoles).toHaveLength(6)
  expect(
    platedHoles.some((h) => Math.abs((h.hole_diameter ?? 0) - 1) < 0.01),
  ).toBe(true)
  expect(
    platedHoles.some((h) => Math.abs((h.outer_diameter ?? 0) - 1.8) < 0.01),
  ).toBe(true)
  expect(
    platedHoles.some((h) => Math.abs((h.hole_diameter ?? 0) - 1.1) < 0.01),
  ).toBe(true)
})
