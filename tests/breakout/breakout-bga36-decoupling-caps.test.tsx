import { expect, test } from "bun:test"
import { createAutoroutingPhaseIoStack } from "tests/fixtures/create-autorouting-phase-io-stack"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const bgaFootprint = "bga36_grid6x6_p0.8mm_pad0.35mm_circularpads" as const

const DecouplingCap = ({
  name,
  pcbX,
  pcbY,
  pcbRotation = 0,
}: {
  name: string
  pcbX: number
  pcbY: number
  pcbRotation?: number
}) => (
  <capacitor
    name={name}
    capacitance="100nF"
    footprint="0603"
    pcbX={pcbX}
    pcbY={pcbY}
    pcbRotation={pcbRotation}
  />
)

test("breakout defaults to fanout for a 6x6 BGA surrounded by four 0603 decoupling caps", async () => {
  const { circuit } = getTestFixture()
  const autoroutingPhaseIoStack = createAutoroutingPhaseIoStack(circuit)

  circuit.add(
    <board
      width="14mm"
      height="14mm"
      layers={2}
      minTraceWidth="0.1mm"
      defaultTraceWidth="0.1mm"
      minTraceToPadEdgeClearance="0.1mm"
      minViaEdgeToPadEdgeClearance="0.1mm"
      minViaHoleDiameter="0.2mm"
      minViaPadDiameter="0.5mm"
    >
      <breakout name="BGA_BREAKOUT" padding="1.2mm">
        <chip name="U1" footprint={bgaFootprint} pcbX={0} pcbY={0} />

        <DecouplingCap name="C_TOP" pcbX={0} pcbY={4.2} />
        <DecouplingCap name="C_RIGHT" pcbX={4.2} pcbY={0} pcbRotation={90} />
        <DecouplingCap name="C_BOTTOM" pcbX={0} pcbY={-4.2} />
        <DecouplingCap name="C_LEFT" pcbX={-4.2} pcbY={0} pcbRotation={90} />

        <bus name="TOP_POWER" connections={["TOP_VDD", "TOP_GND"]} />
        <bus name="RIGHT_POWER" connections={["RIGHT_VDD", "RIGHT_GND"]} />
        <bus name="BOTTOM_POWER" connections={["BOTTOM_VDD", "BOTTOM_GND"]} />
        <bus name="LEFT_POWER" connections={["LEFT_VDD", "LEFT_GND"]} />

        <trace name="TOP_VDD" from=".U1 > .pin22" to=".C_TOP > .pin1" />
        <trace name="TOP_GND" from=".U1 > .pin28" to=".C_TOP > .pin2" />
        <trace name="RIGHT_VDD" from=".U1 > .pin16" to=".C_RIGHT > .pin1" />
        <trace name="RIGHT_GND" from=".U1 > .pin17" to=".C_RIGHT > .pin2" />
        <trace name="BOTTOM_VDD" from=".U1 > .pin9" to=".C_BOTTOM > .pin1" />
        <trace name="BOTTOM_GND" from=".U1 > .pin15" to=".C_BOTTOM > .pin2" />
        <trace name="LEFT_VDD" from=".U1 > .pin20" to=".C_LEFT > .pin1" />
        <trace name="LEFT_GND" from=".U1 > .pin21" to=".C_LEFT > .pin2" />
      </breakout>

      <pcbnotetext
        pcbX={0}
        pcbY={6.2}
        fontSize={0.45}
        text={`<breakout> default fanout: ${bgaFootprint}`}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const breakoutSourceGroup = circuit.db.source_group.getWhere({
    name: "BGA_BREAKOUT",
  })
  expect(breakoutSourceGroup).toBeDefined()

  const breakoutPhases = autoroutingPhaseIoStack.filter(
    (phase) => phase.subcircuit_id === breakoutSourceGroup?.subcircuit_id,
  )
  expect(breakoutPhases).toHaveLength(2)
  expect(breakoutPhases[0]?.startSimpleRouteJson?.traces ?? []).toHaveLength(0)
  expect(breakoutPhases[0]?.endSimpleRouteJson?.traces).toHaveLength(8)
  expect(breakoutPhases[1]?.startSimpleRouteJson?.traces).toHaveLength(8)
  expect(breakoutPhases[1]?.endSimpleRouteJson?.traces).toHaveLength(16)
  expect(
    breakoutPhases[0]?.endSimpleRouteJson?.traces
      ?.flatMap((trace) => trace.route)
      .filter((routePoint) => routePoint.route_type === "via"),
  ).toHaveLength(8)

  expect(circuit.db.pcb_breakout_point.list()).toHaveLength(0)
  expect(circuit.db.pcb_trace.list()).toHaveLength(16)
  expect(circuit.db.pcb_via.list().length).toBeGreaterThanOrEqual(8)
  expect(circuit.db.pcb_autorouting_error.list()).toEqual([])
  expect(circuit.db.pcb_trace_error.list()).toEqual([])
  expect(circuit.db.pcb_pad_trace_clearance_error.list()).toEqual([])
  expect(circuit.db.pcb_via_clearance_error.list()).toEqual([])

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
  await expect(autoroutingPhaseIoStack).toMatchAutoroutingPhaseIoStackSnapshot(
    import.meta.path,
    "breakout-bga36-decoupling-caps-autorouting-srj",
    circuit,
  )
})
