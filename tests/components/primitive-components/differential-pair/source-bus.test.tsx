import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("exports differential-pair membership without routing or duplicate records", () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={24} height={14} routingDisabled>
      <differentialpair
        name="USB"
        positiveConnection="USB_P"
        negativeConnection=".U1 > .pin2"
        maxLengthSkew={0.05}
      />
      <chip name="U1" footprint="soic8" pcbX={-7} />
      <chip name="U2" footprint="soic8" pcbX={7} />
      <trace name="USB_P" from=".U1 > .pin1" to=".U2 > .pin1" />
      <trace name="USB_N" from=".U1 > .pin2" to=".U2 > .pin2" />
      <trace name="OTHER" from=".U1 > .pin3" to=".U2 > .pin3" />
    </board>,
  )
  circuit.render()
  circuit.render()
  expect(circuit.db.source_bus.list()).toEqual([
    expect.objectContaining({
      name: "USB",
      source_trace_ids: ["USB_P", "USB_N"].map(
        (name) => circuit.db.source_trace.getWhere({ name })!.source_trace_id,
      ),
      max_length_skew: 0.05,
      subcircuit_id: circuit.firstChild!.getSubcircuit().subcircuit_id,
    }),
  ])
})
