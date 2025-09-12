import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("board borderRadius generates rounded outline", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width={20} height={10} borderRadius={3}>
      <resistor name="R1" resistance="10k" footprint="0402" />
    </board>,
  )

  circuit.render()

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
