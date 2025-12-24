import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("resistor schSize with numeric value", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="10mm" schMaxTraceDistance={1}>
      <resistor
        name="R1"
        resistance="10k"
        footprint="0402"
        schX={-5}
        schY={0}
        schSize={2.0}
      />
      <resistor
        name="R2"
        resistance="10k"
        footprint="0402"
        schX={0}
        schY={0}
        schSize={1.0}
      />
      <resistor
        name="R3"
        resistance="10k"
        footprint="0402"
        schX={5}
        schY={0}
        // No schSize - should use default
      />
    </board>,
  )

  circuit.render()

  const schematicComponents = circuit.db.schematic_component.list()
  expect(schematicComponents).toHaveLength(3)

  const r1 = schematicComponents.find(
    (c) =>
      c.source_component_id ===
      circuit.db.source_component.list().find((sc) => sc.name === "R1")
        ?.source_component_id,
  )
  const r2 = schematicComponents.find(
    (c) =>
      c.source_component_id ===
      circuit.db.source_component.list().find((sc) => sc.name === "R2")
        ?.source_component_id,
  )
  const r3 = schematicComponents.find(
    (c) =>
      c.source_component_id ===
      circuit.db.source_component.list().find((sc) => sc.name === "R3")
        ?.source_component_id,
  )

  expect(r1).toBeDefined()
  expect(r2).toBeDefined()
  expect(r3).toBeDefined()

  // R1 should have width of 2.0
  expect(r1!.size.width).toBe(2.0)
  // R2 should have width of 1.0
  expect(r2!.size.width).toBe(1.0)
  // R3 should have default size (from symbol definition)
  expect(r3!.size.width).toBeGreaterThan(0)

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})

test("resistor schSize with enum values", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="30mm" height="10mm" schMaxTraceDistance={1}>
      <resistor
        name="R_xs"
        resistance="10k"
        footprint="0402"
        schX={-10}
        schY={0}
        schSize="xs"
      />
      <resistor
        name="R_sm"
        resistance="10k"
        footprint="0402"
        schX={-5}
        schY={0}
        schSize="sm"
      />
      <resistor
        name="R_default"
        resistance="10k"
        footprint="0402"
        schX={0}
        schY={0}
        schSize="default"
      />
      <resistor
        name="R_md"
        resistance="10k"
        footprint="0402"
        schX={5}
        schY={0}
        schSize="md"
      />
      <resistor
        name="R_no_size"
        resistance="10k"
        footprint="0402"
        schX={10}
        schY={0}
        // No schSize - should use default
      />
    </board>,
  )

  circuit.render()

  const schematicComponents = circuit.db.schematic_component.list()
  expect(schematicComponents).toHaveLength(5)

  const getComponent = (name: string) => {
    const sourceComponent = circuit.db.source_component
      .list()
      .find((sc) => sc.name === name)
    return schematicComponents.find(
      (c) => c.source_component_id === sourceComponent?.source_component_id,
    )
  }

  const r_xs = getComponent("R_xs")
  const r_sm = getComponent("R_sm")
  const r_default = getComponent("R_default")
  const r_md = getComponent("R_md")
  const r_no_size = getComponent("R_no_size")

  expect(r_xs).toBeDefined()
  expect(r_sm).toBeDefined()
  expect(r_default).toBeDefined()
  expect(r_md).toBeDefined()
  expect(r_no_size).toBeDefined()

  const defaultWidth = r_no_size!.size.width

  // xs should be 50% of default
  expect(r_xs!.size.width).toBeCloseTo(defaultWidth * 0.5, 2)
  // sm should be 75% of default
  expect(r_sm!.size.width).toBeCloseTo(defaultWidth * 0.75, 2)
  // default should be 100% of default
  expect(r_default!.size.width).toBeCloseTo(defaultWidth, 2)
  // md should be 125% of default
  expect(r_md!.size.width).toBeCloseTo(defaultWidth * 1.25, 2)

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})

test("resistor schSize with vertical orientation", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="10mm" schMaxTraceDistance={1}>
      <resistor
        name="R_horizontal"
        resistance="10k"
        footprint="0402"
        schX={-5}
        schY={0}
        schSize={2.0}
        schOrientation="horizontal"
      />
      <resistor
        name="R_vertical"
        resistance="10k"
        footprint="0402"
        schX={5}
        schY={0}
        schSize={2.0}
        schOrientation="vertical"
      />
    </board>,
  )

  circuit.render()

  const schematicComponents = circuit.db.schematic_component.list()
  expect(schematicComponents).toHaveLength(2)

  const getComponent = (name: string) => {
    const sourceComponent = circuit.db.source_component
      .list()
      .find((sc) => sc.name === name)
    return schematicComponents.find(
      (c) => c.source_component_id === sourceComponent?.source_component_id,
    )
  }

  const r_horizontal = getComponent("R_horizontal")
  const r_vertical = getComponent("R_vertical")

  expect(r_horizontal).toBeDefined()
  expect(r_vertical).toBeDefined()

  // Horizontal orientation: schSize should affect width
  expect(r_horizontal!.size.width).toBe(2.0)
  // Vertical orientation: schSize should affect height
  expect(r_vertical!.size.height).toBe(2.0)

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
