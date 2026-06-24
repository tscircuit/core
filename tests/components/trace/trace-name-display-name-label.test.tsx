import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("trace name and displayName map to source_trace and schematic net labels", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="30mm" height="50mm" schMaxTraceDistance={0.1} routingDisabled>
      <resistor name="R1" resistance="1k" footprint="0402" schX={0} schY={0} />
      <capacitor
        name="C1"
        capacitance="1uF"
        footprint="0402"
        schX={6}
        schY={0}
      />
      <trace
        from=".R1 > .pin1"
        to=".C1 > .pin1"
        name="NAME_LABEL"
        displayName="DISPLAY_LABEL"
        schDisplayLabel="SCH_LABEL"
      />

      <resistor name="R2" resistance="1k" footprint="0402" schX={0} schY={8} />
      <capacitor
        name="C2"
        capacitance="1uF"
        footprint="0402"
        schX={6}
        schY={8}
      />
      <trace
        from=".R2 > .pin1"
        to=".C2 > .pin1"
        displayName="DISPLAY_ONLY_LABEL"
        schDisplayLabel="SCH_ONLY_LABEL"
      />

      <resistor name="R3" resistance="1k" footprint="0402" schX={0} schY={16} />
      <capacitor
        name="C3"
        capacitance="1uF"
        footprint="0402"
        schX={6}
        schY={16}
      />
      <trace
        from=".R3 > .pin1"
        to=".C3 > .pin1"
        schDisplayLabel="SCH_FALLBACK_LABEL"
      />

      <resistor name="R4" resistance="1k" footprint="0402" schX={0} schY={24} />
      <capacitor
        name="C4"
        capacitance="1uF"
        footprint="0402"
        schX={6}
        schY={24}
      />
      <trace from=".R4 > .pin1" to=".C4 > .pin1" name="NAME_ONLY_LABEL" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const sourceTraces = circuit.db.source_trace.list()
  const namedTrace = sourceTraces.find((trace) => trace.name === "NAME_LABEL")
  const displayOnlyTrace = sourceTraces.find(
    (trace) => trace.display_name === "DISPLAY_ONLY_LABEL",
  )
  const schFallbackTrace = sourceTraces.find(
    (trace) => trace.display_name === ".R3 > .pin1 to .C3 > .pin1",
  )
  const nameOnlyTrace = sourceTraces.find(
    (trace) => trace.name === "NAME_ONLY_LABEL",
  )

  expect(namedTrace?.display_name).toBe("DISPLAY_LABEL")
  expect(displayOnlyTrace?.name).toBeUndefined()
  expect(schFallbackTrace?.name).toBeUndefined()
  expect(nameOnlyTrace?.display_name).toBe(".R4 > .pin1 to .C4 > .pin1")

  const netLabelTexts = circuit.db.schematic_net_label
    .list()
    .map((label) => label.text)

  expect(netLabelTexts).toContain("NAME_LABEL")
  expect(netLabelTexts).toContain("DISPLAY_ONLY_LABEL")
  expect(netLabelTexts).toContain("SCH_FALLBACK_LABEL")
  expect(netLabelTexts).toContain("NAME_ONLY_LABEL")
  expect(netLabelTexts).not.toContain("DISPLAY_LABEL")
  expect(netLabelTexts).not.toContain("SCH_LABEL")
  expect(netLabelTexts).not.toContain("SCH_ONLY_LABEL")

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
