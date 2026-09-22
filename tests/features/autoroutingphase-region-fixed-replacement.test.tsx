import { expect, test } from "bun:test"
import type { PcbTrace } from "circuit-json"
import { createBasicAutorouter } from "tests/fixtures/createBasicAutorouter"
import { getPcbTraceRouteGeometry } from "tests/fixtures/get-pcb-trace-route-geometry"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("region rerouting preserves whole manual paths and discards replacement IDs", async () => {
  const { circuit } = getTestFixture()
  let originalManualTrace: PcbTrace | undefined
  let checkedRegionInput = false
  circuit.on("autorouting:start", () => {
    originalManualTrace ??= structuredClone(circuit.db.pcb_trace.list()[0]!)
  })
  const routeConnections = createBasicAutorouter(async (srj) =>
    srj.connections.map((connection) => ({
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
    })),
  )
  const rerouteRegion = createBasicAutorouter(async (srj) => {
    checkedRegionInput = true
    const fixedTrace = srj.traces?.find(
      (trace) => trace.pcb_trace_id === originalManualTrace!.pcb_trace_id,
    )
    expect(fixedTrace).toBeDefined()
    expect(getPcbTraceRouteGeometry(fixedTrace!)).toEqual(
      getPcbTraceRouteGeometry(originalManualTrace!),
    )
    expect(
      srj.connections.some((connection) =>
        connection.name.startsWith(
          `${originalManualTrace!.source_trace_id}_reroute_`,
        ),
      ),
    ).toBe(false)
    return [
      {
        ...fixedTrace!,
        pcb_trace_id: "replacement_manual",
        __replaces_pcb_trace_id: fixedTrace!.pcb_trace_id,
        route: [],
      },
      ...srj.connections.map((connection) => ({
        type: "pcb_trace" as const,
        pcb_trace_id: `${connection.name}_rerouted`,
        connection_name: connection.name,
        route: connection.pointsToConnect.map(({ x, y, layer }) => ({
          route_type: "wire" as const,
          x,
          y,
          layer,
          width: 0.2,
        })),
      })),
    ]
  })
  circuit.add(
    <board
      width={18}
      height={12}
      autorouter={{ algorithmFn: routeConnections }}
    >
      <pcbnotetext
        pcbY={5}
        text="Region preserves the manual upper bend"
        fontSize={0.55}
      />
      <testpoint name="M1" pcbX={-6} pcbY={2} />
      <testpoint name="M2" pcbX={6} pcbY={2} />
      <trace
        from="M1.pin1"
        to="M2.pin1"
        pcbPath={[
          { x: 4, y: 1 },
          { x: 8, y: 1 },
        ]}
      />
      <testpoint name="LEFT" pcbX={-6} pcbY={-2} />
      <testpoint name="RIGHT" pcbX={6} pcbY={-2} />
      <trace from="LEFT.pin1" to="RIGHT.pin1" />
      <autoroutingphase
        reroute
        region={{ minX: -3, maxX: 3, minY: -4, maxY: 4 }}
        autorouter={{ algorithmFn: rerouteRegion }}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  expect(checkedRegionInput).toBe(true)
  expect(circuit.db.pcb_autorouting_error.list()).toEqual([])
  const manualTraces = circuit.db.pcb_trace
    .list()
    .filter(
      (trace) => trace.source_trace_id === originalManualTrace!.source_trace_id,
    )
  expect(manualTraces).toHaveLength(1)
  expect(manualTraces[0].route).toEqual(originalManualTrace!.route)
  expect(
    circuit.db.pcb_trace
      .list()
      .some((trace) => trace.pcb_trace_id === "replacement_manual"),
  ).toBe(false)
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
