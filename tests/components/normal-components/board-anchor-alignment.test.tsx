import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("board respects center anchor alignment", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board
      width={20}
      height={20}
      boardAnchorPosition={{ x: 0, y: 0 }}
      boardAnchorAlignment="center"
    >
      <resistor name="R1" resistance="10k" footprint="0402" pcbX={0} pcbY={0} />
    </board>,
  )

  circuit.render()
  const pcb_board = circuit.db.pcb_board.list()[0]

  // Center alignment means the board's center should be at (0,0)
  expect(pcb_board.center.x).toBe(0)
  expect(pcb_board.center.y).toBe(0)
})

test("board respects top_left anchor alignment", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board
      width={20}
      height={20}
      boardAnchorPosition={{ x: 0, y: 0 }}
      boardAnchorAlignment="top_left"
    >
      <resistor name="R1" resistance="10k" footprint="0402" pcbX={0} pcbY={0} />
    </board>,
  )

  circuit.render()
  const pcb_board = circuit.db.pcb_board.list()[0]

  // Top-left alignment means the board's top-left corner should be at (0,0)
  // So center should be at (width/2, height/2) in PCB coordinates (positive Y is down)
  expect(pcb_board.center.x).toBe(10) // 20/2
  expect(pcb_board.center.y).toBe(10) // 20/2
})

test("board respects bottom_right anchor alignment", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board
      width={20}
      height={20}
      boardAnchorPosition={{ x: 0, y: 0 }}
      boardAnchorAlignment="bottom_right"
    >
      <resistor name="R1" resistance="10k" footprint="0402" pcbX={0} pcbY={0} />
    </board>,
  )

  circuit.render()
  const pcb_board = circuit.db.pcb_board.list()[0]

  // Bottom-right alignment means the board's bottom-right corner should be at (0,0)
  // So center should be at (-width/2, -height/2) in PCB coordinates
  expect(pcb_board.center.x).toBe(-10) // -20/2
  expect(pcb_board.center.y).toBe(-10) // -20/2
})

test("board respects center_left anchor alignment", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board
      width={20}
      height={20}
      boardAnchorPosition={{ x: 0, y: 0 }}
      boardAnchorAlignment="center_left"
    >
      <resistor name="R1" resistance="10k" footprint="0402" pcbX={0} pcbY={0} />
    </board>,
  )

  circuit.render()
  const pcb_board = circuit.db.pcb_board.list()[0]

  // Center-left alignment means the board's left edge center should be at (0,0)
  // So center should be at (width/2, 0)
  expect(pcb_board.center.x).toBe(10) // 20/2
  expect(pcb_board.center.y).toBe(0)
})

test("board respects outline offset with anchor alignment", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board
      width={20}
      height={20}
      boardAnchorPosition={{ x: 0, y: 0 }}
      boardAnchorAlignment="top_left"
      outlineOffsetX={5}
      outlineOffsetY={5}
    >
      <resistor name="R1" resistance="10k" footprint="0402" pcbX={0} pcbY={0} />
    </board>,
  )

  circuit.render()
  const pcb_board = circuit.db.pcb_board.list()[0]

  // With top_left alignment and offsets, center should be at (width/2 + offsetX, height/2 + offsetY)
  // in PCB coordinates (positive Y is down)
  expect(pcb_board.center.x).toBe(15) // 20/2 + 5
  expect(pcb_board.center.y).toBe(15) // 20/2 + 5
})
