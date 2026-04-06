import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("chip with invalid pinLabels key fails with a clear error", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm">
      <connector
        name="J1"
        footprint="usb_c_16p"
        pinLabels={{
          A1: "GND",
          B12: "GND",
          A5: "CC1",
          B5: "CC2",
        }}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const errors = circuit
    .getCircuitJson()
    .filter((el) => el.type === "source_failed_to_create_component_error")

  expect(errors).toMatchInlineSnapshot(`
[
  {
    "component_name": "J1",
    "error_type": "source_failed_to_create_component_error",
    "message": 
"Could not create connector "J1". Invalid props for connector "J1": pinLabels (Invalid pinLabels key "A1". Expected "pin<number>" (e.g. pin1, pin2).) Details: Props: {
  "name": "J1",
  "footprint": "usb_c_16p",
  "pinLabels": {
    "A1": "GND",
    "B12": "GND",
    "A5": "CC1",
    "B5": "CC2"
  },
  "componentType": "connector",
  "error": {
    "componentName": "connector",
    "originalProps": {
      "name": "J1",
      "footprint": "usb_c_16p",
      "pinLabels": {
        "A1": "GND",
        "B12": "GND",
        "A5": "CC1",
        "B5": "CC2"
      }
    },
    "formattedError": {
      "_errors": [],
      "pinLabels": {
        "_errors": [
          "Invalid pinLabels key \\"A1\\". Expected \\"pin<number>\\" (e.g. pin1, pin2)."
        ]
      }
    }
  },
  "type": "unknown",
  "component_name": "J1",
  "error_type": "source_failed_to_create_component_error",
  "message": "Invalid props for connector \\"J1\\": pinLabels (Invalid pinLabels key \\"A1\\". Expected \\"pin<number>\\" (e.g. pin1, pin2).)",
  "pcbX": 0,
  "pcbY": 0
}"
,
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
