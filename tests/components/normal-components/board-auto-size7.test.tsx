import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("board anchor alignment adjusts explicit dimensions", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board
      width={40}
      height={20}
      boardAnchorAlignment="top_left"
      boardAnchorPosition={{ x: 10, y: 20 }}
    >
      <fabricationnotetext text="(0,0)" pcbX={0} pcbY={0} />
      <fabricationnotetext
        text="top_left(10,20)"
        anchorAlignment="top_left"
        pcbX={10}
        pcbY={20}
      />
    </board>,
  )

  circuit.render()
  expect(circuit.getCircuitJson()).toMatchPcbSnapshot(import.meta.path)
})
