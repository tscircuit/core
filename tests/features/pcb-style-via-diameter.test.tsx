import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

/**
 * Verify that pcbStyle provides default via diameters when unspecified
 */
test("pcbStyle sets default via diameters", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board
      width="20mm"
      height="20mm"
      pcbStyle={{ viaPadDiameter: "0.8mm", viaHoleDiameter: "0.35mm" }}
    >
      <via pcbX={0} pcbY={0} fromLayer="top" toLayer="bottom" />
      <via
        pcbX={2}
        pcbY={0}
        fromLayer="top"
        toLayer="bottom"
        outerDiameter="0.55mm"
        holeDiameter="0.25mm"
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const vias = circuit.db.pcb_via.list()
  const styledVia = vias.find((via) => via.x === 0 && via.y === 0)
  const explicitVia = vias.find((via) => via.x === 2 && via.y === 0)

  expect(styledVia?.outer_diameter).toBeCloseTo(0.8, 5)
  expect(styledVia?.hole_diameter).toBeCloseTo(0.35, 5)

  expect(explicitVia?.outer_diameter).toBeCloseTo(0.55, 5)
  expect(explicitVia?.hole_diameter).toBeCloseTo(0.25, 5)
})
