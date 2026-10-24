import { expect, test } from "bun:test"
import { Circuit } from "lib"

test("board with outline without explicit center calculates center from outline bounding box", async () => {
  const outline = [
    { x: 0, y: 0 },
    { x: 30, y: 0 },
    { x: 30, y: 10 },
    { x: 10, y: 10 },
    { x: 10, y: 20 },
    { x: 0, y: 20 },
  ]

  const circuit = new Circuit()
  circuit.add(
    <board outline={outline} routingDisabled>
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={25} pcbY={5} />
    </board>,
  )

  await circuit.renderUntilSettled()
  const circuitJson = circuit.getCircuitJson()

  const pcbBoard = circuitJson.find((elm) => elm.type === "pcb_board") as any
  expect(pcbBoard).toBeDefined()
  expect(pcbBoard.width).toBe(30)
  expect(pcbBoard.height).toBe(20)
  expect(pcbBoard.center).toEqual({ x: 15, y: 10 })
})

test("board with outline and explicit center preserves explicit center", async () => {
  const outline = [
    { x: 0, y: 0 },
    { x: 30, y: 0 },
    { x: 30, y: 20 },
    { x: 0, y: 20 },
  ]

  const circuit = new Circuit()
  circuit.add(<board outline={outline} pcbX={50} pcbY={50} routingDisabled />)

  await circuit.renderUntilSettled()
  const circuitJson = circuit.getCircuitJson()

  const pcbBoard = circuitJson.find((elm) => elm.type === "pcb_board") as any
  expect(pcbBoard.center).toEqual({ x: 50, y: 50 })
})
