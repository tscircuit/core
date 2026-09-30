import { expect, test } from "bun:test"
import { Am62lLpddr4FullBgaBoard } from "tests/fixtures/am62l-lpddr4-full-bga/full-bga-board"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

// Full-board routing takes 3–4 minutes; keep the regression available for re-enabling.
test.skip("captures failed AM62L routing with LPDDR4 placed west", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <Am62lLpddr4FullBgaBoard
      fanoutSolver="bga"
      autorouterEffortLevel="1x"
      socPosition={{ x: 0, y: 0 }}
      ramPosition={{ x: -36, y: 0 }}
      boardSize={{ width: 100, height: 100 }}
    />,
  )
  await circuit.renderUntilSettled()
  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    shouldDrawRatsNest: true,
  })
}, 600_000)
