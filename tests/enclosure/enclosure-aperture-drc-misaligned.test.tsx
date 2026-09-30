import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { EnclosureApertureDrcFixture } from "tests/fixtures/enclosure-aperture-drc-fixture"

test("assembly DRC reports a collision for an aperture above the component body", async () => {
  const { circuit } = getTestFixture()
  circuit.add(<EnclosureApertureDrcFixture />)
  await circuit.renderUntilSettled()
  const collisionErrors = circuit.db.cad_collision_error.list()
  expect(collisionErrors).toHaveLength(1)
  expect(collisionErrors[0]).toMatchObject({
    type: "cad_collision_error",
    error_type: "cad_collision_error",
    threshold_area_mm2: 2,
  })
  expect(collisionErrors[0]!.intersection_area_mm2).toBeGreaterThan(2)
  expect(collisionErrors[0]!.cad_component_ids).toHaveLength(3)
  expect(collisionErrors[0]!.pcb_component_ids).toHaveLength(2)
  expect(collisionErrors[0]!.source_component_ids).toHaveLength(2)
  expect(collisionErrors[0]).not.toHaveProperty("face")
  expect(collisionErrors[0]).not.toHaveProperty("enclosure_cad_component_ids")
  expect(circuit.db.source_runtime_error.list()).toHaveLength(0)
  // Settling again must not reload models or duplicate the collision error.
  await circuit.renderUntilSettled()
  expect(circuit.db.cad_collision_error.list()).toHaveLength(1)
  await expect(circuit).toMatchSimple3dSnapshot(import.meta.path, {
    camPos: [35, 40, 45],
    poppygl: { lookAt: [0, 0, 8], backgroundColor: [1, 1, 1], grid: false },
  })
})
