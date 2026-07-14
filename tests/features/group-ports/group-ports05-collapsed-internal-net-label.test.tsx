import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("collapsed group port exposes its internal connectivity key", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="16mm" height="10mm">
      <group
        name="MATRIX_ROW"
        showAsSchematicBox
        schTitle="LED Row"
        pcbGrid
        pcbGridCols={2}
        pcbGridGap="3mm"
      >
        <port
          name="ROW1"
          direction="left"
          connectsTo={["D1.anode", "D2.anode"]}
        />

        <led name="D1" color="red" footprint="0603" />
        <led name="D2" color="red" footprint="0603" />

        <trace from=".D1 > .anode" to=".D2 > .anode" />
      </group>
    </board>,
  )

  await circuit.renderUntilSettled()

  const publicPortNames = circuit.db.source_port
    .list()
    .filter((port) => port.source_component_id === null)
    .map((port) => port.name)

  expect(publicPortNames).toEqual(["ROW1"])

  const leakedLabels = circuit.db.schematic_net_label
    .list()
    .filter((label) => /unnamed|connectivity_net/.test(label.text))

  expect(leakedLabels).toHaveLength(1)
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
