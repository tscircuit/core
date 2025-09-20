import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const getBoard = (circuit: ReturnType<typeof getTestFixture>["circuit"]) =>
  circuit.db.pcb_board.list()[0]

test("board uses anchor alignment for explicit dimensions", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board
      width={20}
      height={10}
      boardAnchorPosition={{ x: 5, y: -5 }}
      boardAnchorAlignment="top_left"
    >
      <fabricationnotetext
        text="boardAnchorPosition (5,-5)"
        pcbX={13}
        pcbY={-8}
      />
      <fabricationnotetext
        text="anchorAlignment top_left"
        pcbX={13}
        pcbY={-9}
      />

      <resistor
        name="R_x5_y-5"
        resistance="0"
        footprint="0402"
        pcbX={5}
        pcbY={-5}
      />
    </board>,
  )

  circuit.render()

  // Optional explicit checks
  const pcb = getBoard(circuit)
  expect(pcb.center.x).toBe(15)
  expect(pcb.center.y).toBe(-10)

  expect(circuit).toMatchPcbSnapshot(
    import.meta.path.replace(/\.test\.tsx$/, "") + "-snap",
  )
})
