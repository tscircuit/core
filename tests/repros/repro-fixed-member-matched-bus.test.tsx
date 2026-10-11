import { beforeAll, expect, test } from "bun:test"
import type { PcbTrace } from "circuit-json"
import type { SimpleRouteJson } from "lib/utils/autorouting/SimpleRouteJson"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { LengthTestTerminal } from "tests/fixtures/length-test-terminal"

const { circuit } = getTestFixture()
const phaseInputs: SimpleRouteJson[] = []
const diagnosticMessages: string[] = []

/** Planar wire length in board world coordinates: +X right, +Y up, units mm. */
const getPlanarWireLengthMm = (trace: PcbTrace) =>
  trace.route.reduce((length, point, index) => {
    const previous = trace.route[index - 1]
    if (point.route_type !== "wire" || previous?.route_type !== "wire") {
      return length
    }
    return length + Math.hypot(point.x - previous.x, point.y - previous.y)
  }, 0)

beforeAll(async () => {
  circuit.on("autorouting:start", (event) => {
    phaseInputs.push(event.simpleRouteJson)
  })
  circuit.on("autorouting:error", (event) => {
    diagnosticMessages.push(event.error.message)
  })
  circuit.add(
    <board
      width={34}
      height={30}
      schematicDisabled
      routeRemaining={false}
      layers={2}
    >
      <pcbnotetext
        pcbY={13}
        fontSize={0.7}
        text="DATA: fixed + pending length matching"
      />
      <pcbnotetext
        pcbY={11.5}
        fontSize={0.55}
        text="Requested complete-bus maximum skew: 0.10 mm"
      />
      <pcbnotetext
        pcbY={10}
        fontSize={0.5}
        text="DATA0 has a manual path; DATA1 is pending"
      />
      <pcbnotetext pcbX={-10} pcbY={1.4} fontSize={0.5} text="TX0 / DATA0" />
      <pcbnotetext pcbX={10} pcbY={1.4} fontSize={0.5} text="RX0 / DATA0" />
      <pcbnotetext pcbX={-10} pcbY={-6.6} fontSize={0.5} text="TX1 / DATA1" />
      <pcbnotetext pcbX={10} pcbY={-6.6} fontSize={0.5} text="RX1 / DATA1" />
      <LengthTestTerminal name="TX0" x={-10} y={3} />
      <LengthTestTerminal name="RX0" x={10} y={3} />
      <LengthTestTerminal name="TX1" x={-10} y={-5} />
      <LengthTestTerminal name="RX1" x={10} y={-5} />
      <trace
        name="DATA0"
        from=".TX0 > .pin1"
        to=".RX0 > .pin1"
        routingPhaseIndex={0}
        pcbPathRelativeTo=".TX0 > .pin1"
        pcbPath={[
          { x: 0, y: 0 },
          { x: 0, y: 4 },
          { x: 20, y: 4 },
          { x: 20, y: 0 },
        ]}
      />
      <trace
        name="DATA1"
        from=".TX1 > .pin1"
        to=".RX1 > .pin1"
        routingPhaseIndex={0}
      />
      <bus
        name="DATA"
        connections={["DATA0", "DATA1"]}
        maxLengthSkew={0.1}
        pcbTraceWidth={0.15}
      />
      <autoroutingphase
        name="COMPLETE_DATA"
        phaseIndex={0}
        autorouter="bus_lanes"
      />
    </board>,
  )
  await circuit.renderUntilSettled()

  const addMeasuredNote = (
    text: string,
    y: number,
    fontSize = 0.5,
    color = "white",
  ) => {
    circuit.db.pcb_note_text.insert({
      font: "tscircuit2024",
      font_size: fontSize,
      text,
      anchor_position: { x: 0, y },
      anchor_alignment: "center",
      layer: "top",
      color,
    })
  }
  for (const [name, y] of [
    ["DATA0", 5.2],
    ["DATA1", -3],
  ] as const) {
    const sourceTrace = circuit.db.source_trace
      .list()
      .find((t) => t.name === name)
    const pcbTrace = circuit.db.pcb_trace
      .list()
      .find((t) => t.source_trace_id === sourceTrace?.source_trace_id)
    addMeasuredNote(
      pcbTrace
        ? `${name}: ${getPlanarWireLengthMm(pcbTrace).toFixed(2)} mm emitted copper`
        : `${name}: no emitted copper`,
      y,
      0.6,
    )
  }
  addMeasuredNote(
    `Native routing phases started: ${phaseInputs.length}; source bus members: ${circuit.db.source_bus.list()[0].source_trace_ids.length}`,
    -8,
  )
  const skewError = circuit.db.pcb_bus_length_skew_error.list()[0]
  if (skewError) {
    addMeasuredNote(
      `Native DRC: skew ${skewError.actual_length_skew.toFixed(2)} mm > ${skewError.maximum_length_skew.toFixed(2)} mm allowed`,
      -10,
      0.65,
      "#ff6b6b",
    )
  }
  const routingError = circuit.db.pcb_autorouting_error.list()[0]
  if (routingError) {
    // Display the recorded native diagnostic, wrapping only for readability.
    const words = `Native diagnostic: ${routingError.message}`.split(" ")
    const lines = [""]
    for (const word of words) {
      const last = lines.length - 1
      if (lines[last].length + word.length > 86) lines.push(word)
      else lines[last] += `${lines[last] ? " " : ""}${word}`
    }
    lines.forEach((line, index) =>
      addMeasuredNote(line, -9.5 - index * 1.1, 0.42, "#ffd166"),
    )
  }

  // A visual regression must fail the suite, not satisfy test.failing below.
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})

test.failing("a matched bus cannot silently omit a pre-routed member", () => {
  // Main emits 28 mm and 20 mm copper, then reports 8 mm complete-bus skew.
  // Reject before routing instead of constraining only part of the bus.
  expect(phaseInputs).toHaveLength(0)
  expect(circuit.db.pcb_autorouting_error.list()).toMatchObject([
    { message: expect.stringContaining('pre-routed member "DATA0"') },
  ])
  expect(diagnosticMessages).toEqual([
    circuit.db.pcb_autorouting_error.list()[0].message,
  ])
  expect(diagnosticMessages[0]).not.toContain("source_trace_")
  expect(circuit.db.pcb_trace.list()).toHaveLength(1)
  expect(circuit.db.source_bus.list()[0].source_trace_ids).toHaveLength(2)
})
