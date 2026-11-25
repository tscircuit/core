import { expect, test } from "bun:test"
import { getDifferentialPairPhaseSkew } from "compute-differential-pair-phase-skew"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("stores final teardrop widths when another board's router fails", async () => {
  const { circuit } = getTestFixture({
    platform: { placementDrcChecksDisabled: true },
  })
  const { db } = circuit
  const failRouter = Promise.withResolvers<void>()

  circuit.add(
    <panel width={50} height={30}>
      <board name="pair" width={28} height={8} pcbY={-7}>
        <testpoint
          name="P_SRC"
          footprintVariant="pad"
          padDiameter={0.65}
          pcbX={-12}
          pcbY={0.6}
        />
        <testpoint
          name="P_LOAD"
          footprintVariant="pad"
          padDiameter={0.65}
          pcbX={12}
          pcbY={0.6}
        />
        <testpoint
          name="N_SRC"
          footprintVariant="pad"
          padDiameter={0.65}
          pcbX={-12}
          pcbY={-0.6}
        />
        <testpoint
          name="N_LOAD"
          footprintVariant="pad"
          padDiameter={0.65}
          pcbX={12}
          pcbY={-0.6}
        />
        <trace
          name="P"
          from=".P_SRC > .pin1"
          to=".P_LOAD > .pin1"
          thickness={0.24}
          pcbTeardrops
        />
        <trace
          name="N"
          from=".N_SRC > .pin1"
          to=".N_LOAD > .pin1"
          thickness={0.24}
          pcbTeardrops
        />
        <differentialpair
          name="PAIR"
          positiveConnection="P"
          negativeConnection="N"
          pcbTraceGap={0.96}
        />
      </board>
      <board
        name="unroutable"
        width={16}
        height={8}
        pcbY={7}
        autorouter={{
          algorithmFn: async () => {
            await failRouter.promise
            throw new Error("Second board's router failed")
          },
        }}
      >
        <resistor name="R1" resistance="1k" footprint="0402" pcbX={-3} />
        <resistor name="R2" resistance="1k" footprint="0402" pcbX={3} />
        <trace from=".R1 > .pin1" to=".R2 > .pin1" />
      </board>
    </panel>,
  )

  // Finish the second router only after the first board publishes copper.
  circuit.on("renderable:renderLifecycle:PcbTraceRender:end", () => {
    if (db.pcb_trace.list().length === 2) failRouter.resolve()
  })
  const timeout = setTimeout(() => {
    failRouter.reject(new Error("Differential pair routes were not published"))
  }, 3000)
  try {
    await circuit.renderUntilSettled()
  } finally {
    clearTimeout(timeout)
  }

  expect(db.pcb_autorouting_error.list()).toMatchObject([
    { message: "Second board's router failed" },
  ])
  const storedSkews = db.pcb_differential_pair_phase_skew.list()
  expect(storedSkews).toHaveLength(1)
  const [storedSkew] = storedSkews
  const [finalSkew] = getDifferentialPairPhaseSkew({
    circuitJson: circuit.getCircuitJson(),
  })
  const finalTeardropWidth = Math.max(
    ...finalSkew.positive_trace.segments.map(({ width }) => width),
  )
  const storedTeardropWidth = Math.max(
    ...storedSkew.positive_trace.segments.map(({ width }) => width),
  )
  expect(finalTeardropWidth).toBeGreaterThan(0.24)
  expect(storedTeardropWidth).toBe(finalTeardropWidth)
})
