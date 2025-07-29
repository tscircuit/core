import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("flex-with-pcbLayout-prop", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <group width="10mm" height="10mm" pcbLayout={{ flex: true }}>
      <resistor name="R1" resistance="1k" footprint="0402" />
      <resistor name="R2" resistance="1k" footprint="0402" />
    </group>,
  )

  circuit.render()

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
