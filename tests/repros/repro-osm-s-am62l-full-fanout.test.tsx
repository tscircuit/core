import { expect, test } from "bun:test"
import { Am62lLinuxComputerModule } from "tests/fixtures/am62l-linux-computer-module"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("OSM-S AM62L signal, ground, and power fanout", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board
      width="110mm"
      height="100mm"
      layers={4}
      defaultTraceWidth="0.15mm"
      minTraceWidth="0.15mm"
      minTraceToPadEdgeClearance="0.1mm"
      minViaEdgeToPadEdgeClearance="0.1mm"
      minViaHoleDiameter="0.2mm"
      minViaPadDiameter="0.45mm"
      autorouterVersion="beta_pipeline9"
    >
      <copperpour layer="inner1" connectsTo="net.GND" clearance="0.15mm" />
      <copperpour layer="inner2" connectsTo="net.VCC_5V" clearance="0.15mm" />
      <pcbnotetext
        text="OSM-S AM62L Linux computer module fanout"
        pcbY={48}
        fontSize="0.8mm"
        anchorAlignment="center"
      />
      <Am62lLinuxComputerModule />
    </board>,
  )
  await circuit.renderUntilSettled()

  expect(circuit.db.pcb_autorouting_error.list()).toEqual([])
  const routedSourceTraceIds = new Set(
    circuit.db.pcb_trace.list().map((trace) => trace.source_trace_id),
  )
  const downstreamPlaneTraceNames = new Set([
    "RESET_BUTTON_GROUND",
    "RECOVERY_BUTTON_GROUND",
  ])
  const unroutedTraceNames = circuit.db.source_trace
    .list()
    .filter(
      (trace) =>
        !downstreamPlaneTraceNames.has(trace.name ?? "") &&
        !routedSourceTraceIds.has(trace.source_trace_id),
    )
    .map((trace) => trace.name)
  expect(unroutedTraceNames).toEqual([])
  expect(circuit.db.pcb_pad_trace_clearance_error.list()).toEqual([])
  expect(circuit.db.pcb_via_clearance_error.list()).toEqual([])
  expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    diffThresholdPercent: 0.15,
  })
}, 60_000)
