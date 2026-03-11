import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("pcb calc supports component-relative references for primitives outside footprint", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="40mm" height="20mm">
      <resistor name="R1" footprint="0402" resistance="1k" pcbX="8mm" />
      <via
        fromLayer="top"
        toLayer="bottom"
        pcbX="calc(R1.maxX + 1mm)"
        pcbY="calc(R1.y)"
      />
    </board>,
  )

  circuit.render()

  const sourceComponentErrors =
    circuit.db.source_failed_to_create_component_error.list()
  expect(sourceComponentErrors).toHaveLength(0)

  const vias = circuit.db.pcb_via.list()
  expect(vias.length).toBeGreaterThan(0)
})
