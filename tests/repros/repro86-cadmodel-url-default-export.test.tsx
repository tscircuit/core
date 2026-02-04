import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import "lib/register-catalogue"

test("repro: cadmodel modelUrl default export object triggers error", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <chip
        name="U1"
        footprint="soic8"
        cadModel={
          <cadmodel
            // Simulate asset import objects like { default: "/path/to/model.step" }
            // from a bundler by passing a default export object.
            modelUrl={
              {
                default: "https://example.com/assets/fixture-model.step",
              } as unknown as string
            }
          />
        }
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const circuitJson = circuit.getCircuitJson()
  const sourceErrors = circuitJson.filter(
    (e) => e.type === "source_failed_to_create_component_error",
  )

  expect(sourceErrors).toMatchInlineSnapshot(`
    [
      {
        "component_name": undefined,
        "error_type": "source_failed_to_create_component_error",
        "message": 
    "Could not create cadmodel. Expected null, received object; Expected string, received object Details: Props: {
      "modelUrl": {
        "default": "https://example.com/assets/fixture-model.step"
      },
      "componentType": "cadmodel",
      "error": {
        "componentName": "cadmodel",
        "originalProps": {
          "modelUrl": "[Circular]"
        },
        "formattedError": {
          "_errors": [
            "Expected null, received object",
            "Expected string, received object"
          ],
          "modelUrl": {
            "_errors": [
              "Expected string, received object"
            ]
          }
        }
      },
      "type": "unknown",
      "error_type": "source_failed_to_create_component_error",
      "message": "Invalid props for cadmodel (unnamed): modelUrl (Expected string, received object)",
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
