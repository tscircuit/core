import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("trace schDisplayLabel takes precedence over name and displayName for schematic net label text", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="12mm" schMaxTraceDistance={0.1} routingDisabled>
      <resistor name="R1" resistance="1k" footprint="0402" schX={-3} schY={0} />
      <capacitor
        name="C1"
        capacitance="1uF"
        footprint="0402"
        schX={3}
        schY={0}
      />
      <trace
        from=".R1 > .pin1"
        to=".C1 > .pin1"
        name="NAME_LABEL"
        displayName="DISPLAY_LABEL"
        schDisplayLabel="SCH_LABEL"
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const sourceTrace = circuit.db.source_trace.getWhere({ name: "NAME_LABEL" })
  expect(sourceTrace?.display_name).toBe("DISPLAY_LABEL")

  const netLabelTexts = circuit.db.schematic_net_label
    .list()
    .map((label) => label.text)
  expect(netLabelTexts).toContain("SCH_LABEL")
  expect(netLabelTexts).not.toContain("DISPLAY_LABEL")
  expect(netLabelTexts).not.toContain("NAME_LABEL")

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
