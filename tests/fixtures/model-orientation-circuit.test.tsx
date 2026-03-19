import { it, expect } from "bun:test"
import { getTestFixture } from "./get-test-fixture"

it("should orient all models correctly", async () => {
  const { circuit } = await getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm">
      <resistor name="R1" resistance="10k" footprint="0402" />
      <resistor name="R2" resistance="10k" footprint="0402" />
      <resistor name="R3" resistance="10k" footprint="0402" />
      <resistor name="R4" resistance="10k" footprint="0402" />
      <resistor name="R5" resistance="10k" footprint="0402" />
      <resistor name="R6" resistance="10k" footprint="0402" />
      <resistor name="R7" resistance="10k" footprint="0402" />
      <resistor name="R8" resistance="10k" footprint="0402" />
      <resistor name="R9" resistance="10k" footprint="0402" />
    </board>,
  )
  circuit.render()
  await expect(circuit).toMatchSimple3dSnapshot(import.meta.path)
})
