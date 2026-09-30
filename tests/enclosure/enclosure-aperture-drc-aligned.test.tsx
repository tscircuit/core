import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { EnclosureApertureDrcFixture } from "tests/fixtures/enclosure-aperture-drc-fixture"

test("an aligned assembly aperture clears the real component mesh", async () => {
  const { circuit } = getTestFixture()
  circuit.add(<EnclosureApertureDrcFixture offset={0} />)
  await circuit.renderUntilSettled()
  expect(circuit.db.cad_collision_error.list()).toHaveLength(0)
  expect(circuit.db.source_runtime_error.list()).toHaveLength(0)
  await expect(circuit).toMatchSimple3dSnapshot(import.meta.path, {
    camPos: [35, 40, 45],
    poppygl: { lookAt: [0, 0, 8], backgroundColor: [1, 1, 1], grid: false },
  })
})
