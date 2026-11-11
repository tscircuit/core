import { expect, test } from "bun:test"
import { segmentToSegmentMinDistance } from "@tscircuit/math-utils"
import type { PcbTrace, PcbTraceRoutePoint } from "circuit-json"
import { createAutoroutingPhaseIoStack } from "tests/fixtures/create-autorouting-phase-io-stack"
import { renderRoutingObstacleComparison } from "tests/fixtures/render-routing-obstacle-comparison"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const fixedRoute = [
  { route_type: "wire", layer: "top", width: 0.4, x: -2, y: -2 },
  { route_type: "wire", layer: "top", width: 0.4, x: 2, y: 2 },
] satisfies PcbTraceRoutePoint[]

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
              <pcbtrace route={fixedRoute} />
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
        text="Thin trace goes around the copper"
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

// Minimum edge-to-edge gap to the frozen trace, on its copper layer.
function gapToFixedCopper(trace: PcbTrace) {
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
    const distance = segmentToSegmentMinDistance(
      a,
      b,
      fixedRoute[0]!,
      fixedRoute[1]!,
    )
    gap = Math.min(gap, distance - (a.width + fixedRoute[0]!.width) / 2)
  }
  return gap
}

test("route R1 to R2 past a frozen top-layer diagonal", async () => {
  const control = await routeBetweenResistors(false)
  expect(control.failures).toEqual([])
  expect(control.traces).toHaveLength(1)
  expect(gapToFixedCopper(control.traces[0]!)).toBeLessThan(0)

  const { circuit, failures, input, traces } = await routeBetweenResistors(true)
  expect(failures).toEqual([])
  expect(traces).toHaveLength(2)
  const fixedTrace = traces.find((trace) => !trace.source_trace_id)!
  const newTrace = traces.find((trace) => trace.source_trace_id)!
  expect(fixedTrace.route).toMatchObject(fixedRoute)
  const gap = gapToFixedCopper(newTrace)
  expect(Number.isFinite(gap)).toBe(true)
  expect(gap).toBeGreaterThan(0)
  expect(input).toBeDefined()
  const fixedObstacles = input!.obstacles.filter((obstacle) =>
    obstacle.connectedTo.includes(fixedTrace.pcb_trace_id),
  )
  expect(fixedObstacles).toHaveLength(1)
  const [segment] = fixedObstacles
  expect(segment!.ccwRotationDegrees).toBeCloseTo(45)
  expect(segment!.width).toBeCloseTo(Math.hypot(4, 4) + 0.4)
  expect(segment!.height).toBeCloseTo(0.4)
  expect(segment).toMatchObject({ center: { x: 0, y: 0 }, layers: ["top"] })
  expect(control.input).toBeDefined()
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
