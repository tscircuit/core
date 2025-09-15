import React from "react"
import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

// Test matchpack layout with multiple components in a group

test("group schematic matchpack layout", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm" schMaxTraceDistance={5}>
      <group name="G1" schWidth={8} schHeight={6}>
        <resistor name="R1" resistance="1k" footprint="0402" />
        <resistor name="R2" resistance="2.2k" footprint="0402" />
        <capacitor name="C1" capacitance="100nF" footprint="0402" />
        <chip name="U1" footprint="soic8" />
        <trace from=".R1 > .pin2" to=".U1 > .pin1" />
        <trace from=".R2 > .pin1" to=".U1 > .pin2" />
        <trace from=".C1 > .pin1" to=".U1 > .pin8" />
        <trace from=".R1 > .pin1" to=".R2 > .pin1" />
      </group>
    </board>,
  )

  circuit.render()

  // Verify all components were positioned by finding them through source components
  const r1SourceComponent = circuit.db.source_component.getWhere({
    name: "R1",
  })
  const r2SourceComponent = circuit.db.source_component.getWhere({
    name: "R2",
  })
  const c1SourceComponent = circuit.db.source_component.getWhere({
    name: "C1",
  })
  const u1SourceComponent = circuit.db.source_component.getWhere({
    name: "U1",
  })

  const r1 = circuit.db.schematic_component.getWhere({
    source_component_id: r1SourceComponent!.source_component_id,
  })
  const r2 = circuit.db.schematic_component.getWhere({
    source_component_id: r2SourceComponent!.source_component_id,
  })
  const c1 = circuit.db.schematic_component.getWhere({
    source_component_id: c1SourceComponent!.source_component_id,
  })
  const u1 = circuit.db.schematic_component.getWhere({
    source_component_id: u1SourceComponent!.source_component_id,
  })

  expect(r1).toBeDefined()
  expect(r2).toBeDefined()
  expect(c1).toBeDefined()
  expect(u1).toBeDefined()

  // Check that components have valid positions
  expect(r1!.center.x).toBeNumber()
  expect(r1!.center.y).toBeNumber()
  expect(r2!.center.x).toBeNumber()
  expect(r2!.center.y).toBeNumber()
  expect(c1!.center.x).toBeNumber()
  expect(c1!.center.y).toBeNumber()
  expect(u1!.center.x).toBeNumber()
  expect(u1!.center.y).toBeNumber()

  // Components should be positioned differently
  expect(r1!.center).not.toEqual(r2!.center)
  expect(r1!.center).not.toEqual(c1!.center)
  expect(r1!.center).not.toEqual(u1!.center)

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
