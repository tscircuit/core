import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { test, expect } from "bun:test"

test("(ErrorPlaceholder) - missing prop error with parent transform", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board
      width="10mm"
      height="10mm"
      manualEdits={{
        pcb_placements: [
          {
            selector: "R1",
            center: { x: 3, y: 0 },
          },
        ],
        schematic_placements: [
          {
            selector: "R1",
            center: { x: 6, y: 0 },
          },
        ],
      }}
    >
      {/* @ts-expect-error */}
      <resistor footprint="0402" name="R1" />
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
          "message": 
      "Could not create resistor "R1". Invalid props for resistor "R1": resistance (Required) Details: Props: {
        "footprint": "0402",
        "name": "R1",
        "componentType": "resistor",
        "error": {
          "componentName": "resistor",
          "originalProps": {
            "footprint": "0402",
            "name": "R1"
          },
          "formattedError": {
            "_errors": [],
            "resistance": {
              "_errors": [
                "Required",
                "Required"
              ]
            }
          }
        },
        "type": "unknown",
        "component_name": "R1",
        "error_type": "source_failed_to_create_component_error",
        "message": "Invalid props for resistor \\"R1\\": resistance (Required)",
        "pcbX": 0,
        "pcbY": 0
      }"
      ,
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
