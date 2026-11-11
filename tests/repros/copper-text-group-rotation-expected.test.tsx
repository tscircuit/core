import { expect, test } from "bun:test"
import { CopperTextGroupRotationBoard } from "tests/fixtures/copper-text-group-rotation-board"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test.failing("copper supply labels should inherit group rotation", async () => {
  const { circuit } = getTestFixture()
  circuit.add(<CopperTextGroupRotationBoard />)
  await circuit.renderUntilSettled()

  const copperLabels = circuit.db.pcb_copper_text.list()
  const normalizedRotations = copperLabels.map(
    (label) => (((label.ccw_rotation ?? 0) % 360) + 360) % 360,
  )
  expect(normalizedRotations).toEqual([0, 90, 180, 270])
})
