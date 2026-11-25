import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

function Pair() {
  return (
    <>
      <resistor
        name="R1"
        resistance="100"
        footprint="0603"
        pcbX={-3}
        pcbRotation={90}
      />
      <resistor
        name="R2"
        resistance="100"
        footprint="0603"
        pcbX={3}
        pcbRotation={90}
      />
      <trace name="P" from=".R1 > .pin1" to=".R2 > .pin1" pcbStraightLine />
      <trace name="N" from=".R1 > .pin2" to=".R2 > .pin2" pcbStraightLine />
      <differentialpair
        name="PAIR"
        positiveConnection="P"
        negativeConnection="N"
        maxLengthSkew={0.05}
        pcbTraceGap={0.12}
        maxUncoupledLength={0.5}
        targetDifferentialImpedance={90}
      />
    </>
  )
}

test.failing("isolated-differential-pair", async () => {
  const { circuit } = getTestFixture({ platform: { routingDisabled: true } })
  circuit.add(
    <board width={16} height={12}>
      <subcircuit name="Normal" pcbY={3}>
        <Pair />
      </subcircuit>
      <subcircuit name="Isolated" pcbY={-3} _subcircuitCachingEnabled>
        <Pair />
      </subcircuit>
    </board>,
  )
  await circuit.renderUntilSettled()
  circuit.render()

  const circuitJson = circuit.getCircuitJson()
  const sourceGroups = circuitJson.filter((elm) => elm.type === "source_group")
  const sourceTraces = circuitJson.filter((elm) => elm.type === "source_trace")
  const sourceBuses = circuitJson.filter((elm) => elm.type === "source_bus")

  for (const name of ["Normal", "Isolated"]) {
    const subcircuit_id = sourceGroups.find(
      (group) => group.name === name,
    )?.subcircuit_id
    expect(subcircuit_id).toBeDefined()
    const pairTraces = sourceTraces.filter(
      (trace) => trace.subcircuit_id === subcircuit_id,
    )
    expect(pairTraces).toHaveLength(2)
    const [positiveTrace, negativeTrace] = pairTraces
    expect(
      sourceBuses.filter((bus) => bus.subcircuit_id === subcircuit_id),
    ).toEqual([
      expect.objectContaining({
        name: "PAIR",
        max_length_skew: 0.05,
        target_differential_impedance: 90,
        source_trace_ids: [
          positiveTrace.source_trace_id,
          negativeTrace.source_trace_id,
        ],
        differential_pair: {
          positive_source_trace_id: positiveTrace.source_trace_id,
          negative_source_trace_id: negativeTrace.source_trace_id,
          trace_gap: 0.12,
          max_uncoupled_length: 0.5,
        },
      }),
    ])
  }

  expect(sourceBuses).toHaveLength(2)
  expect(new Set(sourceBuses.map((bus) => bus.source_bus_id)).size).toBe(2)
})
