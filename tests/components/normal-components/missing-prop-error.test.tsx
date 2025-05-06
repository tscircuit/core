import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("missing prop error", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <resistor
        footprint="0402"
        name="R1"
        pcbX={3}
      />
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
        "component_type": "resistor",
        "error_type": "source_failed_to_create_component_error",
        "message": "Invalid props for resistor "R1": resistance (Required)",
        "source_failed_to_create_component_error_id": "source_failed_to_create_component_error_0",
        "type": "source_failed_to_create_component_error",
      },
    ]
  `)
})
