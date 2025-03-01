import { expect, test } from "bun:test"
import { getTestFixture } from "../../fixtures/get-test-fixture"

test("offsetOutline without output defined", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width={20} height={20} outlineOffsetX={10} outlineOffsetY={10}>
      <resistor name="R1" resistance={"10k"} footprint="0402" />
    </board>,
  )

  circuit.render()
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
