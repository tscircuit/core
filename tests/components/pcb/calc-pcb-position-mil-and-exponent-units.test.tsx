import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("pcb calc accepts mil units and near-zero exponent coordinates", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <platedhole
        name="H1"
        shape="circle"
        holeDiameter="0.5mm"
        outerDiameter="1mm"
        pcbX="100mil"
        pcbY="50mil"
      />
      <platedhole
        name="H2"
        shape="circle"
        holeDiameter="0.5mm"
        outerDiameter="1mm"
        pcbX="1.1368683772161603e-13mm"
        pcbY="calc(2.5E+2mil)"
      />
    </board>,
  )

  circuit.render()

  const invalidPropertyErrors =
    circuit.db.source_invalid_component_property_error.list()
  expect(invalidPropertyErrors).toHaveLength(0)

  const platedHoles = circuit.db.pcb_plated_hole.list()
  expect(platedHoles).toHaveLength(2)

  // 100mil === 2.54mm, 50mil === 1.27mm
  expect(platedHoles[0].x).toBeCloseTo(2.54, 5)
  expect(platedHoles[0].y).toBeCloseTo(1.27, 5)

  // near-zero exponent resolves to ~0, 250mil === 6.35mm
  expect(platedHoles[1].x).toBeCloseTo(0, 9)
  expect(platedHoles[1].y).toBeCloseTo(6.35, 5)

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
