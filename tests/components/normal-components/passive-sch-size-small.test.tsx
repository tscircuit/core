import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("capacitor and resistor map schSize='small' to compact 'sm' schematic symbols", () => {
  const { circuit } = getTestFixture()
  const schSize = "small" as any

  circuit.add(
    <board width="10mm" height="10mm">
      <capacitor name="C_DEFAULT" capacitance="1uF" schX={-2} />
      <capacitor name="C_SMALL" capacitance="1uF" schSize={schSize} schX={2} />
      <resistor name="R_DEFAULT" resistance="1k" schY={-2} />
      <resistor name="R_SMALL" resistance="1k" schSize={schSize} schY={2} />
    </board>,
  )

  circuit.render()

  const sourceByName = new Map(
    circuit.db.source_component
      .list()
      .map((component) => [component.name, component.source_component_id]),
  )
  const schematicByName = new Map(
    circuit.db.schematic_component
      .list()
      .map((component) => [component.source_component_id, component]),
  )

  const defaultCapacitor = schematicByName.get(sourceByName.get("C_DEFAULT")!)
  const smallCapacitor = schematicByName.get(sourceByName.get("C_SMALL")!)
  const defaultResistor = schematicByName.get(sourceByName.get("R_DEFAULT")!)
  const smallResistor = schematicByName.get(sourceByName.get("R_SMALL")!)

  expect(defaultCapacitor?.symbol_name).toBe("capacitor_right")
  expect(smallCapacitor?.symbol_name).toBe("capacitor_sm_right")
  expect(smallCapacitor!.size.width).toBeLessThan(defaultCapacitor!.size.width)

  expect(defaultResistor?.symbol_name).toBe("boxresistor_right")
  expect(smallResistor?.symbol_name).toBe("boxresistor_sm_right")
  expect(smallResistor!.size.width).toBeLessThan(defaultResistor!.size.width)
})
