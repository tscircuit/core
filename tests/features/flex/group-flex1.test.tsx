import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("group-flex1 space-between", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <group
      subcircuit
      flex
      width="10mm"
      height="10mm"
      justifyContent="space-between"
      routingDisabled
    >
      <resistor name="R1" resistance="1k" footprint="0402" />
      <resistor name="R2" resistance="1k" footprint="0402" />
    </group>,
  )

  circuit.render()

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
