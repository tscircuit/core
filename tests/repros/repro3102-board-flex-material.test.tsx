import { expect, test } from "bun:test"
import { pcb_board } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("board material='flex' conforms to the Circuit JSON pcb_board contract and preserves material on inflation (#3102)", () => {
  const { circuit } = getTestFixture()

  circuit.add(<board width="20mm" height="10mm" material="flex" />)
  circuit.render()

  const board = circuit.db.pcb_board.list()[0]
  expect(board).toBeDefined()
  expect(board?.material).toBe("flex")
  expect(pcb_board.safeParse(board).success).toBe(true)

  const { circuit: inflatedCircuit } = getTestFixture()
  inflatedCircuit.add(<board circuitJson={circuit.getCircuitJson()} />)
  inflatedCircuit.render()

  const inflatedBoard = inflatedCircuit.db.pcb_board.list()[0]
  expect(inflatedBoard?.material).toBe("flex")
  expect(pcb_board.safeParse(inflatedBoard).success).toBe(true)
})
