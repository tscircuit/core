import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("via stitching can be disabled before rendering", async () => {
  const { circuit } = getTestFixture()
  circuit._featurePcbViaStitching = false
  let solverRunCount = 0
  circuit.on("solver:started", ({ solverName }) => {
    if (solverName === "ViaStitchSolver") solverRunCount++
  })

  circuit.add(
    <board width="10mm" height="10mm">
      <copperpour connectsTo="net.GND" layer="top" />
      <copperpour connectsTo="net.GND" layer="bottom" />
      <pcbnotetext
        pcbY={4.65}
        fontSize="0.25mm"
        anchorAlignment="center"
        text="Automatic via stitching disabled"
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(solverRunCount).toBe(0)
  expect(circuit.db.pcb_via.list()).toHaveLength(0)
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
