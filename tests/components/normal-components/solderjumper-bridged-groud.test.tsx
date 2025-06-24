import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("<solderjumper /> bridged ground", async () => {
    const { circuit } = getTestFixture()
  
    circuit.add(
      <board width="10mm" height="10mm">
        <solderjumper name="SJ1" symbolName="bridged_ground" />
      </board>,
    )
  
    circuit.render()
  
    // Should not emit any errors
    expect(circuit.db.toArray().filter((x) => "error_type" in x)).toEqual([])
  
    const sc = circuit.db.schematic_component.list()[0]
    expect(sc.symbol_name?.startsWith("bridged_ground")).toBe(true)
  
    expect(circuit).toMatchSchematicSnapshot(import.meta.path)
  })
  