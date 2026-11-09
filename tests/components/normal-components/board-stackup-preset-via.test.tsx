import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("JLCPCB stackups include the published via wall copper thickness", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board
      width={20}
      height={10}
      fabricatorPreset="jlcpcb_standard"
      layers={4}
      thickness={1.6}
    >
      <via
        name="V1"
        pcbX={0}
        pcbY={1}
        fromLayer="top"
        toLayer="bottom"
        holeDiameter={0.3}
        outerDiameter={0.6}
      />
      <pcbnotetext
        pcbY={-2}
        text="JLCPCB via wall copper: 18 um (0.018 mm)"
        fontSize={0.5}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  expect(circuit.db.pcb_via.list()).toHaveLength(1)
  expect(circuit.db.pcb_stackup.list()).toMatchObject([
    { plated_hole_copper_thickness: 0.018 },
  ])
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
