import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("via stitching runs by default using board via dimensions", async () => {
  const { circuit } = getTestFixture()
  let solverRunCount = 0
  circuit.on("solver:started", ({ solverName }) => {
    if (solverName === "ViaStitchSolver") solverRunCount++
  })

  circuit.add(
    <board
      width="10mm"
      height="10mm"
      pcbStyle={{ viaHoleDiameter: "0.25mm", viaPadDiameter: "0.5mm" }}
    >
      <copperpour connectsTo="net.GND" layer="top" />
      <copperpour connectsTo="net.GND" layer="bottom" />
      <pcbnotetext
        pcbY={4.65}
        fontSize="0.25mm"
        anchorAlignment="center"
        text="Automatic stitching: 0.25mm hole / 0.5mm pad"
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(solverRunCount).toBe(1)
  const stitchedVias = circuit.db.pcb_via.list()
  expect(stitchedVias.length).toBeGreaterThan(0)
  expect(
    stitchedVias.every(
      (via) => via.hole_diameter === 0.25 && via.outer_diameter === 0.5,
    ),
  ).toBe(true)
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
