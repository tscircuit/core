import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("schematicsymbol automatically maps matching symbol port labels", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="10mm">
      <chip
        name="Q1"
        pinLabels={{
          pin1: "drain",
          pin2: "source",
          pin3: "gate",
        }}
        noSchematicRepresentation
      />
      <schematicsymbol
        name="A"
        chipRef=".Q1"
        symbolName="n_channel_e_mosfet_transistor_horz"
        schRotation={90}
      />
    </board>,
  )

  circuit.render()

  const q1 = circuit.selectOne("chip.Q1")!
  const schematicComponent = circuit.db.schematic_component.getWhere({
    source_component_id: q1.source_component_id!,
  })!
  const schematicPorts = circuit.db.schematic_port.list({
    schematic_component_id: schematicComponent.schematic_component_id,
  })

  expect(schematicComponent.symbol_name).toBe(
    "n_channel_e_mosfet_transistor_vert",
  )
  expect(schematicPorts).toHaveLength(3)
  expect(
    schematicPorts
      .map(
        (port) => circuit.db.source_port.get(port.source_port_id!)?.pin_number,
      )
      .sort(),
  ).toEqual([1, 2, 3])
})
