import { expect, spyOn, test } from "bun:test"
import { RootCircuit } from "lib/RootCircuit"
import type { Board } from "lib/components/normal-components/Board"

test("copper cleanup without pours avoids constructing a database subtree", () => {
  const circuit = new RootCircuit({ platform: { drcChecksDisabled: true } })
  circuit.add(<board width={10} height={10} />)
  circuit.render()
  const subtree = spyOn(circuit.db, "subtree")
  const board = circuit._getBoard() as Board
  board.doInitialPcbCopperPourCleanup()
  expect(subtree).not.toHaveBeenCalled()
  subtree.mockRestore()
})
