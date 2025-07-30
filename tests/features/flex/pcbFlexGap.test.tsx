import { test, expect } from "bun:test"
import "lib/register-catalogue"
import { getTestFixture } from "../../fixtures/get-test-fixture"

test("pcbFlexGap property works correctly", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board>
      <group pcbFlex pcbFlexGap={5} width="20mm" height="10mm">
        <resistor name="R1" resistance="1k" footprint="0402" />
        <resistor name="R2" resistance="1k" footprint="0402" />
        <resistor name="R3" resistance="1k" footprint="0402" />
      </group>
    </board>,
  )

  circuit.render()

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
