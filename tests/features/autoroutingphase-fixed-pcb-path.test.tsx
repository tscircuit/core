import { expect, test } from "bun:test"
import type { PcbTrace } from "circuit-json"
import type { SimpleRouteJson } from "lib/utils/autorouting/SimpleRouteJson"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("autorouting phases detour around a preloaded hand-authored pcbPath", async () => {
  const { circuit } = getTestFixture()
  const phaseInputs: SimpleRouteJson[] = []
  let originalManualTrace: PcbTrace | undefined
  circuit.on("autorouting:start", (event) => {
    originalManualTrace ??= structuredClone(circuit.db.pcb_trace.list()[0]!)
    phaseInputs.push(event.simpleRouteJson)
  })
  circuit.add(
    <board width={18} height={16} layers={1} autorouter="beta-pipeline9">
      <pcbnotetext
        pcbY={6.5}
        fontSize={0.55}
        text="Preload the manual U-shaped pcbPath in Pipeline9"
      />
      <pcbnotetext
        pcbY={5.4}
        fontSize={0.4}
        text="Thin left-to-right routes detour around preloaded copper"
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
  expect(phaseInputs).toHaveLength(2)
  expect(originalManualTrace).toBeDefined()
  for (const input of phaseInputs) {
    expect(
      input.traces?.some(
        (trace) =>
          trace.connection_name === originalManualTrace!.source_trace_id,
      ),
    ).toBe(true)
    expect(
      input.obstacles.some(
        (obstacle) =>
          obstacle.connectedTo[0] === originalManualTrace!.source_trace_id,
      ),
    ).toBe(false)
  }
  // Preserve the exact authored input; Pipeline9 owns any subsequent repair
  // of preloaded routes and checks new copper against the resulting geometry.
  expect(phaseInputs[0]!.traces![0]!.route).toEqual(
    originalManualTrace!.route
      .filter((point) => point.route_type === "wire")
      .map((point) => {
        const { start_pcb_port_id, end_pcb_port_id, ...wirePoint } = point
        return wirePoint
      }),
  )
  const traces = circuit.db.pcb_trace.list()
  const manualTraces = traces.filter(
    (trace) => trace.source_trace_id === originalManualTrace!.source_trace_id,
  )
  expect(manualTraces).toHaveLength(1)
  expect(manualTraces[0]!.route[0]).toEqual(originalManualTrace!.route[0])
  expect(manualTraces[0]!.route.at(-1)).toEqual(
    originalManualTrace!.route.at(-1),
  )
  expect(
    manualTraces[0]!.route.some(
      (point) => point.route_type === "wire" && point.y < -2.9,
    ),
  ).toBe(true)
  expect(traces).toHaveLength(3)
  for (const trace of traces.filter(
    (trace) => trace.source_trace_id !== originalManualTrace!.source_trace_id,
  )) {
    // On a single-layer board, neither automatic route can jump over the U.
    // Both must leave its vertical span instead of shortening the manual path.
    expect(trace.route.some((point) => point.route_type === "via")).toBe(false)
    expect(
      trace.route.some(
        (point) => point.route_type === "wire" && Math.abs(point.y) > 3,
      ),
    ).toBe(true)
  }
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
