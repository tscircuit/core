import { test, expect } from "bun:test"
import { getTestFixture } from "../../fixtures/get-test-fixture"

test("pcbFlex for group in between should follow the correct order of flex R1, R2 and then R3", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board pcbFlex>
      <resistor name="R1" resistance="1k" footprint="0402" />
      <group name="G2">
        <resistor name="R2" resistance="1k" footprint="0402" />
      </group>
      <resistor name="R3" resistance="1k" footprint="0402" />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
