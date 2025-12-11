import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("interconnect acts as bridge across cutout on single-layer board", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="8mm" layers={1}>
      <silkscreentext
        text="Trace should use the interconnect to cross the cutout"
        pcbX={-10}
        fontSize={0.3}
        anchorAlignment="top_left"
        pcbY={4}
      />
      {/* Test pad on the left side */}
      <testpoint
        name="TP_LEFT"
        footprintVariant="pad"
        pcbX={-7}
        pcbY={0}
        layer="top"
      />

      {/* Interconnect in the middle - acts as a bridge over the cutout */}
      <interconnect name="IC1" standard="0603" pcbX={0} pcbY={0} />

      {/* Test pad on the right side */}
      <testpoint
        name="TP_RIGHT"
        footprintVariant="pad"
        pcbX={7}
        pcbY={0}
        layer="top"
      />

      {/* Vertical cutout that divides the board below the interconnect
          The only way to get from left to right is through the interconnect */}
      <cutout pcbX={0} pcbY={0} shape="rect" width={0.25} height={8} />

      {/* Trace from left test pad to interconnect pin1 */}
      <trace from="TP_LEFT.pin1" to="TP_RIGHT.pin1" />
    </board>,
  )

  await circuit.renderUntilSettled()

  await expect(circuit).toMatchPcbSnapshot(import.meta.path)

  // Verify the internal connection exists
  const internalConnections =
    circuit.db.source_component_internal_connection.list()
  expect(internalConnections).toHaveLength(1)
})
