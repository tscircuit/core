import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const boardSize = { width: "10mm", height: "10mm" }

test("pinheader pcbOrientation vertical places pins vertically", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board {...boardSize}>
      <pinheader name="J1" pinCount={2} pcbOrientation="vertical" />
    </board>,
  )

  circuit.render()

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
