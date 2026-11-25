import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

/** Two 45° legs each add the diagonal over a 0.9 mm horizontal run. */
const TUNING_BUMP_EXTRA_LENGTH_MM = 2 * 0.9 * (Math.SQRT2 - 1)

test("stores signed phase skew for a routed differential pair", async () => {
  const { circuit } = getTestFixture({
    platform: { drcChecksDisabled: true },
  })

  // Adapted from the uncompensated pair in circuit-to-canvas PR #333.
  circuit.add(
    <board width={28} height={8} routeRemaining={false}>
      <testpoint
        name="P_SRC"
        footprintVariant="pad"
        padDiameter={0.65}
        doNotPlace
        pcbX={-12}
        pcbY={0.6}
      />
      <testpoint
        name="P_LOAD"
        footprintVariant="pad"
        padDiameter={0.65}
        doNotPlace
        pcbX={12}
        pcbY={0.6}
      />
      <testpoint
        name="N_SRC"
        footprintVariant="pad"
        padDiameter={0.65}
        doNotPlace
        pcbX={-12}
        pcbY={-0.6}
      />
      <testpoint
        name="N_LOAD"
        footprintVariant="pad"
        padDiameter={0.65}
        doNotPlace
        pcbX={12}
        pcbY={-0.6}
      />
      <trace
        name="P"
        from=".P_SRC > .pin1"
        to=".P_LOAD > .pin1"
        thickness="0.24mm"
        pcbPath={[
          { x: 3, y: 0 },
          { x: 3.9, y: 0.9 },
          { x: 4.7, y: 0.9 },
          { x: 5.6, y: 0 },
        ]}
      />
      <trace
        name="N"
        from=".N_SRC > .pin1"
        to=".N_LOAD > .pin1"
        thickness="0.24mm"
        pcbPath={[]}
      />
      <differentialpair
        name="PAIR"
        positiveConnection="P"
        negativeConnection="N"
        pcbTraceGap="0.96mm"
      />
      <pcbnotetext
        text="Positive trace tuning bump"
        pcbX={-6}
        pcbY={3}
        fontSize={0.7}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const { db } = circuit
  const [bus] = db.source_bus.list()
  const positiveTrace = db.pcb_trace.getWhere({
    source_trace_id: bus.differential_pair?.positive_source_trace_id,
  })
  const negativeTrace = db.pcb_trace.getWhere({
    source_trace_id: bus.differential_pair?.negative_source_trace_id,
  })
  expect(positiveTrace).not.toBeNull()
  expect(negativeTrace).not.toBeNull()

  const phaseSkews = db.pcb_differential_pair_phase_skew.list()
  expect(phaseSkews).toHaveLength(1)
  const [phaseSkew] = phaseSkews
  expect(phaseSkew.source_bus_id).toBe(bus.source_bus_id)
  expect(positiveTrace?.pcb_trace_id).toBe(
    phaseSkew.positive_trace.pcb_trace_id,
  )
  expect(negativeTrace?.pcb_trace_id).toBe(
    phaseSkew.negative_trace.pcb_trace_id,
  )

  const positiveRun = phaseSkew.positive_trace.segments.at(-1)!
  const negativeRun = phaseSkew.negative_trace.segments.at(-1)!
  expect(positiveRun.start.x).toBeCloseTo(negativeRun.start.x, 9)
  expect(positiveRun.end.x).toBeCloseTo(negativeRun.end.x, 9)
  expect(positiveRun.start_length_difference_mm).toBeCloseTo(
    TUNING_BUMP_EXTRA_LENGTH_MM,
    5,
  )
  expect(positiveRun.start_length_difference_mm).toBe(
    -negativeRun.start_length_difference_mm,
  )
  expect(positiveRun.end_length_difference_mm).toBe(
    -negativeRun.end_length_difference_mm,
  )

  circuit.firstChild?._markDirty("PcbDifferentialPairPhaseSkewRender")
  await circuit.renderUntilSettled()
  expect(db.pcb_differential_pair_phase_skew.list()).toEqual([phaseSkew])
})
