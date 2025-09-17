import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("board anchor alignment applies after auto-size", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board
      boardAnchorAlignment="bottom_right"
      boardAnchorPosition={{ x: 25, y: 30 }}
    >
      <resistor
        name="R_-5_-5"
        resistance="10k"
        footprint="0402"
        pcbX={-5}
        pcbY={-5}
      />
      <resistor
        name="R_5_5"
        resistance="10k"
        footprint="0402"
        pcbX={5}
        pcbY={5}
      />
      <fabricationnotetext text="(0,0)" pcbX={0} pcbY={0} />
      <fabricationnotetext
        text="bottom_right(25,30)"
        anchorAlignment="bottom_right"
        pcbX={25}
        pcbY={30}
      />
    </board>,
  )

  circuit.render()

  expect(circuit.getCircuitJson()).toMatchPcbSnapshot(import.meta.path)
})
