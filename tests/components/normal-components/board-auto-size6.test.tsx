import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("board auto-size with grouped components", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board>
      <group>
        <resistor
          name="R1"
          resistance="10k"
          footprint="0402"
          pcbX={5}
          pcbY={5}
        />
        <resistor
          name="R2"
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
        pcbX={-5.610576923076923}
        pcbY={5.278846153846154}
      />
    </board>,
  )

  circuit.render()

  expect(circuit.getCircuitJson()).toMatchPcbSnapshot(import.meta.path)
})
