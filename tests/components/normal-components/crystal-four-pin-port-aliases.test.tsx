import { expect, test } from "bun:test"
import { Crystal } from "lib/components/normal-components/Crystal"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("four-pin crystal aliases resolve to distinct numbered pins", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <crystal
        name="Y1"
        frequency="48MHz"
        loadCapacitance={0}
        pinVariant="four_pin"
        connections={{
          pin1: "net.PIN1_SIGNAL",
          pin2: "net.PIN2_GND",
          pin3: "net.PIN3_SIGNAL",
          pin4: "net.PIN4_GND",
        }}
      />
      <schematictext
        schX={0}
        schY={2}
        text="4-PIN CRYSTAL: GND1=PIN4 (TOP), GND2=PIN2 (BOTTOM)"
        fontSize={0.2}
      />
    </board>,
  )

  circuit.render()

  const crystal = circuit.selectOne("crystal") as Crystal

  const inlineLabels = circuit.db.schematic_text
    .list()
    .filter((text) => text.source_trace_id)
  const inlineLabelByText = new Map(
    inlineLabels.map((text) => [text.text, text]),
  )

  expect(inlineLabelByText.get("PIN1_SIGNAL")).toMatchObject({
    anchor: "right",
    rotation: 0,
  })
  expect(inlineLabelByText.get("PIN3_SIGNAL")).toMatchObject({
    anchor: "left",
    rotation: 0,
  })
  expect(inlineLabelByText.get("PIN4_GND")).toMatchObject({
    anchor: "left",
    rotation: -90,
  })
  expect(inlineLabelByText.get("PIN2_GND")).toMatchObject({
    anchor: "right",
    rotation: -90,
  })

  for (const labelText of ["PIN4_GND", "PIN2_GND"]) {
    const inlineLabel = inlineLabelByText.get(labelText)!
    const inlineTrace = circuit.db.schematic_trace
      .list()
      .find((trace) => trace.source_trace_id === inlineLabel.source_trace_id)!
    expect(inlineTrace.edges).toHaveLength(1)
    expect(inlineTrace.edges[0]!.from.x).toBeCloseTo(
      inlineTrace.edges[0]!.to.x,
      9,
    )
    expect(inlineTrace.edges[0]!.from.y).not.toBe(inlineTrace.edges[0]!.to.y)
  }

  expect(
    circuit.db.schematic_trace
      .list()
      .some((trace) =>
        trace.source_trace_id?.startsWith("available-net-orientation-"),
      ),
  ).toBe(false)

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
