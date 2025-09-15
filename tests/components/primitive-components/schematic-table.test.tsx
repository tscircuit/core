import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("SchematicTable rendering", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <schematictable schX={1} schY={1}>
        <schematicrow>
          <schematiccell>A1</schematiccell>
          <schematiccell>B1</schematiccell>
        </schematicrow>
        <schematicrow>
          <schematiccell>A2</schematiccell>
          <schematiccell>B2</schematiccell>
        </schematicrow>
      </schematictable>
    </board>,
  )

  circuit.render()

  const tables = circuit.db.schematic_table.list()
  expect(tables).toHaveLength(1)

  const cells = circuit.db.schematic_table_cell.list()
  expect(cells).toHaveLength(4)
  expect(cells.find((c) => c.text === "A1")).toBeDefined()
  expect(cells.find((c) => c.text === "B1")).toBeDefined()
  expect(cells.find((c) => c.text === "A2")).toBeDefined()
  expect(cells.find((c) => c.text === "B2")).toBeDefined()

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})

test("SchematicTable with spans", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <schematictable schX={1} schY={1}>
        <schematicrow>
          <schematiccell colSpan={2}>A1-B1</schematiccell>
        </schematicrow>
        <schematicrow>
          <schematiccell>A2</schematiccell>
          <schematiccell>B2</schematiccell>
        </schematicrow>
      </schematictable>
    </board>,
  )

  circuit.render()

  const tables = circuit.db.schematic_table.list()
  expect(tables).toHaveLength(1)

  const cells = circuit.db.schematic_table_cell.list()
  expect(cells).toHaveLength(3)
  const spannedCell = cells.find((c) => c.text === "A1-B1")
  expect(spannedCell).toBeDefined()
  expect(spannedCell?.start_column_index).toBe(0)
  expect(spannedCell?.end_column_index).toBe(1)

  expect(circuit).toMatchSchematicSnapshot(import.meta.path + "with-spans")
})

test("SchematicTable with text prop", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <schematictable schX={1} schY={1}>
        <schematicrow>
          <schematiccell text="A1" />
          <schematiccell>B1</schematiccell>
        </schematicrow>
      </schematictable>
    </board>,
  )

  circuit.render()

  const tables = circuit.db.schematic_table.list()
  expect(tables).toHaveLength(1)

  const cells = circuit.db.schematic_table_cell.list()
  expect(cells).toHaveLength(2)
  expect(cells.find((c) => c.text === "A1")).toBeDefined()
  expect(cells.find((c) => c.text === "B1")).toBeDefined()

  expect(circuit).toMatchSchematicSnapshot(import.meta.path + "with-text-prop")
})
