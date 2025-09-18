import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

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

      <fabricationnotetext text="boardAnchorPosition (0,0)" pcbX={5} pcbY={4} />
      <fabricationnotetext
        text="anchorAlignment top_left"
        anchorAlignment="top_left"
        pcbX={5}
        pcbY={5}
      />
    </board>,
  )

  circuit.render()
  expect(circuit.getCircuitJson()).toMatchPcbSnapshot(
    import.meta.path + "-top-left",
  )
})
