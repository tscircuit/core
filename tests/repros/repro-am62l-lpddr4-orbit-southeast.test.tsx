import { expect, test } from "bun:test"
import { Am62lLpddr4FullBgaBoard } from "tests/fixtures/am62l-lpddr4-full-bga/full-bga-board"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("captures failed AM62L routing with LPDDR4 placed southeast", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <Am62lLpddr4FullBgaBoard
      fanoutSolver="bga"
      autorouterEffortLevel="1x"
      socPosition={{ x: 0, y: 0 }}
      ramPosition={{ x: 34, y: -34 }}
      boardSize={{ width: 100, height: 100 }}
    />,
  )
  await circuit.renderUntilSettled()
  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    shouldDrawRatsNest: true,
  })
}, 600_000)
