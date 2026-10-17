import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("fiducial creates a courtyard circle around its soldermask opening", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <chip
        name="U1"
        footprint={
          <footprint>
            <fiducial name="F1" padDiameter="1mm" soldermaskPullback="0.3mm" />
          </footprint>
        }
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const courtyardCircles = circuit.db.pcb_courtyard_circle.list()

  await expect(circuit.getCircuitJson()).toMatchPcbSnapshot(import.meta.path, {
    showCourtyards: true,
    showSolderMask: true,
  })

  expect(courtyardCircles).toHaveLength(1)
  expect(courtyardCircles[0]?.radius).toBeCloseTo(0.8)
})
