import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("repro155: redundant connections to internally connected pushbutton pins remain visible", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board schMaxTraceDistance={1}>
      <schematictext
        text="Expected: SIGNAL and GND net labels are visible at SW1"
        fontSize={0.2}
        schX={0}
        schY={2}
      />
      <pushbutton
        name="SW1"
        schX={0}
        pinLabels={{
          pin1: "pin1",
          pin2: "pin2",
          pin3: "pin3",
          pin4: "pin4",
        }}
        internallyConnectedPins={[
          ["pin1", "pin3"],
          ["pin2", "pin4"],
        ]}
        connections={{
          pin1: "net.SIGNAL",
          pin3: "net.SIGNAL",
          pin2: "net.GND",
          pin4: "net.GND",
        }}
        footprint="pushbutton_id1.3mm_od2mm"
      />
    </board>,
  )

  circuit.render()

  expect(circuit.db.source_trace.list()).toHaveLength(4)
  expect(
    circuit.db.schematic_net_label
      .list()
      .map((label) => label.text)
      .sort(),
  ).toEqual(["GND", "SIGNAL"])
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
