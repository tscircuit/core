import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("subcircuit with _subcircuitCachingEnabled renders in isolation and produces circuit json", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <resistor
        name="R1"
        resistance="1k"
        footprint="0402"
        pcbX={-3}
        schX={-3}
      />
      <subcircuit name="S1" _subcircuitCachingEnabled>
        <resistor
          name="R2"
          resistance="2k"
          footprint="0402"
          pcbX={3}
          schX={3}
        />
        <capacitor
          name="C1"
          capacitance="100nF"
          footprint="0402"
          pcbX={3}
          pcbY={2}
          schX={3}
          schY={2}
        />
        <trace from=".R2 .pin1" to=".C1 .pin1" />
      </subcircuit>
    </board>,
  )

  await circuit.renderUntilSettled()

  const circuitJson = circuit.getCircuitJson()

  // Verify we have source components from both the main circuit and the
  // isolated subcircuit
  const sourceComponents = circuitJson.filter(
    (e: any) => e.type === "source_component",
  )

  // R1 from the main circuit + R2 and C1 from the isolated subcircuit
  expect(sourceComponents.length).toBeGreaterThanOrEqual(3)

  // Verify the isolated subcircuit produced source_component entries
  const resistorComponents = sourceComponents.filter(
    (e: any) => e.ftype === "simple_resistor",
  )
  expect(resistorComponents.length).toBeGreaterThanOrEqual(2)

  const capacitorComponents = sourceComponents.filter(
    (e: any) => e.ftype === "simple_capacitor",
  )
  expect(capacitorComponents.length).toBeGreaterThanOrEqual(1)

  // Verify PCB components exist
  const pcbComponents = circuitJson.filter(
    (e: any) => e.type === "pcb_component",
  )
  expect(pcbComponents.length).toBeGreaterThanOrEqual(3)

  // Verify source_group entries exist
  const sourceGroups = circuitJson.filter((e: any) => e.type === "source_group")
  expect(sourceGroups.length).toBeGreaterThanOrEqual(1)

  // Verify the isolated subcircuit's elements have prefixed IDs
  const isolatedSourceComponents = sourceComponents.filter(
    (e: any) =>
      typeof e.source_component_id === "string" &&
      e.source_component_id.startsWith("isolated_"),
  )
  expect(isolatedSourceComponents.length).toBeGreaterThanOrEqual(2)

  // Verify the main circuit R1 has its normal ID (not prefixed)
  const mainR1 = sourceComponents.find(
    (e: any) =>
      e.name === "R1" && !e.source_component_id?.startsWith("isolated_"),
  )
  expect(mainR1).toBeDefined()
})
