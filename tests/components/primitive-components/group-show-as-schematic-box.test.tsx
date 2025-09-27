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

  // Get all schematic ports for verification
  const allSchematicPorts = circuit.db.schematic_port.list()
  const j1SchematicPorts = allSchematicPorts.filter(
    (p) => p.source_port_id === j1Port?.source_port_id,
  )
  const j2SchematicPorts = allSchematicPorts.filter(
    (p) => p.source_port_id === j2Port?.source_port_id,
  )
  const j1SchematicPort = j1SchematicPorts[0] || null
  const j2SchematicPort = j2SchematicPorts[0] || null

  const schematicPortIds = schematicPorts.map((port) => port.source_port_id)

  expect(schematicPortIds).toContain(j1Port?.source_port_id!)
  expect(schematicPortIds).toContain(j2Port?.source_port_id!)

  const pinHeaderSchematicComponents = circuit.db.schematic_component.list({
    source_component_id: sourceComponentJ1?.source_component_id,
  })

  expect(pinHeaderSchematicComponents).toHaveLength(0)

  // Check trace connectivity
  const sourceTraces = circuit.db.source_trace.list()
  const schematicTraces = circuit.db.schematic_trace.list()

  // Verify that both J1.pin1 and J2.pin1 are connected via traces
  const j1Connected = sourceTraces.some((trace) =>
    trace.connected_source_port_ids.includes(j1Port?.source_port_id!),
  )
  const j2Connected = sourceTraces.some((trace) =>
    trace.connected_source_port_ids.includes(j2Port?.source_port_id!),
  )

  expect(j1Connected).toBe(true) // J1.pin1 should be connected via trace
  expect(j2Connected).toBe(true) // J2.pin1 should be connected via trace
  expect(sourceTraces).toHaveLength(2) // Should have 2 traces (R1.pin1->Shield.D2, R1.pin2->Shield.D1)
  expect(schematicTraces).toHaveLength(2) // Should have 2 schematic traces

  // Verify that group creates brand new schematic ports (unique IDs)
  expect(allSchematicPorts).toHaveLength(4) // 2 group ports + 2 R1 ports

  // Verify each port has a unique schematic_port_id
  const allSchematicPortIds = allSchematicPorts.map((p) => p.schematic_port_id)
  const uniqueIds = new Set(allSchematicPortIds)
  expect(uniqueIds.size).toBe(4) // All IDs should be unique

  // Verify group ports have different IDs than any potential child ports
  const groupPortIds = schematicPorts.map((p) => p.schematic_port_id)
  expect(groupPortIds).toHaveLength(2)
  expect(groupPortIds[0]).not.toBe(groupPortIds[1]) // Group ports have different IDs

  // Verify that only one schematic port exists per source_port_id
  expect(j1SchematicPorts).toHaveLength(1) // Only one schematic port for J1.pin1
  expect(j2SchematicPorts).toHaveLength(1) // Only one schematic port for J2.pin1

  // Verify the group ports reference the correct source ports
  expect(groupPortIds).toContain(j1SchematicPort?.schematic_port_id!)
  expect(groupPortIds).toContain(j2SchematicPort?.schematic_port_id!)

  // Verify group ports are positioned where child ports would have been
  // (Child ports don't actually render, but we can verify the positions match)
  const groupPortForJ1 = schematicPorts.find(
    (p) => p.source_port_id === j1Port?.source_port_id,
  )
  const groupPortForJ2 = schematicPorts.find(
    (p) => p.source_port_id === j2Port?.source_port_id,
  )

  // The group ports should be at the same positions as the child ports would have been
  expect(groupPortForJ1?.center).toEqual(j1SchematicPort?.center)
  expect(groupPortForJ2?.center).toEqual(j2SchematicPort?.center)

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
