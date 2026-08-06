import { expect, test } from "bun:test"
import type { SourceSimpleCapacitor } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const expectedMaxDecouplingTraceLength = 1
const expectedTraceTooLongWarningCount = 1

interface ReproStatusNotesProps {
  observedMaxLength?: number | "none" | "not measured"
  observedTraceTooLongWarningCount?: number | "not measured"
}

const ReproStatusNotes = ({
  observedMaxLength = "not measured",
  observedTraceTooLongWarningCount = "not measured",
}: ReproStatusNotesProps) => (
  <>
    <pcbnotetext
      pcbY={-7}
      fontSize={0.65}
      text="Automatic decoupling detection repro"
    />
    <pcbnotetext
      pcbY={-8}
      fontSize={0.65}
      text={`Expected max: ${expectedMaxDecouplingTraceLength}mm; observed: ${observedMaxLength}`}
    />
    <pcbnotetext
      pcbY={-9}
      fontSize={0.65}
      text={`Expected pcb_trace_too_long_warning count: ${expectedTraceTooLongWarningCount}; observed: ${observedTraceTooLongWarningCount}`}
    />
  </>
)

const createReproBoard = (observations: ReproStatusNotesProps = {}) => (
  <board width="24mm" height="20mm">
    <chip
      name="U1"
      footprint="soic8"
      pcbX={3}
      pinLabels={{
        pin1: "VCC",
        pin4: "GND",
      }}
    />
    <capacitor
      name="C1"
      capacitance="100nF"
      footprint="0402"
      pcbX={-3}
      connections={{ pin1: "U1.VCC", pin2: "net.GND" }}
    />
    <trace from=".U1 > .GND" to="net.GND" />
    <ReproStatusNotes {...observations} />
  </board>
)

test("capacitor connections to chip VCC and ground should infer 1mm traces and emit a pcb_trace_too_long_warning for an over-length route", async () => {
  const { circuit } = getTestFixture()
  circuit.add(createReproBoard())

  await circuit.renderUntilSettled()

  const capacitor = circuit.db.source_component
    .list()
    .find(
      (component): component is SourceSimpleCapacitor =>
        component.ftype === "simple_capacitor" && component.name === "C1",
    )
  const capacitorPortIds = new Set(
    circuit.db.source_port
      .list()
      .filter(
        (port) => port.source_component_id === capacitor?.source_component_id,
      )
      .map((port) => port.source_port_id),
  )
  const capacitorTraces = circuit.db.source_trace
    .list()
    .filter((trace) =>
      trace.connected_source_port_ids.some((portId) =>
        capacitorPortIds.has(portId),
      ),
    )
  const chip = circuit.db.source_component
    .list()
    .find((component) => component.name === "U1")
  const chipPowerPortId = circuit.db.source_port
    .list()
    .find(
      (port) =>
        port.source_component_id === chip?.source_component_id &&
        port.name === "VCC",
    )?.source_port_id
  const capacitorPowerTrace = capacitorTraces.find(
    (trace) =>
      chipPowerPortId !== undefined &&
      trace.connected_source_port_ids.includes(chipPowerPortId),
  )
  const traceTooLongWarnings =
    circuit.db.pcb_trace_too_long_warning?.list() ?? []
  const observedMaxLength = capacitor?.max_decoupling_trace_length ?? "none"

  const { circuit: snapshotCircuit } = getTestFixture()
  snapshotCircuit.add(
    createReproBoard({
      observedMaxLength,
      observedTraceTooLongWarningCount: traceTooLongWarnings.length,
    }),
  )
  await snapshotCircuit.renderUntilSettled()

  expect(snapshotCircuit).toMatchPcbSnapshot(import.meta.path, {
    shouldDrawErrors: true,
  })
  expect(capacitor?.max_decoupling_trace_length).toBe(
    expectedMaxDecouplingTraceLength,
  )
  expect(capacitorPowerTrace?.max_length).toBe(expectedMaxDecouplingTraceLength)
  expect(
    capacitorTraces
      .filter((trace) => trace !== capacitorPowerTrace)
      .every((trace) => trace.max_length === undefined),
  ).toBe(true)
  expect(traceTooLongWarnings).toHaveLength(expectedTraceTooLongWarningCount)
  expect(traceTooLongWarnings[0]?.maximum_trace_length).toBe(
    expectedMaxDecouplingTraceLength,
  )
  expect(traceTooLongWarnings[0]?.actual_trace_length).toBeGreaterThan(
    expectedMaxDecouplingTraceLength,
  )
})
