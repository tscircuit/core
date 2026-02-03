import { test, expect } from "bun:test"
import "lib/register-catalogue"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("Schematic box with invalid props", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <chip
        name="U1"
        footprint={"soic8"}
        schPinStyle={{
          pin3: { bottomMargin: 0.1 },
        }}
      />
      <schematicbox strokeStyle="dashed" schX={6} schY={-2} />
      <schematicbox
        padding={0.3}
        strokeStyle="dashed"
        overlay={[
          ".U1 > .pin1",
          ".U1 > .pin2",
          ".U1 > .pin3",
          ".U1 > .pin4",
          ".U1 > .pin5",
          ".U1 > .pin6",
          ".U1 > .pin7",
          ".U1 > .pin8",
        ]}
        width={2}
        height={2}
        schX={0}
        schY={0}
      />
    </board>,
  )
  circuit.render()
  expect(
    circuit
      .getCircuitJson()
      .filter((x) => x.type === "source_failed_to_create_component_error"),
  ).toMatchInlineSnapshot(
    `
      [
        {
          "component_name": undefined,
          "error_type": "source_failed_to_create_component_error",
          "message": 
      "Could not create schematicbox. Must provide either both \`width\` and \`height\`, or a non-empty \`overlay\` array. Details: Props: {
        "strokeStyle": "dashed",
        "schX": 6,
        "schY": -2,
        "componentType": "schematicbox",
        "error": {
          "componentName": "schematicbox",
          "originalProps": {
            "strokeStyle": "dashed",
            "schX": 6,
            "schY": -2
          },
          "formattedError": {
            "_errors": [
              "Must provide either both \`width\` and \`height\`, or a non-empty \`overlay\` array."
            ]
          }
        },
        "type": "unknown",
        "error_type": "source_failed_to_create_component_error",
        "message": "Invalid props for schematicbox (unnamed): ",
        "pcbX": 0,
        "pcbY": 0
      }"
      ,
          "pcb_center": {
            "x": 0,
            "y": 0,
          },
          "schematic_center": {
            "x": 6,
            "y": -2,
          },
          "source_failed_to_create_component_error_id": "source_failed_to_create_component_error_0",
          "type": "source_failed_to_create_component_error",
        },
        {
          "component_name": undefined,
          "error_type": "source_failed_to_create_component_error",
          "message": 
      "Could not create schematicbox. Cannot provide both \`width\`/\`height\` and \`overlay\` at the same time. Details: Props: {
        "padding": 0.3,
        "strokeStyle": "dashed",
        "overlay": [
          ".U1 > .pin1",
          ".U1 > .pin2",
          ".U1 > .pin3",
          ".U1 > .pin4",
          ".U1 > .pin5",
          ".U1 > .pin6",
          ".U1 > .pin7",
          ".U1 > .pin8"
        ],
        "width": 2,
        "height": 2,
        "schX": 0,
        "schY": 0,
        "componentType": "schematicbox",
        "error": {
          "componentName": "schematicbox",
          "originalProps": {
            "padding": 0.3,
            "strokeStyle": "dashed",
            "overlay": "[Circular]",
            "width": 2,
            "height": 2,
            "schX": 0,
            "schY": 0
          },
          "formattedError": {
            "_errors": [
              "Cannot provide both \`width\`/\`height\` and \`overlay\` at the same time."
            ]
          }
        },
        "type": "unknown",
        "error_type": "source_failed_to_create_component_error",
        "message": "Invalid props for schematicbox (unnamed): ",
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
          "source_failed_to_create_component_error_id": "source_failed_to_create_component_error_1",
          "type": "source_failed_to_create_component_error",
        },
      ]
      `,
  )
})
