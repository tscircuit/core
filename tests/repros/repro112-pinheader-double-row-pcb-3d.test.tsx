import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("repro112: double-row pinheader renders pcb and 3d snapshots", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board>
      <pinheader name="U1" doubleRow pinCount={16} footprint="pinrow16_rows2" />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
  await expect(circuit).toMatchSimple3dSnapshot(import.meta.path, {
    // Frame the full pin height now that the header sits above the board.
    camPos: [16, 32, 24],
  })
})
