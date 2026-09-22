import { expect, test } from "bun:test"
import type { PcbTrace } from "circuit-json"
import { createBasicAutorouter } from "tests/fixtures/createBasicAutorouter"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("simplification treats fixed U-shaped copper as immutable collision geometry", async () => {
  const { circuit } = getTestFixture()
  let originalManualTrace: PcbTrace | undefined
  circuit.on("autorouting:start", () => {
    originalManualTrace ??= structuredClone(circuit.db.pcb_trace.list()[0]!)
  })
  const detourAroundManualCopper = createBasicAutorouter(async (srj) =>
    srj.connections.map((connection) => ({
      type: "pcb_trace" as const,
      pcb_trace_id: "signal_detour",
      connection_name: connection.name,
      route: [
        connection.pointsToConnect[0],
        { x: -3, y: -4 },
        { x: 3, y: -4 },
        connection.pointsToConnect[1],
      ].map(({ x, y }) => ({
        route_type: "wire" as const,
        x,
        y,
        width: 0.3,
        layer: "top",
      })),
    })),
  )
  circuit.add(
    <board
      width={18}
      height={16}
      layers={1}
      autorouter={{ algorithmFn: detourAroundManualCopper }}
    >
      <pcbnotetext
        pcbY={6}
        text="Simplify signal below the fixed U"
        fontSize={0.6}
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
      <testpoint name="LEFT" pcbX={-6} pcbY={0} padDiameter={0.7} />
      <testpoint name="RIGHT" pcbX={6} pcbY={0} padDiameter={0.7} />
      <trace from="LEFT.pin1" to="RIGHT.pin1" thickness={0.3} />
      <autoroutingphase reroute autorouter="simplify" />
    </board>,
  )
  await circuit.renderUntilSettled()
  expect(circuit.db.pcb_autorouting_error.list()).toEqual([])
  const manualTrace = circuit.db.pcb_trace.get(
    originalManualTrace!.pcb_trace_id,
  )!
  expect(manualTrace.route).toEqual(originalManualTrace!.route)
  const signalTraces = circuit.db.pcb_trace
    .list()
    .filter(
      (trace) => trace.source_trace_id !== originalManualTrace!.source_trace_id,
    )
  expect(signalTraces).toHaveLength(1)
  // Restoring a U after simplifying both routes used to leave a straight signal
  // crossing its vertical walls at x = ±2, y = 0.
  expect(
    signalTraces[0].route.some(
      (point) => point.route_type === "wire" && point.y < -3,
    ),
  ).toBe(true)
  expect(circuit.db.pcb_trace_error.list()).toEqual([])
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
