import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("named net overrides trace schDisplayLabel", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width={10} height={8} routingDisabled>
      <net name="V5_INTERNAL" isPowerNet />
      <capacitor name="C1" capacitance="100nF" footprint="0402" />
      <trace from=".C1 > .pin1" to="net.V5_INTERNAL" schDisplayLabel="5V" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const sourceNet = circuit.db.source_net.getWhere({ name: "V5_INTERNAL" })!
  expect(circuit.db.source_trace.list()[0].connected_source_net_ids).toEqual([
    sourceNet.source_net_id,
  ])
  expect(
    circuit.db.schematic_net_label.list().map((label) => label.text),
  ).toEqual(["V5_INTERNAL"])

  await expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
