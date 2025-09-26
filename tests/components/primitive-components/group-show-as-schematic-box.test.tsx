import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("group showAsSchematicBox renders single schematic component", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width={20} height={20}>
      <group
        name="Shield"
        showAsSchematicBox
        schWidth={1}
        schPinStyle={{
          pin1: { marginBottom: 0.4 },
        }}
        schPinArrangement={{
          leftSide: { direction: "top-to-bottom", pins: ["D1", "D2"] },
        }}
        connections={{
          D1: "J1.pin1",
          D2: "J2.pin1",
        }}
      >
        <pinheader name="J1" pinCount={3} footprint={"pinrow3"} />
        <pinheader name="J2" pinCount={3} footprint={"pinrow3"} />
      </group>

      <resistor
        name="R1"
        footprint="0402"
        resistance={"4k"}
        schX={-3}
        schRotation={90}
        connections={{ pin2: "Shield.D1", pin1: "Shield.D2" }}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const schematicGroupComponents = circuit.db.schematic_component.list({
    is_schematic_group: true,
  })

  expect(schematicGroupComponents).toHaveLength(1)

  const [schematicGroupComponent] = schematicGroupComponents

  const schematicPorts = circuit.db.schematic_port.list({
    schematic_component_id: schematicGroupComponent.schematic_component_id,
  })

  expect(schematicPorts).toHaveLength(2)

  const sourceComponentJ1 = circuit.db.source_component.getWhere({ name: "J1" })
  const sourceComponentJ2 = circuit.db.source_component.getWhere({ name: "J2" })

  expect(sourceComponentJ1).toBeTruthy()
  expect(sourceComponentJ2).toBeTruthy()

  const j1Port = circuit.db.source_port
    .list({ source_component_id: sourceComponentJ1?.source_component_id })
    .find((port) => port.pin_number === 1)

  const j2Port = circuit.db.source_port
    .list({ source_component_id: sourceComponentJ2?.source_component_id })
    .find((port) => port.pin_number === 1)

  expect(j1Port).toBeTruthy()
  expect(j2Port).toBeTruthy()

  const schematicPortIds = schematicPorts.map((port) => port.source_port_id)

  expect(schematicPortIds).toContain(j1Port?.source_port_id!)
  expect(schematicPortIds).toContain(j2Port?.source_port_id!)

  const pinHeaderSchematicComponents = circuit.db.schematic_component.list({
    source_component_id: sourceComponentJ1?.source_component_id,
  })

  expect(pinHeaderSchematicComponents).toHaveLength(0)

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
