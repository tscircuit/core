import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("(ErrorPlaceholder) - missing prop error", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      {/* @ts-expect-error */}
      <resistor footprint="0402" name="R1" pcbX={3} schX={6} />
    </board>,
  )

  await circuit.renderUntilSettled()

  const circuitJson = circuit.getCircuitJson()

  const sourceMissingPropertyError = circuitJson.filter(
    (e) => e.type === "source_failed_to_create_component_error",
  )
  expect(sourceMissingPropertyError).toMatchInlineSnapshot(`
    [
      {
        "component_name": "R1",
        "error_type": "source_failed_to_create_component_error",
        "is_fatal": true,
        "message": "Could not create resistor "R1". Invalid props for resistor "R1": resistance (Required)",
        "pcb_center": {
          "x": 3,
          "y": 0,
        },
        "schematic_center": {
          "x": 6,
          "y": 0,
        },
        "source_failed_to_create_component_error_id": "source_failed_to_create_component_error_0",
        "type": "source_failed_to_create_component_error",
      },
    ]
  `)
})
