import { test, expect } from "bun:test"
import "lib/register-catalogue"
import { getTestFixture } from "../../fixtures/get-test-fixture"

test("nested flex groups with mixed components", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <group pcbFlex pcbFlexGap="1mm">
        <resistor name="R1" resistance="1k" footprint="0402" />
        <capacitor name="C1" capacitance="100nF" footprint="0402" />
        <group pcbFlex pcbFlexDirection="column" pcbFlexGap="1mm">
          <resistor name="R2" resistance="10k" footprint="0402" />
          <capacitor name="C2" capacitance="1uF" footprint="0603" />
        </group>
      </group>
    </board>,
  )

  circuit.render()

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
