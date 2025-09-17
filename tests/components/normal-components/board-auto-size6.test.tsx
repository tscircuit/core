import { expect, test } from "bun:test"
import { getAnchorOffsetFromCenter } from "lib/utils/components/get-anchor-offset-from-center"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("board auto-size with grouped components", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board>
      <group>
        <resistor
          name="R_5_5"
          resistance="10k"
          footprint="0402"
          pcbX={5}
          pcbY={5}
        />
        <resistor
          name="R_-5_-5"
          resistance="10k"
          footprint="0402"
          pcbX={-5}
          pcbY={-5}
        />
      </group>
      <fabricationnotetext text="(0,0)" pcbX={0} pcbY={0} />
      <fabricationnotetext
        text="top_left"
        anchorAlignment="top_left"
        pcbX={0}
        pcbY={0}
      />
    </board>,
  )

  circuit.render()

  expect(circuit.getCircuitJson()).toMatchPcbSnapshot(import.meta.path)
})
