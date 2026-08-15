import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

/**
 * A cached subcircuit is rendered in isolation and then inflated back into
 * components, so any primitive the inflator does not rebuild disappears from the
 * board. Holes, plated holes and cutouts were absent from the standalone
 * primitive list, which meant enabling subcircuit caching silently removed the
 * board's mounting holes rather than failing.
 */
test("subcircuit caching preserves standalone holes, plated holes and cutouts", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm">
      <subcircuit name="S1" _subcircuitCachingEnabled>
        <hole name="H1" pcbX={-4} pcbY={0} diameter="3mm" />
        <platedhole
          name="PH1"
          pcbX={0}
          pcbY={0}
          shape="circle"
          holeDiameter="1mm"
          outerDiameter="2mm"
        />
        <cutout shape="rect" pcbX={4} pcbY={0} width="2mm" height="2mm" />
      </subcircuit>
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit.db.pcb_hole.list()).toHaveLength(1)
  expect(circuit.db.pcb_plated_hole.list()).toHaveLength(1)
  expect(circuit.db.pcb_cutout.list()).toHaveLength(1)
})
