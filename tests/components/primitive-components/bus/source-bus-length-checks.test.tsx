import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("emits resolved bus constraints for length checks even when routing is disabled", () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={24} height={14} routingDisabled>
      <bus
        name="DATA"
        connections={["D0", ".U1 > .pin2"]}
        maxLengthSkew="0.5mm"
      />
      <chip name="U1" footprint="soic8" pcbX={-7} />
      <chip name="U2" footprint="soic8" pcbX={7} />
      <trace name="D0" from=".U1 > .pin1" to=".U2 > .pin1" maxLength="10mm" />
      <trace name="D1" from=".U1 > .pin2" to=".U2 > .pin2" />
      <pcbnotetext
        pcbY={-5}
        text="DATA: max skew 0.5mm; D0 max length 10mm"
        fontSize={0.7}
      />
    </board>,
  )
  circuit.render()
  const sourceTraces = ["D0", "D1"].map(
    (name) => circuit.db.source_trace.getWhere({ name })!,
  )
  expect(circuit.db.source_bus.list()).toEqual([
    expect.objectContaining({
      name: "DATA",
      source_trace_ids: sourceTraces.map((trace) => trace.source_trace_id),
      max_length_skew: 0.5,
      subcircuit_id: circuit.firstChild!.getSubcircuit().subcircuit_id,
    }),
  ])
  expect(sourceTraces[0].max_length).toBe(10)
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
