import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

function getComponentBounds(circuit: any) {
  const comps = circuit.db.pcb_component.list()
  const bounds = {
    minX: Infinity,
    minY: Infinity,
    maxX: -Infinity,
    maxY: -Infinity,
  }
  for (const c of comps) {
    bounds.minX = Math.min(bounds.minX, c.center.x - c.width / 2)
    bounds.maxX = Math.max(bounds.maxX, c.center.x + c.width / 2)
    bounds.minY = Math.min(bounds.minY, c.center.y - c.height / 2)
    bounds.maxY = Math.max(bounds.maxY, c.center.y + c.height / 2)
  }
  bounds.width = bounds.maxX - bounds.minX
  bounds.height = bounds.maxY - bounds.minY
  return bounds
}

test("board pack auto size repro", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board pack gap="2mm">
      <resistor resistance="1k" footprint="0402" name="R1" />
      <capacitor capacitance="1000pF" footprint="0402" name="C1" />
      <trace from=".R1 > .pin1" to=".C1 > .pin1" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const board = circuit.db.pcb_board.list()[0]
  const bounds = getComponentBounds(circuit)
  console.log("BOARD", board)
  console.log("BOUNDS", bounds)
  expect(board.width).toBeGreaterThan(bounds.width)
  expect(board.height).toBeGreaterThan(bounds.height)
})
