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
    </board>,
  )

  circuit.render()
  expect(circuit.getCircuitJson()).toMatchPcbSnapshot(
    import.meta.path + "-bottom-right",
  )
})
