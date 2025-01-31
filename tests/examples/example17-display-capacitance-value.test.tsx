import { test, expect } from "bun:test"
import { convertCircuitJsonToSchematicSvg } from "circuit-to-svg"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("schematic capacitor symbol", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="22mm" height="22mm">
      <capacitor name="C1" capacitance="100uF" footprint="0402" schX={3} schY={0} />
    </board>,
  )

  circuit.render()

  expect(circuit.db.source_component.list()[0]).toMatchInlineSnapshot(`
    {
      "capacitance": 0.0001,
      "display_capacitance": "100µF",
      "ftype": "simple_capacitor",
      "manufacturer_part_number": undefined,
      "max_decoupling_trace_length": undefined,
      "name": "C1",
      "source_component_id": "source_component_0",
      "supplier_part_numbers": undefined,
      "type": "source_component",
    }
  `)
})
