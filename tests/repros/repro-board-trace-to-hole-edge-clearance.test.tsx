import { expect, test } from "bun:test"
import { pointToSegmentDistance } from "@tscircuit/math-utils"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test.failing("board routes honor 0.2mm NPTH clearance", async () => {
  const { circuit } = getTestFixture()
  const clearance = 0.2
  circuit.add(
    <board
      width={10}
      height={7}
      minTraceWidth={0.1}
      defaultTraceWidth={0.1}
      minTraceToPadEdgeClearance={0.1}
      minTraceToHoleEdgeClearance={clearance}
      autorouter={{ local: true, groupMode: "subcircuit" }}
      autorouterVersion="beta_pipeline9"
    >
      <testpoint name="LEFT" footprintVariant="pad" pcbX={-3} pcbY={1.15} />
      <testpoint name="RIGHT" footprintVariant="pad" pcbX={3} pcbY={1.15} />
      <hole name="MOUNT" diameter={2} pcbX={0} pcbY={0} />
      <trace from=".LEFT > .pin1" to=".RIGHT > .pin1" />
      <pcbnotetext
        text="Trace to NPTH edge: 0.2 mm minimum"
        pcbY={-2}
        fontSize={0.35}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  const hole = circuit.db.pcb_hole.list()[0]!
  if (hole.hole_shape !== "circle") throw new Error("Expected circular hole")
  const traces = circuit.db.pcb_trace.list()
  expect(traces.length).toBeGreaterThan(0)

  // Measure emitted copper in board XY coordinates (mm), including half-width.
  const gaps: number[] = []
  for (const trace of traces) {
    for (let i = 1; i < trace.route.length; i++) {
      const start = trace.route[i - 1]!
      const end = trace.route[i]!
      if (start.route_type !== "wire" || end.route_type !== "wire") continue
      if (start.layer !== end.layer) continue
      gaps.push(
        pointToSegmentDistance(hole, start, end) -
          hole.hole_diameter / 2 -
          Math.max(start.width, end.width) / 2,
      )
    }
  }
  expect(gaps.length).toBeGreaterThan(0)
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
  expect(Math.min(...gaps)).toBeGreaterThanOrEqual(clearance - 1e-6)
  expect(circuit.db.pcb_trace_error.list()).toEqual([])
  expect(circuit.db.pcb_port_not_connected_error.list()).toEqual([])
})
