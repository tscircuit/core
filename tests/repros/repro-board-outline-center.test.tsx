import { expect, test } from "bun:test"
import { Circuit } from "lib"
import { su } from "@tscircuit/circuit-json-util"

test("pcb_board.center is computed from outline bounds when not explicitly positioned (fixes tscircuit/tscircuit#5563)", async () => {
  const circuit = new Circuit()
  const outline = [
    { x: 0, y: 0 },
    { x: 30, y: 0 },
    { x: 30, y: 10 },
    { x: 10, y: 10 },
    { x: 10, y: 20 },
    { x: 0, y: 20 },
  ]

  circuit.add(<board outline={outline} routingDisabled />)

  await circuit.renderUntilSettled()

  const pcbBoard = su(circuit.getCircuitJson()).pcb_board.list()[0]
  expect(pcbBoard).toBeDefined()
  expect(pcbBoard.center).toEqual({ x: 15, y: 10 })
  expect(pcbBoard.width).toBe(30)
  expect(pcbBoard.height).toBe(20)
})
