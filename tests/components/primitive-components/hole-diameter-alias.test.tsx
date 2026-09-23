import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("<hole holeDiameter> is accepted as an alias of diameter", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      {/* @ts-expect-error holeDiameter is an alias of diameter */}
      <hole name="H1" holeDiameter="3.2mm" pcbX={-2} pcbY={1} />
    </board>,
  )

  circuit.render()

  const pcbHoles = circuit.db.pcb_hole.list()

  expect(pcbHoles.length).toBe(1)
  expect((pcbHoles[0] as any).hole_diameter).toBeCloseTo(3.2)
  expect(pcbHoles[0].x).toBe(-2)
  expect(pcbHoles[0].y).toBe(1)

  expect(circuit.getCircuitJson()).toMatchPcbSnapshot(import.meta.path)
})
