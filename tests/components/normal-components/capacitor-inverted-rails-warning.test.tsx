import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("warns only for the capacitor with inverted rails", async () => {
  const { circuit } = getTestFixture()
  circuit.pcbDisabled = true
  circuit.add(
    <board schTraceAutoLabelEnabled schLayout={{ layoutMode: "relative" }}>
      <capacitor
        name="C1"
        capacitance="100nF"
        schX={-3}
        schY={0}
        schRotation={90}
      />
      <trace from=".C1 > .pin1" to="net.V3V3" />
      <trace from=".C1 > .pin2" to="net.GND" />
      <capacitor
        name="C2"
        capacitance="100nF"
        schX={3}
        schY={0}
        schRotation={270}
      />
      <trace from=".C2 > .pin1" to="net.V3V3" />
      <trace from=".C2 > .pin2" to="net.GND" />
    </board>,
  )
  await circuit.renderUntilSettled()
  const invertedCapacitor = circuit.db.source_component
    .list()
    .find((component) => component.name === "C1")!
  const warnings = circuit.db.schematic_component_styling_warning
    .list()
    .filter((warning) => warning.styling_issue_type === "inverted_rails")
  expect(warnings).toEqual([
    expect.objectContaining({
      source_component_id: invertedCapacitor.source_component_id,
    }),
  ])
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
