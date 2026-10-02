import { expect, test } from "bun:test"
import { categorizeErrorOrWarning } from "@tscircuit/circuit-json-util"
import { createAutoroutingPhaseIoStack } from "tests/fixtures/create-autorouting-phase-io-stack"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("repro: an explicit minimum trace width is silently reduced alongside an obstacle", async () => {
  const { circuit } = getTestFixture()
  const phases = createAutoroutingPhaseIoStack(circuit)
  const requestedMinimumWidth = 0.3
  const widthTolerance = 1e-6
  circuit.add(
    <board
      width={30}
      height={10}
      layers={2}
      minTraceWidth={0.15}
      defaultTraceWidth={0.2}
      minTraceToPadEdgeClearance={0.1}
      minBoardEdgeClearance={0.15}
      autorouter={{ local: true, traceClearance: 0.1 }}
    >
      <chip
        name="U1"
        pcbX={-12}
        footprint={
          <footprint>
            <smtpad portHints={["pin1"]} shape="rect" width={1} height={1} />
          </footprint>
        }
      />
      <chip
        name="U2"
        pcbX={12}
        footprint={
          <footprint>
            <smtpad portHints={["pin1"]} shape="rect" width={1} height={1} />
          </footprint>
        }
      />
      <chip
        name="U3"
        pcbY={0}
        footprint={
          <footprint>
            <smtpad portHints={["pin1"]} shape="rect" width={16} height={2} />
            <smtpad
              portHints={["pin1"]}
              shape="rect"
              width={16}
              height={2}
              layer="bottom"
            />
          </footprint>
        }
      />
      <trace
        name="POWER"
        from=".U1 > .pin1"
        to=".U2 > .pin1"
        thickness={requestedMinimumWidth}
      />
      <pcbnotetext
        pcbY={-3}
        fontSize={0.6}
        text="POWER: 0.30 mm requested; 0.2125 mm minimum routed"
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  const sourceTrace = circuit.db.source_trace.list()[0]
  expect(sourceTrace.min_trace_thickness).toBe(requestedMinimumWidth)
  expect(phases).toHaveLength(1)
  const routerInput = phases[0].startSimpleRouteJson!
  expect(routerInput.minTraceWidth).toBe(0.15)
  expect(routerInput.connections).toHaveLength(1)
  expect(routerInput.connections[0].nominalTraceWidth).toBe(
    requestedMinimumWidth,
  )

  expect(circuit.db.pcb_trace.list()).toHaveLength(1)
  const pcbTrace = circuit.db.pcb_trace.list()[0]
  expect(pcbTrace.source_trace_id).toBe(sourceTrace.source_trace_id)
  const wirePoints = pcbTrace.route.filter(
    (point) => point.route_type === "wire",
  )
  expect(Math.min(...wirePoints.map((point) => point.width))).toBeCloseTo(
    0.2125,
    4,
  )

  let lengthBelowRequestedMinimum = 0
  for (
    let segmentIndex = 0;
    segmentIndex < pcbTrace.route.length - 1;
    segmentIndex++
  ) {
    const start = pcbTrace.route[segmentIndex]
    const end = pcbTrace.route[segmentIndex + 1]
    if (start.route_type !== "wire" || end.route_type !== "wire") continue
    if (start.layer !== end.layer) continue
    if (start.width >= requestedMinimumWidth - widthTolerance) continue
    lengthBelowRequestedMinimum += Math.hypot(end.x - start.x, end.y - start.y)
  }
  // About 17 mm is narrowed, far beyond the two 1 mm endpoint pads.
  expect(lengthBelowRequestedMinimum).toBeCloseTo(17.0539, 3)
  expect(
    circuit.getCircuitJson().filter((element) => "error_type" in element),
  ).toEqual([])
  expect(
    circuit
      .getCircuitJson()
      .filter(
        (element) =>
          "warning_type" in element &&
          categorizeErrorOrWarning(element) === "routing",
      ),
  ).toEqual([])
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
