import { expect, test } from "bun:test"
import { convertSchematicLengthUnits } from "@tscircuit/circuit-json-util"
import type { SchematicLengthUnit } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

async function layout(
  boardUnit?: SchematicLengthUnit,
  childUnit?: SchematicLengthUnit,
) {
  const { circuit } = getTestFixture({ platform: { pcbDisabled: true } })
  circuit.add(
    <board defaultSchematicLengthUnit={boardUnit} schGrid schGridCols={2}>
      <resistor name="R1" resistance="1k" />
      <subcircuit name="Child" defaultSchematicLengthUnit={childUnit} schFlex>
        <resistor name="R2" resistance="2k" />
        <resistor name="R3" resistance="3k" />
        <trace from=".R2 > .pin1" to=".R3 > .pin2" />
      </subcircuit>
      <resistor name="R4" resistance="4k" />
      <trace from=".R1 > .pin1" to=".R4 > .pin2" />
    </board>,
  )
  await circuit.renderUntilSettled()
  return convertSchematicLengthUnits(circuit.db.toArray(), "mm")
}

test("mixed-unit grid and flex layouts place components and route traces at the same physical positions", async () => {
  const legacy = await layout()
  const mixed = await layout("mm", "in")
  const positions = (records: typeof mixed) =>
    records.flatMap((record) => {
      if (
        record.type === "schematic_component" ||
        record.type === "schematic_port"
      )
        return [record.center]
      if (record.type === "schematic_trace")
        return record.edges.flatMap((edge) => [edge.from, edge.to])
      return []
    })
  const expected = positions(legacy)
  const actual = positions(mixed)
  expect(actual).toHaveLength(expected.length)
  for (const [i, point] of expected.entries()) {
    expect(actual[i]!.x).toBeCloseTo(point.x, 9)
    expect(actual[i]!.y).toBeCloseTo(point.y, 9)
  }
  expect(
    mixed.filter((e) => e.type === "schematic_component_overlap_warning"),
  ).toEqual(
    legacy.filter((e) => e.type === "schematic_component_overlap_warning"),
  )
})
