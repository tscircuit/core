import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("group-flex3 alignItems-center", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm" routingDisabled>
      <group pcbFlex justifyContent="space-between">
        <resistor name="R0" resistance="1k" footprint="0402" />
        <group pcbFlex justifyContent="space-between">
          <resistor name="R1" resistance="1k" footprint="0402" />
          <resistor name="R2" resistance="1k" footprint="0402" />
        </group>
      </group>
    </board>,
  )

  circuit.render()

  expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    showPcbGroups: true,
  })
})
