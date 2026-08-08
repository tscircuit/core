import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const createReproBoard = (observedMaterial?: string) => (
  <board width="20mm" height="10mm" material="flex">
    <pcbnotetext
      pcbY={0}
      fontSize={0.7}
      text={`Requested material: flex\nCircuit JSON permits: fr4 | fr1\nObserved pcb_board.material: ${observedMaterial ?? "?"}`}
    />
  </board>
)

test("board accepts material flex although Circuit JSON does not", () => {
  const { circuit } = getTestFixture()
  circuit.add(createReproBoard())
  circuit.render()

  const board = circuit.db.pcb_board.list()[0]

  const { circuit: snapshotCircuit } = getTestFixture()
  snapshotCircuit.add(createReproBoard(board?.material))
  snapshotCircuit.render()

  expect(snapshotCircuit).toMatchPcbSnapshot(import.meta.path)
  expect(board?.material).toBe("flex")
})
