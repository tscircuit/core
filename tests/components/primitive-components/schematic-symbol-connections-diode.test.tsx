import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("schematicsymbol maps diode symbol ports to a chip for traces", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="16mm" height="10mm">
      <schematicsheet name="Diode" displayName="Diode" sheetIndex={0}>
        <schematicsymbol
          name="A"
          chipRef=".D1"
          symbolName="diode_right"
          connections={{
            pin1: "D1.A",
            pin2: "D1.K",
          }}
          schX={0}
          schY={0}
        />
        <resistor
          name="R1"
          resistance="1k"
          footprint="0402"
          connections={{ pin2: "D1.A" }}
          schX={-2}
        />
        <resistor
          name="R2"
          resistance="1k"
          footprint="0402"
          connections={{ pin1: "D1.K" }}
          schX={2}
        />
      </schematicsheet>

      <chip
        name="D1"
        footprint="0402"
        noSchematicRepresentation
        pinLabels={{
          pin1: "A",
          pin2: "K",
        }}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const d1 = circuit.db.source_component.getWhere({ name: "D1" })!
  const d1Ports = circuit.db.source_port.list({
    source_component_id: d1.source_component_id,
  })
  const getD1Port = (label: string) =>
    d1Ports.find((port) => port.port_hints?.includes(label))!
  const schematicComponent = circuit.db.schematic_component.getWhere({
    source_component_id: d1.source_component_id,
  })!
  const schematicPorts = circuit.db.schematic_port.list({
    schematic_component_id: schematicComponent.schematic_component_id,
  })

  expect(schematicComponent.symbol_name).toBe("diode_right")
  expect(schematicPorts).toHaveLength(2)
  expect(
    Object.fromEntries(
      schematicPorts.map((port) => [port.pin_number, port.source_port_id]),
    ),
  ).toEqual({
    1: getD1Port("A").source_port_id,
    2: getD1Port("K").source_port_id,
  })
  expect(circuit.db.schematic_trace.list()).toHaveLength(2)

  await expect(circuit).toMatchStackedSchematicSnapshot(import.meta.path)
})
