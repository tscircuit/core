import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("group port arrays map an LED matrix interface", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="34mm" height="22mm">
      <group
        name="MATRIX"
        showAsSchematicBox
        schTitle="3×3 LED Matrix"
        pcbGrid
        pcbGridCols={3}
        pcbGridRows={3}
        pcbGridGap="3mm"
        schPinArrangement={{
          leftSide: {
            direction: "top-to-bottom",
            pins: ["ROW1", "ROW2", "ROW3"],
          },
          rightSide: {
            direction: "top-to-bottom",
            pins: ["COL1", "COL2", "COL3"],
          },
        }}
      >
        <port
          name="ROW1"
          direction="left"
          connectsTo={["D1.anode", "D2.anode", "D3.anode"]}
        />
        <port
          name="ROW2"
          direction="left"
          connectsTo={["D4.anode", "D5.anode", "D6.anode"]}
        />
        <port
          name="ROW3"
          direction="left"
          connectsTo={["D7.anode", "D8.anode", "D9.anode"]}
        />
        <port
          name="COL1"
          direction="right"
          connectsTo={["D1.cathode", "D4.cathode", "D7.cathode"]}
        />
        <port
          name="COL2"
          direction="right"
          connectsTo={["D2.cathode", "D5.cathode", "D8.cathode"]}
        />
        <port
          name="COL3"
          direction="right"
          connectsTo={["D3.cathode", "D6.cathode", "D9.cathode"]}
        />

        <led name="D1" color="red" footprint="0603" />
        <led name="D2" color="red" footprint="0603" />
        <led name="D3" color="red" footprint="0603" />
        <led name="D4" color="red" footprint="0603" />
        <led name="D5" color="red" footprint="0603" />
        <led name="D6" color="red" footprint="0603" />
        <led name="D7" color="red" footprint="0603" />
        <led name="D8" color="red" footprint="0603" />
        <led name="D9" color="red" footprint="0603" />

        <trace from=".D1 > .anode" to=".D2 > .anode" />
        <trace from=".D2 > .anode" to=".D3 > .anode" />
        <trace from=".D4 > .anode" to=".D5 > .anode" />
        <trace from=".D5 > .anode" to=".D6 > .anode" />
        <trace from=".D7 > .anode" to=".D8 > .anode" />
        <trace from=".D8 > .anode" to=".D9 > .anode" />
        <trace from=".D1 > .cathode" to=".D4 > .cathode" />
        <trace from=".D4 > .cathode" to=".D7 > .cathode" />
        <trace from=".D2 > .cathode" to=".D5 > .cathode" />
        <trace from=".D5 > .cathode" to=".D8 > .cathode" />
        <trace from=".D3 > .cathode" to=".D6 > .cathode" />
        <trace from=".D6 > .cathode" to=".D9 > .cathode" />
      </group>
    </board>,
  )

  await circuit.renderUntilSettled()

  const publicPortNames = circuit.db.source_port
    .list()
    .filter((port) => port.source_component_id === null)
    .map((port) => port.name)
    .sort()

  expect(publicPortNames).toEqual([
    "COL1",
    "COL2",
    "COL3",
    "ROW1",
    "ROW2",
    "ROW3",
  ])
  expect(circuit.db.pcb_trace.list().length).toBeGreaterThan(0)
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
  expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    showPcbGroups: true,
  })
})
