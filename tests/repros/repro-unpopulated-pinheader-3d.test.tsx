import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("unpopulated pinheader keeps six PCB holes but shows a fitted 3D header", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="14mm" height="10mm">
      <pinheader
        name="J1"
        pinCount={6}
        pitch="1.27mm"
        holeDiameter="0.7mm"
        platedDiameter="1.1mm"
        gender="unpopulated"
      />
      <pcbnotetext text="J1: bare holes, no fitted header" pcbY={-3.5} />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit.db.pcb_plated_hole.list()).toHaveLength(6)
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
  await expect(circuit).toMatchSimple3dSnapshot(import.meta.path, {
    camPos: [18, 18, 18],
    poppygl: { lookAt: [0, 0, 2] },
  })
})
