import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("Hole component rendering", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <hole diameter="0.08in" pcbX={3} pcbY={1} />
    </board>,
  )

  circuit.render()

  const pcbHoles = circuit.db.pcb_hole.list()

  expect(pcbHoles.length).toBe(1)
  expect((pcbHoles[0] as any).hole_diameter).toBeCloseTo(2.032)
  expect(pcbHoles[0].x).toBe(3)
  expect(pcbHoles[0].y).toBe(1)

  expect(circuit.getCircuitJson()).toMatchPcbSnapshot(import.meta.path)
})

test("Hole component supports holeDiameter alias", () => {
  const { circuit } = getTestFixture()

  const holeProps: any = {
    name: "H1",
    holeDiameter: "3.2mm",
    pcbX: -5,
    pcbY: 5,
  }

  circuit.add(
    <board width="20mm" height="20mm">
      <hole {...holeProps} />
    </board>,
  )

  circuit.render()

  const pcbHoles = circuit.db.pcb_hole.list()

  expect(pcbHoles.length).toBe(1)
  expect((pcbHoles[0] as any).hole_diameter).toBeCloseTo(3.2)
  expect(pcbHoles[0].x).toBe(-5)
  expect(pcbHoles[0].y).toBe(5)
})
