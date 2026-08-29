import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("grouped cross sections render distinct titles and dividers", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board routingDisabled>
      <schematicsection name="horizontal" displayName="1. Horizontal section" />
      <schematicsection name="vertical" displayName="2. Vertical section" />

      <resistor
        name="R1"
        resistance="1k"
        schX={-3}
        schY={0}
        schSectionName="horizontal"
      />
      <resistor
        name="R2"
        resistance="1k"
        schX={3}
        schY={0}
        schSectionName="horizontal"
      />
      <resistor
        name="R3"
        resistance="1k"
        schX={0}
        schY={-3}
        schSectionName="vertical"
      />
      <resistor
        name="R4"
        resistance="1k"
        schX={0}
        schY={3}
        schSectionName="vertical"
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const schematicDividerCoordinates = circuit.db.schematic_line
    .list()
    .map(({ x1, y1, x2, y2 }) => ({ x1, y1, x2, y2 }))
  expect(schematicDividerCoordinates).toEqual([
    { x1: -1.5, y1: -4.325, x2: -1.5, y2: 4.325 },
    { x1: -1.5, y1: 0, x2: 1.5, y2: 0 },
    { x1: 1.5, y1: -4.325, x2: 1.5, y2: 4.325 },
  ])

  const [horizontalSectionTitlePosition, verticalSectionTitlePosition] =
    circuit.db.schematic_text
      .list()
      .map((sectionTitle) => sectionTitle.position)

  expect(horizontalSectionTitlePosition!.x).toBeCloseTo(-3.6)
  expect(horizontalSectionTitlePosition!.y).toBeCloseTo(0.625)
  expect(verticalSectionTitlePosition!.x).toBeCloseTo(-1.3)
  expect(verticalSectionTitlePosition!.y).toBeCloseTo(3.625)
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
