import { expect, test } from "bun:test"
import type { SchematicPort, SchematicText, SchematicTrace } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const chipSelector = ".U1"
const powerSheetName = "U1 Power"
const chipSectionWidth = 2.245
const chipSectionHeight = 1

const powerPinLabels = {
  pin7: "VCC",
  pin8: "GND",
}

const allPinLabels = {
  pin1: "D0",
  pin2: "D1",
  pin3: "D2",
  pin4: "D3",
  pin5: "D4",
  pin6: "D5",
  pin7: "VCC",
  pin8: "GND",
}

test("repro156: schematicbox chipRef pins receive schematic traces", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board>
      <chip
        footprint="soic8"
        schX={0}
        schY={2}
        name="U1"
        pinLabels={allPinLabels}
      />

      <schematicbox
        schX={6}
        schY={2}
        name="U1A"
        chipRef={chipSelector}
        width={chipSectionWidth}
        height={chipSectionHeight}
        pinLabels={powerPinLabels}
        schPinArrangement={{
          leftSide: ["GND", "VCC"],
          rightSide: [],
        }}
      />

      <netlabel schX={3} schY={2} net="GND" connectsTo="U1.GND" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const circuitJson = circuit.getCircuitJson()
  const u1aSchematicText = circuitJson.find(
    (element): element is SchematicText =>
      element.type === "schematic_text" && element.text === "U1A",
  )
  const u1aGndSchematicPort = circuitJson.find(
    (element): element is SchematicPort =>
      element.type === "schematic_port" &&
      element.schematic_component_id ===
        u1aSchematicText?.schematic_component_id &&
      element.display_pin_label === "GND",
  )

  expect(u1aGndSchematicPort).toBeDefined()
  const u1aGndCenter = u1aGndSchematicPort!.center

  const schematicTraceReachesU1aGnd = circuitJson
    .filter(
      (element): element is SchematicTrace =>
        element.type === "schematic_trace",
    )
    .some((trace) =>
      trace.edges.some(
        (edge) =>
          (edge.from.x === u1aGndCenter.x && edge.from.y === u1aGndCenter.y) ||
          (edge.to.x === u1aGndCenter.x && edge.to.y === u1aGndCenter.y),
      ),
    )
  const footprintOverlapErrors = circuitJson.filter(
    (element) => element.type === "pcb_footprint_overlap_error",
  )

  expect(schematicTraceReachesU1aGnd).toBeTrue()
  expect(footprintOverlapErrors).toHaveLength(0)
})
