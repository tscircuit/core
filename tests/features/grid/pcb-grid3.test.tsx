import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("pcb-grid3", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board pcbGrid pcbGridTemplateColumns="repeat(2, 3mm)" routingDisabled>
      <resistor name="R1" resistance="1k" footprint="0402" />
      <resistor name="R2" resistance="1k" footprint="0402" />
      <resistor name="R3" resistance="1k" footprint="0402" />
      <resistor name="R4" resistance="1k" footprint="0402" />
      <resistor name="R5" resistance="1k" footprint="0402" />
      <resistor name="R6" resistance="1k" footprint="0402" />
      <resistor name="R7" resistance="1k" footprint="0402" />
      <resistor name="R8" resistance="1k" footprint="0402" />
      <resistor name="R9" resistance="1k" footprint="0402" />
      <resistor name="R10" resistance="1k" footprint="0402" />
      <resistor name="R11" resistance="1k" footprint="0402" />
      <resistor name="R12" resistance="1k" footprint="0402" />
      <resistor name="R13" resistance="1k" footprint="0402" />
      <resistor name="R14" resistance="1k" footprint="0402" />
      <resistor name="R15" resistance="1k" footprint="0402" />
      <resistor name="R16" resistance="1k" footprint="0402" />
    </board>,
  )

  circuit.render()

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
