import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("isolated subcircuit produces equivalent source components to non-isolated render", async () => {
  // First render WITHOUT isolation
  const fixture1 = getTestFixture()
  fixture1.circuit.add(
    <board width="20mm" height="20mm">
      <subcircuit name="S1">
        <resistor
          name="R1"
          resistance="1k"
          footprint="0402"
          pcbX={0}
          schX={0}
        />
        <capacitor
          name="C1"
          capacitance="100nF"
          footprint="0402"
          pcbX={0}
          pcbY={3}
          schX={0}
          schY={3}
        />
      </subcircuit>
    </board>,
  )
  fixture1.circuit.render()
  const normalJson = fixture1.circuit.getCircuitJson()

  // Now render WITH isolation
  const fixture2 = getTestFixture()
  fixture2.circuit.add(
    <board width="20mm" height="20mm">
      <subcircuit name="S1" _subcircuitCachingEnabled>
        <resistor
          name="R1"
          resistance="1k"
          footprint="0402"
          pcbX={0}
          schX={0}
        />
        <capacitor
          name="C1"
          capacitance="100nF"
          footprint="0402"
          pcbX={0}
          pcbY={3}
          schX={0}
          schY={3}
        />
      </subcircuit>
    </board>,
  )
  fixture2.circuit.render()
  const isolatedJson = fixture2.circuit.getCircuitJson()

  // Compare element types - both should have the same types of elements
  const normalTypes = new Set(normalJson.map((e: any) => e.type))
  const isolatedTypes = new Set(isolatedJson.map((e: any) => e.type))

  // Both should have source_component, source_group, pcb_component, etc.
  for (const expectedType of [
    "source_component",
    "source_group",
    "source_port",
    "pcb_component",
    "pcb_smtpad",
    "pcb_port",
  ]) {
    expect(normalTypes.has(expectedType)).toBe(true)
    expect(isolatedTypes.has(expectedType)).toBe(true)
  }

  // Both should have the same number of source_component entries
  const normalSourceComponents = normalJson.filter(
    (e: any) => e.type === "source_component",
  )
  const isolatedSourceComponents = isolatedJson.filter(
    (e: any) => e.type === "source_component",
  )
  expect(normalSourceComponents.length).toBe(isolatedSourceComponents.length)

  // Both should have the same number of pcb_smtpad entries
  const normalSmtPads = normalJson.filter((e: any) => e.type === "pcb_smtpad")
  const isolatedSmtPads = isolatedJson.filter(
    (e: any) => e.type === "pcb_smtpad",
  )
  expect(normalSmtPads.length).toBe(isolatedSmtPads.length)

  // Verify component names are preserved
  const normalNames = normalSourceComponents.map((e: any) => e.name).sort()
  const isolatedNames = isolatedSourceComponents.map((e: any) => e.name).sort()
  expect(normalNames).toEqual(isolatedNames)
})
