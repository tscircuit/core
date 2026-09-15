import { expect, test } from "bun:test"
import { getSchematicComponentWithTextBounds } from "lib/utils/schematic/getSchematicComponentWithTextBounds"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { getSchematicComponentTextBoundingBoxRects } from "tests/fixtures/getSchematicComponentTextBoundingBoxRects"

test("current source layout bounds include reference and value text", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board routingDisabled>
      {[0, 90, 180, 270].map((rotation, index) => (
        <currentsource
          key={rotation}
          name={`I${index + 1}`}
          displayName={`CURRENT_SOURCE_${rotation}`}
          current="125mA"
          schX={index * 6}
          schY={0}
          schRotation={rotation}
        />
      ))}
    </board>,
  )
  circuit.render()

  for (const schematicComponent of circuit.db.schematic_component.list()) {
    const bounds = getSchematicComponentWithTextBounds({
      db: circuit.db,
      schematicComponent,
    })
    expect(bounds).not.toBeNull()
    expect(bounds!.maxX - bounds!.minX).toBeGreaterThan(
      schematicComponent.size.width,
    )
  }

  for (const rect of getSchematicComponentTextBoundingBoxRects(circuit.db)) {
    circuit.db.schematic_rect.insert(rect)
  }
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
