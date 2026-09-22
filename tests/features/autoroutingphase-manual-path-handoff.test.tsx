import { expect, test } from "bun:test"
import type { SimplifiedPcbTrace } from "lib/utils/autorouting/SimpleRouteJson"
import { createBasicAutorouter } from "tests/fixtures/createBasicAutorouter"
import { getPcbTraceRouteGeometry } from "tests/fixtures/get-pcb-trace-route-geometry"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("autorouting phases pass solver output forward without restoring manual geometry", async () => {
  const { circuit } = getTestFixture()
  let firstPhaseOutput: SimplifiedPcbTrace[] = []
  let phaseCount = 0
  const routePhase = createBasicAutorouter(async (srj) => {
    if (phaseCount++ === 0) {
      expect(srj.traces).toHaveLength(1)
      const manualTrace = srj.traces![0]!
      expect(
        manualTrace.route.some(
          (point) => point.route_type === "wire" && point.y < 0,
        ),
      ).toBe(true)
      // Simulate a solver straightening the manual U; core must carry this
      // output into the next phase instead of restoring the input geometry.
      firstPhaseOutput = [
        {
          ...manualTrace,
          route: [manualTrace.route[0]!, manualTrace.route.at(-1)!],
        },
      ]
    } else {
      expect(srj.traces).toEqual(firstPhaseOutput)
    }
    expect(
      srj.obstacles.filter(
        (obstacle) =>
          obstacle.type === "rect" &&
          srj.traces?.some((trace) =>
            obstacle.connectedTo.includes(trace.pcb_trace_id),
          ),
      ),
    ).toEqual([])
    const routedConnections = srj.connections.map((connection) => ({
      type: "pcb_trace" as const,
      pcb_trace_id: `${connection.name}_routed`,
      connection_name: connection.name,
      route: connection.pointsToConnect.map(({ x, y, layer }) => ({
        route_type: "wire" as const,
        x,
        y,
        layer,
        width: 0.2,
      })),
    }))
    const phaseOutput = [...firstPhaseOutput, ...routedConnections]
    if (phaseCount === 1) firstPhaseOutput = structuredClone(phaseOutput)
    return phaseOutput
  })
  circuit.add(
    <board
      width={18}
      height={16}
      layers={1}
      autorouter={{ algorithmFn: routePhase }}
    >
      <pcbnotetext
        pcbY={6.5}
        fontSize={0.55}
        text="Phase 2 receives the solver's straightened manual path"
      />
      <testpoint name="M1" pcbX={-2} pcbY={3} padDiameter={0.7} />
      <testpoint name="M2" pcbX={2} pcbY={3} padDiameter={0.7} />
      <trace
        from="M1.pin1"
        to="M2.pin1"
        thickness={0.3}
        pcbPath={[
          { x: 0, y: -6 },
          { x: 4, y: -6 },
        ]}
      />
      <testpoint name="LEFT1" pcbX={-6} pcbY={1.5} padDiameter={0.7} />
      <testpoint name="RIGHT1" pcbX={6} pcbY={1.5} padDiameter={0.7} />
      <testpoint name="LEFT2" pcbX={-6} pcbY={-1.5} padDiameter={0.7} />
      <testpoint name="RIGHT2" pcbX={6} pcbY={-1.5} padDiameter={0.7} />
      <autoroutingphase phaseIndex={0} connection="LEFT1.pin1" />
      <trace from="LEFT1.pin1" to="RIGHT1.pin1" />
      <trace from="LEFT2.pin1" to="RIGHT2.pin1" />
    </board>,
  )
  await circuit.renderUntilSettled()
  expect(circuit.db.pcb_autorouting_error.list()).toEqual([])
  expect(circuit.db.pcb_trace_error.list()).toEqual([])
  expect(phaseCount).toBe(2)
  const emittedManualTrace = circuit.db.pcb_trace.get(
    firstPhaseOutput[0]!.pcb_trace_id,
  )!
  expect(getPcbTraceRouteGeometry(emittedManualTrace)).toEqual(
    getPcbTraceRouteGeometry(firstPhaseOutput[0]!),
  )
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
