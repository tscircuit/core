import { expect, test } from "bun:test"
import { any_circuit_element } from "circuit-json"
import { getTestFixture } from "../fixtures/get-test-fixture"

test("default chip boxes preserve custom KiCad symbol and footprint properties", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={10} height={10}>
      <chip
        name="U1"
        footprint="soic8"
        kicadFootprintMetadata={{
          footprintName: "MyPart",
          properties: {
            Value: { value: "MyPart" },
            Max_Current_A: { value: "6.4" },
          },
        }}
        kicadSymbolMetadata={{
          properties: { Max_Current_A: { value: "6.4" } },
        }}
      />
    </board>,
  )
  await circuit.renderUntilSettled()

  const circuitJson = circuit
    .getCircuitJson()
    .map((element) => any_circuit_element.parse(element))
  const schematicComponent = circuitJson.find(
    (element) => element.type === "schematic_component",
  )
  const pcbComponent = circuitJson.find(
    (element) => element.type === "pcb_component",
  )
  expect(schematicComponent?.metadata?.kicad_symbol).toEqual({
    properties: { Max_Current_A: { value: "6.4" } },
  })
  expect(pcbComponent?.metadata?.kicad_footprint?.properties).toEqual({
    Value: { value: "MyPart" },
    Max_Current_A: { value: "6.4" },
  })
  expect(circuit.db.schematic_symbol.list()).toHaveLength(0)
  expect(schematicComponent?.schematic_symbol_id).toBeUndefined()
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
