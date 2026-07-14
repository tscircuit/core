import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("collapsed group port preserves an external named net label", async () => {
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

      <trace from=".MATRIX_ROW > .ROW1" to="net.ROW1" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const labels = circuit.db.schematic_net_label.list()

  expect(labels.some((label) => label.text === "ROW1")).toBe(true)
  expect(
    labels.filter((label) => /unnamed|connectivity_net/.test(label.text)),
  ).toHaveLength(0)
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
