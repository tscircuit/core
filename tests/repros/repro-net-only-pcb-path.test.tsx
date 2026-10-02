import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("net-only pcbPath reports an error without aborting a valid manual trace", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width={10} height={8} routingDisabled>
      <resistor name="R1" resistance="1k" footprint="0603" />
      <trace from="net.GND" to="net.GND" pcbPath={[{ x: 0, y: 2 }]} />
      <trace
        from="R1.pin1"
        to="net.GND"
        pcbPath={[
          { x: -2, y: 0 },
          { x: -2, y: 2 },
        ]}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit.db.source_trace_not_connected_error.list()).toMatchObject([
    {
      source_trace_id: circuit.db.source_trace.list()[0].source_trace_id,
      message: "pcbPath requires a connected port or pcbPathRelativeTo port",
    },
  ])
  expect(circuit.db.pcb_trace.list()).toHaveLength(1)
  await expect(circuit.db.toArray()).toMatchPcbSnapshot(import.meta.path)
})
