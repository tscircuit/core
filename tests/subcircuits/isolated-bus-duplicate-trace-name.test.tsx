import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

/** Two traces share the name "P", so the bus selects one by its pin. */
function DuplicateTraceNameBus() {
  return (
    <>
      <chip name="J1" footprint="soic8" pcbX={-6} />
      <chip name="U1" footprint="soic8" pcbX={6} />
      <trace name="P" from=".J1 > .pin1" to="net.DP" />
      <trace name="P" from="net.DP" to=".U1 > .pin1" />
      <trace name="N" from=".J1 > .pin2" to=".U1 > .pin2" />
      <bus name="DATA" connections={[".J1 > .pin1", "N"]} maxLengthSkew={0.1} />
    </>
  )
}

test("isolated-bus-duplicate-trace-name", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={20} height={30} routingDisabled>
      <subcircuit name="Normal" pcbY={7}>
        <DuplicateTraceNameBus />
      </subcircuit>
      <subcircuit name="Isolated" pcbY={-7} _subcircuitCachingEnabled>
        <DuplicateTraceNameBus />
      </subcircuit>
    </board>,
  )
  await circuit.renderUntilSettled()

  const { db } = circuit
  const sourceBusesBySubcircuit = ["Normal", "Isolated"].map((name) => {
    const subcircuit_id = db.source_group.getWhere({ name })?.subcircuit_id
    expect(subcircuit_id).toBeDefined()
    const sourceTraces = db.source_trace.list({ subcircuit_id })
    const j1Pin1 = db.source_port
      .list({ subcircuit_id })
      .find(
        (sourcePort) =>
          sourcePort.name === "pin1" &&
          db.source_component.get(sourcePort.source_component_id!)?.name ===
            "J1",
      )
    const positiveTrace = sourceTraces.find((sourceTrace) =>
      sourceTrace.connected_source_port_ids.includes(j1Pin1!.source_port_id),
    )
    const negativeTrace = sourceTraces.find(
      (sourceTrace) => sourceTrace.name === "N",
    )
    return {
      sourceBuses: db.source_bus.list({ subcircuit_id }),
      sourceTraceIds: [
        positiveTrace?.source_trace_id,
        negativeTrace?.source_trace_id,
      ],
    }
  })

  for (const { sourceBuses, sourceTraceIds } of sourceBusesBySubcircuit) {
    expect(sourceBuses).toEqual([
      expect.objectContaining({
        name: "DATA",
        max_length_skew: 0.1,
        source_trace_ids: sourceTraceIds,
      }),
    ])
  }
})
