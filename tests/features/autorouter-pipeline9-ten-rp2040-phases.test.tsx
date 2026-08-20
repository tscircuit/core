import { expect, test } from "bun:test"
import type { AutorouterVersion } from "lib/utils/autorouting/autorouter-version"
import { createAutoroutingPhaseIoStack } from "tests/fixtures/create-autorouting-phase-io-stack"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const routedRp2040Pins = [
  { pin: "GPIO0", pinNumber: 2, capacitor: "C1", pcbX: -8, pcbY: -4 },
  { pin: "GPIO5", pinNumber: 7, capacitor: "C2", pcbX: -8, pcbY: 0 },
  { pin: "GPIO9", pinNumber: 12, capacitor: "C3", pcbX: -8, pcbY: 4 },
  { pin: "GPIO14", pinNumber: 17, capacitor: "C4", pcbX: 4, pcbY: -6 },
  { pin: "XOUT", pinNumber: 22, capacitor: "C5", pcbX: 0, pcbY: -6 },
  { pin: "GPIO16", pinNumber: 27, capacitor: "C6", pcbX: -4, pcbY: -6 },
  { pin: "GPIO21", pinNumber: 32, capacitor: "C7", pcbX: 8, pcbY: 3 },
  { pin: "GPIO27", pinNumber: 39, capacitor: "C8", pcbX: 8, pcbY: -3 },
  { pin: "VREG_VIN", pinNumber: 44, capacitor: "C9", pcbX: -3, pcbY: 6 },
  { pin: "QSPI_SD3", pinNumber: 51, capacitor: "C10", pcbX: 3, pcbY: 6 },
] as const

const rp2040PinLabels = Object.fromEntries(
  routedRp2040Pins.map(({ pin, pinNumber }) => [`pin${pinNumber}`, pin]),
)

const AutoroutingPhase = ({ phaseIndex }: { phaseIndex: number }) => (
  <autoroutingphase
    phaseIndex={phaseIndex}
    name={`route-rp2040-pin-${phaseIndex + 1}`}
  />
)

const PhasedTrace = ({
  phaseIndex,
  pin,
  capacitor,
}: {
  phaseIndex: number
  pin: string
  capacitor: string
}) => (
  <trace
    name={`PHASE_${phaseIndex}`}
    from={`.U1 > .${pin}`}
    to={`.${capacitor} > .pin1`}
    routingPhaseIndex={phaseIndex}
  />
)

const createRp2040PhasedCircuit = (autorouterVersion: AutorouterVersion) => {
  const { circuit } = getTestFixture()
  const autoroutingPhaseIoStack = createAutoroutingPhaseIoStack(circuit)
  const autoroutingSolverNames: string[] = []
  circuit.on("solver:started", ({ solverName }) => {
    if (solverName.startsWith("AutoroutingPipelineSolver")) {
      autoroutingSolverNames.push(solverName)
    }
  })

  circuit.add(
    <board
      width="22mm"
      height="14mm"
      autorouterVersion={autorouterVersion}
      minTraceWidth="0.15mm"
      defaultTraceWidth="0.15mm"
      minTraceToPadEdgeClearance="0.15mm"
      minViaEdgeToPadEdgeClearance="0.15mm"
      minViaHoleEdgeToViaHoleEdgeClearance="0.15mm"
      minViaHoleDiameter="0.2mm"
      minViaPadDiameter="0.5mm"
    >
      {routedRp2040Pins.map(({ pinNumber }, phaseIndex) => (
        <AutoroutingPhase key={`phase-${pinNumber}`} phaseIndex={phaseIndex} />
      ))}

      <chip
        name="U1"
        footprint="qfn56"
        pinLabels={rp2040PinLabels}
        pcbX={0}
        pcbY={0}
      />

      {routedRp2040Pins.map(({ capacitor, pcbX, pcbY }) => (
        <capacitor
          key={capacitor}
          name={capacitor}
          capacitance="100nF"
          footprint="0402"
          pcbX={pcbX}
          pcbY={pcbY}
        />
      ))}

      {routedRp2040Pins.map(({ pin, pinNumber, capacitor }, phaseIndex) => (
        <PhasedTrace
          key={`trace-${pinNumber}`}
          phaseIndex={phaseIndex}
          pin={pin}
          capacitor={capacitor}
        />
      ))}

      <pcbnotetext
        pcbX={0}
        pcbY={6.5}
        fontSize={0.45}
        text={`${autorouterVersion}: one RP2040 trace per phase`}
      />
    </board>,
  )

  return { circuit, autoroutingPhaseIoStack, autoroutingSolverNames }
}

