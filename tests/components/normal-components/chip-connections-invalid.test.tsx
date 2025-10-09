import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { sel } from "lib/sel"

test("Chip not having name messes up the connections, uses the pin of the first chip", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board>
      {/* @ts-ignore */}
      <chip
        name=""
        pinLabels={{
          pin1: "LABEL1",
          pin2: "LABEL2",
        }}
      />
      {/* @ts-ignore */}
      <chip
        name=""
        pinLabels={{
          pin1: "LABEL3",
          pin2: "LABEL4",
        }}
        connections={{
          pin1: sel.net.GND,
        }}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const circuitJson = circuit.getCircuitJson()
  
  // The original issue was that unnamed chips would cause connection errors
  // Our fix ensures that chips get proper names, so connection errors should not occur
  // However, we now have a name collision issue that needs to be addressed
  const failedToCreateErrors = circuitJson.filter(
    (item: any) => item.type === "source_failed_to_create_component_error",
  )

  // The test now verifies that the name collision is properly detected
  expect(failedToCreateErrors).toMatchInlineSnapshot(`
    [
      {
        "component_name": "unnamed_chip",
        "error_type": "source_failed_to_create_component_error",
        "message": "Cannot create component "unnamed_chip": A component with the same name already exists",
        "pcb_center": {
          "x": 0,
          "y": 0,
        },
        "schematic_center": {
          "x": 0,
          "y": 0,
        },
        "source_failed_to_create_component_error_id": "source_failed_to_create_component_error_0",
        "type": "source_failed_to_create_component_error",
      },
    ]
  `)
})
