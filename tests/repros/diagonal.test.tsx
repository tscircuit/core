import { expect, test } from "bun:test"
import { segmentToSegmentMinDistance } from "@tscircuit/math-utils"
import type { PcbTrace, PcbTraceRoutePointWire } from "circuit-json"
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
                  { x: -2, y: -2 },
                  { x: 2, y: 2 },
                ].map(
                  (point): PcbTraceRoutePointWire => ({
                    ...point,
                    route_type: "wire",
                    layer: "top",
                    width: 0.4,
                  }),
                )}
              />
            </footprint>
          }
        />
      )}
      <trace from=".R1 > .pin2" to=".R2 > .pin1" />
      <pcbnotetext
        pcbY={4.9}
        fontSize={0.94}
        color="#ffae92"
        text="Repro - R1 to R2 unrouted"
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
        text="Routing stops at the diagonal"
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

/** Minimum edge-to-edge gap (mm) between top-layer wires in board-world XY.
 * Endpoints are positions in a right-handed frame (+X right, +Y up, +Z above).
 */
function gapToFixedCopper(trace: PcbTrace, fixedTrace: PcbTrace) {
  const [start, end] = fixedTrace.route
  if (start?.route_type !== "wire" || end?.route_type !== "wire") {
    throw new Error("Expected two wire endpoints on the fixed trace")
  }
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
  expect(
    failures.some((error) =>
      error.includes("only supports horizontal and vertical"),
    ),
  ).toBe(true)
  expect(traces).toHaveLength(1)
  expect(input).toBeUndefined()
  const fixedTrace = traces[0]!
  expect(fixedTrace.route).toMatchObject([
    { route_type: "wire", layer: "top", width: 0.4, x: -2, y: -2 },
    { route_type: "wire", layer: "top", width: 0.4, x: 2, y: 2 },
  ])
  expect(gapToFixedCopper(control.traces[0]!, fixedTrace)).toBeLessThan(0)
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
