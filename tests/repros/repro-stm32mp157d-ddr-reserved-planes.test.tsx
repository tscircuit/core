import { expect, test } from "bun:test"
import { convertCircuitJsonToPcbSvg } from "circuit-to-svg"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import Board from "tests/fixtures/stm32mp157d-reserved-planes/circuit/Board"

// DDR byte 0 data runs between U70 and U71 on inner3. Every signal via from
// the TOP pads crosses the reserved inner1 GND and inner2 power pours.
test("bus_lanes routes STM32MP157D DDR byte 0 across reserved inner planes", async () => {
  const { circuit } = getTestFixture()
  circuit.add(<Board route routingMode="fanout-ddr" />)
  await circuit.renderUntilSettled()
  const json = circuit.getCircuitJson()

  expect(
    json.flatMap((e) =>
      e.type === "pcb_autorouting_error" ? [e.message] : [],
    ),
  ).toEqual([])
  const traces = json.flatMap((e) => (e.type === "pcb_trace" ? [e] : []))
  const netNames = new Map(
    json.flatMap((e) =>
      e.type === "source_net" ? [[e.source_net_id, e.name] as const] : [],
    ),
  )
  const routedNets = traces.map((trace) => {
    const source = json.find(
      (e) =>
        e.type === "source_trace" &&
        e.source_trace_id === trace.source_trace_id,
    )
    return source?.type === "source_trace"
      ? source.connected_source_net_ids.map((id) => netNames.get(id)).join()
      : trace.source_trace_id
  })
  expect(routedNets.sort()).toEqual([
    "DDR_DQ0",
    "DDR_DQ1",
    "DDR_DQ2",
    "DDR_DQ3",
    "DDR_DQ4",
    "DDR_DQ5",
    "DDR_DQ6",
    "DDR_DQ7",
    "DDR_DQM0",
  ])
  // Every other phase is left unrouted in this mode, so their
  // unconnected-port findings remain.
  expect(
    [
      ...new Set(
        json.flatMap((e) => (e.type.endsWith("_error") ? [e.type] : [])),
      ),
    ].sort(),
  ).toEqual([
    "pcb_pad_pad_clearance_error",
    "pcb_port_not_connected_error",
    "pcb_trace_missing_error",
  ])
  // Known follow-up: bus-lanes spaces signal vias by the 0.125 mm
  // trace-to-pad clearance, but this board's 0.15 mm pad-to-pad rule also
  // applies to vias. Four new vias sit 0.125-0.143 mm from BGA pads.
  const viaPadErrors = json.flatMap((e) =>
    e.type === "pcb_pad_pad_clearance_error" ? [e] : [],
  )
  expect(viaPadErrors).toHaveLength(4)
  for (const error of viaPadErrors) {
    expect(error.message).toStartWith("Via unnamed via and pad U7")
    expect(error.minimum_clearance).toBe(0.15)
    expect(error.actual_clearance).toBeGreaterThanOrEqual(0.125 - 1e-6)
    expect(error.actual_clearance).toBeLessThan(0.15)
  }

  const svgOptions = { shouldDrawErrors: false, showErrorsInTextOverlay: false }
  expect(json).toMatchPcbSnapshot(import.meta.path, svgOptions)
  expect(
    convertCircuitJsonToPcbSvg(json, {
      ...svgOptions,
      width: 900,
      height: 1320,
      viewport: { minX: -4, maxX: 22, minY: 10, maxY: 48 },
    }),
  ).toMatchSvgSnapshot(
    import.meta.path,
    "repro-stm32mp157d-ddr-reserved-planes-ddr",
  )
}, 300_000)
