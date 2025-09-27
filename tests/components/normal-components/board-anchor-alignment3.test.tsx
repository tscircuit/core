import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("board auto-sizing respects top-left anchor", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board boardAnchorPosition={{ x: 0, y: 0 }} boardAnchorAlignment="top_left">
      <resistor
        name="R1_x8_y-6"
        resistance="10k"
        footprint="0402"
        pcbX={8}
        pcbY={-6}
      />
      <fabricationnotetext
        text="boardAnchorPosition (0,0)"
        pcbX={5}
        pcbY={-1}
      />
      <fabricationnotetext text="anchorAlignment top_left" pcbX={5} pcbY={-2} />
    </board>,
  )

  circuit.render()

  expect(circuit).toMatchPcbSnapshot(
    import.meta.path.replace(/\.test\.tsx$/, "") + "-snap",
  )
})
