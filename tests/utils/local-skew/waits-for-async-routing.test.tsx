import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { getStoredLocalSkew } from "tests/fixtures/local-skew/get-stored-local-skew"
import { localSkewSvg } from "tests/fixtures/local-skew/local-skew-svg"

test("local skew is emitted after asynchronous differential pair routing completes", async () => {
  const { circuit } = getTestFixture({ platform: { drcChecksDisabled: true } })
  circuit.add(
    <board width={20} height={15}>
      <chip name="U1" footprint="soic8" pcbX={-5} />
      <chip name="U2" footprint="soic8" pcbX={5} />
      <trace name="DP" from=".U1 > .pin8" to=".U2 > .pin1" />
      <trace name="DN" from=".U1 > .pin7" to=".U2 > .pin2" />
      <differentialpair
        name="DATA"
        positiveConnection="DP"
        negativeConnection="DN"
        pcbTraceGap={1.12}
      />
    </board>,
  )

  circuit.render()
  expect(circuit.db.pcb_trace.list()).toHaveLength(0)
  expect(getStoredLocalSkew(circuit.getCircuitJson())).toEqual([])
  await circuit.renderUntilSettled()

  const traces = circuit.db.pcb_trace.list()
  expect(traces).toHaveLength(2)
  const circuitJson = circuit.getCircuitJson()
  const pairs = getStoredLocalSkew(circuitJson)
  expect(pairs).toHaveLength(1)
  expect(
    [pairs[0].positive.pcb_trace_id, pairs[0].negative.pcb_trace_id].sort(),
  ).toEqual(traces.map((trace) => trace.pcb_trace_id).sort())
  expect(pairs[0].max_local_skew).toBe(0)
  await expect(localSkewSvg(circuitJson)).toMatchSvgSnapshot(import.meta.path)
})
