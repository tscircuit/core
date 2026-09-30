import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { EnclosureApertureDrcFixture } from "tests/fixtures/enclosure-aperture-drc-fixture"

test("assembly DRC warns for an aperture above the component body", async () => {
  const { circuit } = getTestFixture()
  circuit.add(<EnclosureApertureDrcFixture />)
  await circuit.renderUntilSettled()
  const warnings = circuit.db.cad_enclosure_aperture_intersection_warning.list()
  expect(warnings).toHaveLength(1)
  expect(warnings[0]).toMatchObject({ face: "y_pos", threshold_area_mm2: 2 })
  expect(warnings[0]!.intersection_area_mm2).toBeGreaterThan(2)
  expect(warnings[0]!.enclosure_cad_component_ids).toHaveLength(2)
  expect(circuit.db.source_runtime_error.list()).toHaveLength(0)
  // Settling again must not reload models or duplicate the warning.
  await circuit.renderUntilSettled()
  expect(
    circuit.db.cad_enclosure_aperture_intersection_warning.list(),
  ).toHaveLength(1)
  await expect(circuit).toMatchSimple3dSnapshot(import.meta.path, {
    camPos: [35, 40, 45],
    poppygl: { lookAt: [0, 0, 8], backgroundColor: [1, 1, 1], grid: false },
  })
})
