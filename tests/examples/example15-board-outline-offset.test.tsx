import { expect, test } from "bun:test"
import { getTestFixture } from "../fixtures/get-test-fixture"

test("Board outline offset", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board
      width={20}
      height={20}
      outline={[
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 10, y: 10 },
        { x: 0, y: 10 },
      ]}
      outlineOffsetX={-10}
      outlineOffsetY={-10}
    >
      <resistor name="R1" resistance={"10k"} footprint="0402" pcbX={5} />
    </board>,
  )

  circuit.render()
  expect(circuit.db.pcb_board.list()[0]).toMatchInlineSnapshot()
})
