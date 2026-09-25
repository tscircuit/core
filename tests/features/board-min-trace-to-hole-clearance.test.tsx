import { expect, test } from "bun:test"
import { AutoroutingPipelineSolver } from "@tscircuit/capacity-autorouter"
import { pointToSegmentDistance } from "@tscircuit/math-utils"
import type { SimpleRouteJson } from "lib/utils/autorouting/SimpleRouteJson"
import { createBasicAutorouter } from "tests/fixtures/createBasicAutorouter"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("board hole clearance reaches the router and produces fresh routes clear of physical NPTHs", async () => {
  const geometries: string[] = []
  for (const clearance of [0, 0.2]) {
    const { circuit } = getTestFixture()
    const inputs: SimpleRouteJson[] = []
    circuit.add(
      <board
        width={16}
        height={10}
        minTraceWidth={0.15}
        minTraceToPadEdgeClearance={0.1}
        minTraceToHoleEdgeClearance={`${clearance}mm`}
        autorouter={{
          local: true,
          algorithmFn: createBasicAutorouter(async (srj) => {
            inputs.push(structuredClone(srj))
            const solver = new AutoroutingPipelineSolver(
              { ...srj, traces: [] },
              { cacheProvider: null },
            )
            solver.solve()
            if (!solver.solved)
              throw new Error(solver.error ?? "Routing failed")
            return solver.getOutputSimplifiedPcbTraces()
          }),
        }}
      >
        {[-5, 5].map((x, index) => (
          <chip
            key={x}
            name={`U${index + 1}`}
            pcbX={x}
            pinLabels={{ pin1: "SIGNAL" }}
            footprint={
              <footprint>
                <smtpad
                  portHints={["pin1"]}
                  shape="rect"
                  width={0.8}
                  height={0.8}
                />
              </footprint>
            }
          />
        ))}
        <pcbnotetext
          text={`Trace to hole: ${clearance} mm minimum`}
          pcbY={3}
          fontSize={0.45}
        />
        <hole name="mount" diameter={2} pcbX={0} pcbY={0} />
        <trace from=".U1 > .pin1" to=".U2 > .pin1" />
      </board>,
    )
    await circuit.renderUntilSettled()
    expect(inputs.length).toBeGreaterThan(0)
    expect(inputs[0]!.minTraceToHoleEdgeClearance).toBe(clearance)
    const hole = circuit.db.pcb_hole.list()[0]!
    expect(hole.hole_shape).toBe("circle")
    if (hole.hole_shape !== "circle") throw new Error("Expected circular hole")
    expect(hole.hole_diameter).toBe(2)
    expect(inputs[0]!.obstacles.find((o) => o.isHole)).toMatchObject({
      obstacleId: hole.pcb_hole_id,
      shape: "circle",
      width: 2,
      height: 2,
      connectedTo: [],
      layers: ["top", "bottom"],
    })
    const traces = circuit.db.pcb_trace.list()
    expect(traces.length).toBeGreaterThan(0)
    let minimum = Infinity
    for (const trace of traces) {
      for (let index = 1; index < trace.route.length; index++) {
        const a = trace.route[index - 1]!
        const b = trace.route[index]!
        if (
          a.route_type !== "wire" ||
          b.route_type !== "wire" ||
          a.layer !== b.layer
        )
          continue
        minimum = Math.min(
          minimum,
          pointToSegmentDistance(hole, a, b) -
            hole.hole_diameter / 2 -
            Math.max(a.width, b.width) / 2,
        )
      }
    }
    expect(Number.isFinite(minimum)).toBe(true)
    expect(minimum).toBeGreaterThanOrEqual(clearance - 1e-6)
    if (clearance === 0) expect(minimum).toBeLessThan(0.2)
    geometries.push(JSON.stringify(traces))
    if (clearance === 0.2) expect(circuit).toMatchPcbSnapshot(import.meta.path)
  }
  expect(geometries[0]).not.toBe(geometries[1])
})
