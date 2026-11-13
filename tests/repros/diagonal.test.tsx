import { expect, test } from "bun:test"
import { segmentToSegmentMinDistance } from "@tscircuit/math-utils"
import type { PcbTrace } from "circuit-json"
import { createAutoroutingPhaseIoStack } from "tests/fixtures/create-autorouting-phase-io-stack"
import { renderRoutingObstacleComparison } from "tests/fixtures/render-routing-obstacle-comparison"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

async function routeBetweenResistors(withFixedCopper: boolean) {
  const { circuit } = getTestFixture()
  const phases = createAutoroutingPhaseIoStack(circuit)
  const failures: string[] = []
  circuit.on("asyncEffect:end", (event) => {
    if (event.error) failures.push(String(event.error))
  })
  circuit.add(
    <board width={20} height={12} schematicDisabled autorouter="auto_local">
      <resistor name="R1" resistance={100} footprint="0402" pcbX={-5} />
      <resistor name="R2" resistance={100} footprint="0402" pcbX={5} />
      {withFixedCopper && (
        <chip
          name="FIXED"
          footprint={
            <footprint>
              <pcbtrace
                route={[
                  {
                    route_type: "wire",
                    layer: "top",
                    width: 0.4,
                    x: -2,
                    y: -2,
                  },
                  { route_type: "wire", layer: "top", width: 0.4, x: 2, y: 2 },
                ]}
              />
            </footprint>
          }
        />
      )}
      <trace from=".R1 > .pin2" to=".R2 > .pin1" />
      <pcbnotetext
        pcbY={4.9}
        fontSize={0.94}
        color="#8de2b3"
        text="Fix - R1 to R2 connected"
      />
      <pcbnotetext
        pcbY={-3.45}
        fontSize={0.76}
        color="#f2f4f7"
        text="Thick diagonal = existing copper"
      />
      <pcbnotetext
        pcbY={-4.85}
        fontSize={0.73}
        color="#c5d4e2"
        text="R1 to R2 passes under the diagonal"
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  return {
    circuit,
    failures,
    input: phases[0]?.startSimpleRouteJson,
    traces: circuit.db.pcb_trace.list(),
  }
}

// Board-world XY points in mm (+X right, +Y up). Measure the gap between copper edges.
function gapToFixedCopper(trace: PcbTrace, fixed: PcbTrace) {
  const [start, end] = fixed.route
  if (start?.route_type !== "wire" || end?.route_type !== "wire")
    throw new Error("Expected two wire endpoints on the fixed trace")
  let gap = Infinity
  for (let i = 1; i < trace.route.length; i++) {
    const a = trace.route[i - 1]!
    const b = trace.route[i]!
    if (
      a.route_type !== "wire" ||
      b.route_type !== "wire" ||
      a.layer !== "top" ||
      b.layer !== "top"
    )
      continue
    const distance = segmentToSegmentMinDistance(a, b, start, end)
    gap = Math.min(gap, distance - (a.width + start.width) / 2)
  }
  return gap
}

test("route R1 to R2 past a frozen top-layer diagonal", async () => {
  const control = await routeBetweenResistors(false)
  expect(control.failures).toEqual([])
  expect(control.traces).toHaveLength(1)

  const { circuit, failures, input, traces } = await routeBetweenResistors(true)
  expect(failures).toEqual([])
  expect(traces).toHaveLength(2)
  const fixedTrace = traces.find((trace) => !trace.source_trace_id)!
  const newTrace = traces.find((trace) => trace.source_trace_id)!
  expect(fixedTrace.route).toMatchObject([
    { route_type: "wire", layer: "top", width: 0.4, x: -2, y: -2 },
    { route_type: "wire", layer: "top", width: 0.4, x: 2, y: 2 },
  ])
  expect(gapToFixedCopper(control.traces[0]!, fixedTrace)).toBeLessThan(0)
  const gap = gapToFixedCopper(newTrace, fixedTrace)
  expect(Number.isFinite(gap)).toBe(true)
  expect(gap).toBeGreaterThan(0)
  expect(input).toBeDefined()
  expect(control.input).toBeDefined()
  expect(input!.traces).toMatchObject([
    {
      pcb_trace_id: fixedTrace.pcb_trace_id,
      isFixed: true,
      route: [
        { route_type: "wire", layer: "top", width: 0.4, x: -2, y: -2 },
        { route_type: "wire", layer: "top", width: 0.4, x: 2, y: 2 },
      ],
    },
  ])
  expect(input!.obstacles).toEqual(control.input!.obstacles)
  const endpoints = [newTrace.route[0], newTrace.route.at(-1)]
  expect(input!.connections).toHaveLength(1)
  for (const pad of input!.connections[0]!.pointsToConnect) {
    expect(endpoints).toContainEqual(
      expect.objectContaining({ route_type: "wire", x: pad.x, y: pad.y }),
    )
  }
  await expect(
    renderRoutingObstacleComparison(
      control.input!,
      input,
      fixedTrace.pcb_trace_id,
    ),
  ).toMatchSvgSnapshot(import.meta.path, "diagonal-router-obstacles", {
    diffThresholdPercent: 0,
  })
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
