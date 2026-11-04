import { expect, test } from "bun:test"
import type { GroupProps } from "@tscircuit/props"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("schematic grid preserves fallback and explicit layout overrides", async () => {
  const cases: { props: GroupProps; columns: number; gap: number }[] = [
    { props: { gridCols: 2, gridGap: 2 }, columns: 2, gap: 2 },
    {
      props: { gridCols: 2, gridGap: 2, schGridCols: 1, schGridGap: "3mm" },
      columns: 1,
      gap: 3,
    },
    {
      props: {
        gridCols: 2,
        gridGap: 2,
        schGridCols: 1,
        schGridGap: 3,
        schLayout: { grid: true, gridGap: 4 },
      },
      columns: 1,
      gap: 4,
    },
    {
      props: { gridCols: 2, gridGap: 2, schGridCols: 1, schGridGap: 0 },
      columns: 1,
      gap: 0,
    },
  ]

  for (const { props, columns, gap } of cases) {
    const { circuit } = getTestFixture()
    circuit.pcbDisabled = true
    circuit.add(
      <board>
        <group schGrid {...props}>
          <resistor name="R1" resistance="1k" />
          <resistor name="R2" resistance="2k" />
          <resistor name="R3" resistance="3k" />
          <resistor name="R4" resistance="4k" />
        </group>
      </board>,
    )
    await circuit.renderUntilSettled()
    const schematicComponents = circuit.db.schematic_component.list()
    expect(new Set(schematicComponents.map((c) => c.center.x)).size).toBe(
      columns,
    )
    const [first, second] = schematicComponents
    const actualGap =
      columns === 1
        ? first.center.y - second.center.y - first.size.height
        : second.center.x - first.center.x - first.size.width
    expect(actualGap).toBeCloseTo(gap)

    if (props.schGridGap === "3mm") {
      await expect(circuit).toMatchSchematicSnapshot(import.meta.path)
    }
  }
})
