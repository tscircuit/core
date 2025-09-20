import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("board auto-sizing keeps anchor centered", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board
      boardAnchorPosition={{ x: 20, y: 20 }}
      boardAnchorAlignment="bottom_left"
      pcbPack
    >
      <resistor name="R1" resistance="10k" footprint="0402" />
      <fabricationnotetext text="board pcbPack" pcbX={10} pcbY={11} />
      <fabricationnotetext
        text="boardAnchorPosition (10,10)"
        pcbX={10}
        pcbY={10}
      />
      <fabricationnotetext
        text="anchorAlignment (bottom_left)"
        pcbX={10}
        pcbY={9}
      />
    </board>,
  )

  circuit.render()

  expect(circuit).toMatchPcbSnapshot(
    import.meta.path.replace(/\.test\.tsx$/, "") + "-snap",
  )
})