test("pipeline9 comparison across ten one-trace RP2040 phases", async () => {
  const pipeline7 = createRp2040PhasedCircuit("beta_pipeline7")
  const pipeline9 = createRp2040PhasedCircuit("beta_pipeline9")

  // Run pipeline9 first so shared runtime warm-up cannot favor its timing.
  const pipeline9Start = performance.now()
  await pipeline9.circuit.renderUntilSettled()
  const pipeline9DurationMs = performance.now() - pipeline9Start
  const pipeline7Start = performance.now()
  await pipeline7.circuit.renderUntilSettled()
  const pipeline7DurationMs = performance.now() - pipeline7Start

  console.table({
    pipeline7: {
      durationMs: pipeline7DurationMs.toFixed(2),
      finalPhaseOutputTraces:
        pipeline7.autoroutingPhaseIoStack.at(-1)?.endSimpleRouteJson?.traces
          ?.length ?? 0,
      traces: pipeline7.circuit.db.pcb_trace.list().length,
      vias: pipeline7.circuit.db.pcb_via.list().length,
      traceErrors: pipeline7.circuit.db.pcb_trace_error.list().length,
    },
    pipeline9: {
      durationMs: pipeline9DurationMs.toFixed(2),
      finalPhaseOutputTraces:
        pipeline9.autoroutingPhaseIoStack.at(-1)?.endSimpleRouteJson?.traces
          ?.length ?? 0,
      traces: pipeline9.circuit.db.pcb_trace.list().length,
      vias: pipeline9.circuit.db.pcb_via.list().length,
      traceErrors: pipeline9.circuit.db.pcb_trace_error.list().length,
    },
  })

  expect(pipeline7.autoroutingPhaseIoStack).toHaveLength(10)
  expect(pipeline9.autoroutingPhaseIoStack).toHaveLength(10)
  expect(
    pipeline9.autoroutingPhaseIoStack.map(
      (phase) => phase.startSimpleRouteJson?.connections.length,
    ),
  ).toEqual(Array(10).fill(1))
  expect(
    pipeline9.autoroutingPhaseIoStack.map(
      (phase) => phase.startSimpleRouteJson?.traces?.length ?? 0,
    ),
  ).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])
  expect(
    pipeline9.autoroutingPhaseIoStack.map(
      (phase) => phase.endSimpleRouteJson?.traces?.length ?? 0,
    ),
  ).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])

  expect(pipeline7.autoroutingSolverNames).toEqual(
    Array(10).fill("AutoroutingPipelineSolver7_MultiGraph"),
  )
  expect(pipeline9.autoroutingSolverNames).toEqual(
    Array(10).fill("AutoroutingPipelineSolver9_PreloadedTraceGraph"),
  )
  expect(pipeline7.circuit.db.pcb_trace.list()).toHaveLength(10)
  expect(pipeline7.circuit.db.pcb_autorouting_error.list()).toEqual([])
  expect(pipeline7.circuit.db.pcb_trace_error.list()).toEqual([])
  expect(pipeline9.circuit.db.pcb_trace.list()).toHaveLength(10)
  expect(pipeline9.circuit.db.pcb_autorouting_error.list()).toEqual([])
  expect(pipeline9.circuit.db.pcb_trace_error.list()).toEqual([])

  await expect(
    pipeline9.autoroutingPhaseIoStack,
  ).toMatchAutoroutingPhaseIoStackSnapshot(
    import.meta.path,
    "autorouter-pipeline9-ten-rp2040-phases",
    pipeline9.circuit,
    { diffThresholdPercent: 2 },
  )
}, 60_000)
