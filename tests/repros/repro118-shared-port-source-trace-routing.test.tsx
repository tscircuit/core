import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const BuckFootprint = () => (
  <footprint>
    <smtpad
      portHints={["BST"]}
      pcbX="-1mm"
      pcbY="0mm"
      width="0.8mm"
      height="0.8mm"
      shape="rect"
    />
    <smtpad
      portHints={["SW"]}
      pcbX="0mm"
      pcbY="0mm"
      width="0.8mm"
      height="0.8mm"
      shape="rect"
    />
    <smtpad
      portHints={["GND"]}
      pcbX="1mm"
      pcbY="0mm"
      width="0.8mm"
      height="0.8mm"
      shape="rect"
    />
  </footprint>
)

test("repro118: shared source port routes should not report missing pcb traces", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="30mm" height="20mm">
      <chip name="U_BUCK" footprint={<BuckFootprint />} pcbX={-4} pcbY={0} />
      <inductor
        name="L1"
        inductance="47uH"
        footprint="0805"
        pcbX={6}
        pcbY={0}
      />
      {/* Both traces share U_BUCK.SW. This used to create a false
      pcb_trace_missing_error for one of the source traces. */}
      <trace from="U_BUCK.SW" to="L1.pin1" />
      <trace from="U_BUCK.BST" to="U_BUCK.SW" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const missingTraceErrors = circuit.db.pcb_trace_missing_error.list()
  expect(missingTraceErrors).toHaveLength(0)

  const sourceTraces = circuit.db.source_trace.list()
  const pcbTraces = circuit.db.pcb_trace.list()
  expect(sourceTraces).toHaveLength(2)
  expect(pcbTraces.length).toBeGreaterThan(0)

  // The autorouter can merge shared-port routes into one PCB trace whose
  // source_trace_id contains multiple source_trace ids joined with "__".
  for (const sourceTrace of sourceTraces) {
    expect(
      pcbTraces.some((pcbTrace) =>
        pcbTrace.source_trace_id
          ?.split("__")
          .includes(sourceTrace.source_trace_id),
      ),
    ).toBe(true)
  }
})
