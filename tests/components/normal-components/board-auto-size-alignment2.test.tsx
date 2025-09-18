import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("board respects bottom_right anchor alignment", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board
      width={20}
      height={20}
      boardAnchorPosition={{ x: -5, y: -5 }}
      boardAnchorAlignment="bottom_right"
    >
      <resistor name="R1" resistance="10k" footprint="0402" pcbX={0} pcbY={0} />
      <fabricationnotetext
        text="boardAnchorPosition (-5,-5)"
        pcbX={-5}
        pcbY={-5}
      />
      <fabricationnotetext
        text="anchorAlignment bottom_right"
        anchorAlignment="bottom_right"
        pcbX={-5}
        pcbY={-6}
      />
    </board>,
  )

  circuit.render()
  expect(circuit.getCircuitJson()).toMatchPcbSnapshot(
    import.meta.path + "-bottom-right",
  )
})
