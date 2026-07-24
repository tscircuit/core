import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("schematicsymbol maps MOSFET symbol ports to a chip for traces", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="12mm">
      <schematicsheet name="MOSFET A" displayName="MOSFET A" sheetIndex={0} />
      <schematicsymbol
        name="A"
        chipRef=".Q1"
        symbolName="n_channel_e_mosfet_transistor_horz"
        connections={{
          gate: "Q1.G1",
          source: "Q1.S1",
          drain: "Q1.D1",
        }}
        schSheetName="MOSFET A"
        schX={0}
        schY={0}
      />
      <resistor
        name="R1"
        resistance="10k"
        footprint="0402"
        schX={-2}
        schY={-0.1}
      />
      <resistor
        name="R2"
        resistance="10k"
        footprint="0402"
        schX={2}
        schY={0.55}
      />
      <trace from=".R1 > .pin2" to=".Q1 > .G1" />
      <trace from=".R2 > .pin1" to=".Q1 > .D1" />

      <chip
        name="Q1"
        footprint="soic8"
        noSchematicRepresentation
        pinLabels={{
          pin1: "G1",
          pin2: "S1",
          pin3: "G2",
          pin4: "S2",
          pin5: "D2",
          pin6: "D2",
          pin7: "D1",
          pin8: "D1",
        }}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const q1 = circuit.db.source_component.getWhere({ name: "Q1" })!
  const q1Ports = circuit.db.source_port.list({
    source_component_id: q1.source_component_id,
  })
  const getQ1Port = (label: string) =>
    q1Ports.find((port) => port.port_hints?.includes(label))!
  const representation = circuit.db.source_component.getWhere({ name: "A" })!
  const schematicComponent = circuit.db.schematic_component.getWhere({
    source_component_id: representation.source_component_id,
  })!
  const schematicPorts = circuit.db.schematic_port.list({
    schematic_component_id: schematicComponent.schematic_component_id,
  })

  expect(
    Object.fromEntries(
      schematicPorts.map((port) => [port.pin_number, port.source_port_id]),
    ),
  ).toEqual({
    1: getQ1Port("D1").source_port_id,
    2: getQ1Port("S1").source_port_id,
    3: getQ1Port("G1").source_port_id,
  })

  await expect(circuit).toMatchStackedSchematicSnapshot(import.meta.path)
})
