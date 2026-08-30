import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("schematic rectangles preserve explicit fills and existing fill behavior", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="10mm" routingDisabled>
      <chip
        name="U1"
        symbol={
          <symbol>
            <schematicrect
              schX={-4}
              width={3}
              height={2}
              color="#880000"
              fillColor="#FFFFFF"
              isFilled
            />
            <schematictext
              schX={-4}
              schY={-1.5}
              fontSize={0.2}
              text="White fill"
            />
            <schematicrect width={3} height={2} color="#008800" isFilled />
            <schematictext
              schY={-1.5}
              fontSize={0.2}
              text="Stroke-color fallback"
            />
            <schematicrect
              schX={4}
              width={3}
              height={2}
              color="#000088"
              fillColor="#FFD700"
              isFilled={false}
            />
            <schematictext
              schX={4}
              schY={-1.5}
              fontSize={0.2}
              text="Unfilled"
            />
          </symbol>
        }
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  await expect(circuit).toMatchSchematicSnapshot(import.meta.path)

  expect(circuit.db.schematic_rect.list()).toMatchObject([
    { color: "#880000", fill_color: "#FFFFFF", is_filled: true },
    { color: "#008800", fill_color: undefined, is_filled: true },
    { color: "#000088", fill_color: "#FFD700", is_filled: false },
  ])
})
