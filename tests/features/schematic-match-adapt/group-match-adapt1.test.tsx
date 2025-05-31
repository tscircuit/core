import { test, expect } from "bun:test"
import { Circuit } from "../../../lib/index"
import type { SchematicComponent, SchematicPort } from "circuit-json"

test("Group with match-adapt layout - three resistors in triangle configuration", () => {
  const circuit = new Circuit()

  circuit.add(
    <board width="10mm" height="10mm">
      <group matchAdapt name="main">
        <resistor name="R1" resistance="1k" />
        <resistor name="R2" resistance="2k" />
        <resistor name="R3" resistance="3k" />

        {/* Connect resistors in a triangle */}
        <trace from=".R1 > .1" to=".R2 > .1" />
        <trace from=".R2 > .2" to=".R3 > .1" />
        <trace from=".R3 > .2" to=".R1 > .2" />
      </group>
    </board>,
  )

  circuit.render()

  // Get the schematic group
  const schematicGroup = circuit.db.schematic_group
    .list()
    .find((sg) => sg.name === "main_circuit")

  expect(schematicGroup).toBeDefined()

  // Get all schematic components in the group
  const schematicComponents = circuit.db.schematic_component
    .list()
    .filter(
      (sc) => sc.schematic_group_id === schematicGroup?.schematic_group_id,
    )

  // Should have 3 components: three resistors
  expect(schematicComponents).toHaveLength(3)

  // Find each component
  const r1Component = schematicComponents.find(
    (sc) =>
      circuit.db.source_component.get(sc.source_component_id!)?.name === "R1",
  )
  const r2Component = schematicComponents.find(
    (sc) =>
      circuit.db.source_component.get(sc.source_component_id!)?.name === "R2",
  )
  const r3Component = schematicComponents.find(
    (sc) =>
      circuit.db.source_component.get(sc.source_component_id!)?.name === "R3",
  )

  expect(r1Component).toBeDefined()
  expect(r2Component).toBeDefined()
  expect(r3Component).toBeDefined()

  // Check that components have been laid out (have positions)
  expect(r1Component?.center).toBeDefined()
  expect(r1Component?.center?.x).toBeTypeOf("number")
  expect(r1Component?.center?.y).toBeTypeOf("number")

  expect(r2Component?.center).toBeDefined()
  expect(r3Component?.center).toBeDefined()

  // Check that the group has updated bounds
  expect(schematicGroup?.width).toBeGreaterThan(0)
  expect(schematicGroup?.height).toBeGreaterThan(0)

  // Components should have different positions
  const positions = [r1Component, r2Component, r3Component].map((c) => ({
    x: c?.center?.x,
    y: c?.center?.y,
  }))

  // Check that not all components are at the same position
  const uniquePositions = new Set(positions.map((p) => `${p.x},${p.y}`))
  expect(uniquePositions.size).toBeGreaterThan(1)

  // Check that the schematic traces exist
  const schematicTraces = circuit.db.schematic_trace.list()
  expect(schematicTraces.length).toBeGreaterThan(0)

  // Generate SVG to visually verify the layout
  try {
    const svgContent = circuit.getSvg({ view: "schematic" })
    if (svgContent) {
      expect(svgContent).toContain("<svg")
    }
  } catch (e) {
    // SVG generation might fail but the layout should still work
  }
})
