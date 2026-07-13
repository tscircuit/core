import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("group port connectsTo arrays wire an LED matrix", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="34mm" height="22mm">
      <pcbnotetext
        text="port.connectsTo arrays: 3x3 LED matrix"
        pcbX={0}
        pcbY={-8}
      />
      <group
        name="MATRIX"
        showAsSchematicBox
        schTitle="3x3 LED Matrix"
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
      </group>
      <netlabel net="ROW1" connectsTo="MATRIX.ROW1" />
      <netlabel net="ROW2" connectsTo="MATRIX.ROW2" />
      <netlabel net="ROW3" connectsTo="MATRIX.ROW3" />
      <netlabel net="COL1" connectsTo="MATRIX.COL1" />
      <netlabel net="COL2" connectsTo="MATRIX.COL2" />
      <netlabel net="COL3" connectsTo="MATRIX.COL3" />
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
  const internalSourceTraces = circuit.db.source_trace
    .list()
    .filter((trace) => trace.connected_source_port_ids.length === 2)
  expect(internalSourceTraces).toHaveLength(18)
  expect(circuit.db.source_trace_not_connected_error.list()).toHaveLength(0)
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
  expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    showPcbGroups: true,
  })
})
