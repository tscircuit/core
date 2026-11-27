import { expect, test } from "bun:test"
import { IcePiSbcWithUnroutedSdD3 } from "@tscircuit/core-ddr-benchmark/circuits/icepi-sbc-with-unrouted-sd-d3"
import { PcbConnectivityMap } from "circuit-json-to-connectivity-map"
import type { Port } from "lib/components/primitive-components/Port/Port"
import { createAutoroutingPhaseIoStack } from "tests/fixtures/create-autorouting-phase-io-stack"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { restoreIcePiFixedCopper } from "tests/fixtures/icepi/sd-d3-fixed-copper"

test("route SD D3 on the full iCE/Pi CM0 SBC around its fixed copper", async () => {
  const { circuit } = getTestFixture()
  const phases = createAutoroutingPhaseIoStack(circuit)
  circuit.add(
    <IcePiSbcWithUnroutedSdD3 restoreFixedCopper={restoreIcePiFixedCopper} />,
  )
  await circuit.renderUntilSettled()

  expect(circuit.db.pcb_autorouting_error.list()).toEqual([])
  expect(circuit.db.source_runtime_error.list()).toEqual([])
  const sdD3Phase = phases[1]
  const fixedTraces = sdD3Phase.startSimpleRouteJson!.traces!
  const routedTraces = sdD3Phase.endSimpleRouteJson!.traces!
  expect(sdD3Phase.startSimpleRouteJson!.connections).toHaveLength(1)
  expect(fixedTraces).toHaveLength(1019)
  const routesByTraceId = new Map(
    routedTraces.map((trace) => [trace.pcb_trace_id, trace.route]),
  )
  for (const trace of fixedTraces) {
    expect(routesByTraceId.get(trace.pcb_trace_id)).toEqual(trace.route)
  }
  expect(circuit.db.pcb_trace.list()).toHaveLength(1020)
  const controller = circuit.firstChild!.selectOne<Port>(".U1 > .pin99")!
  const sdSocket = circuit.firstChild!.selectOne<Port>(".J6 > .pin2")!
  const copper = new PcbConnectivityMap(circuit.getCircuitJson()).connMap
  expect(
    copper.areAllIdsConnected([controller.pcb_port_id!, sdSocket.pcb_port_id!]),
  ).toBe(true)
  expect(circuit.db.pcb_bus_length_skew_error.list()).toEqual([])
  expect(circuit.db.pcb_bus_routing_constraint_warning.list()).toEqual([])
  await expect(phases).toMatchAutoroutingPhaseIoStackSnapshot(
    import.meta.path,
    "icepi-cm0-sbc-routing-phases",
    undefined,
    { includePreloadedTraces: false },
  )
  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    layer: "top",
    width: 1200,
    height: 800,
    shouldDrawRatsNest: false,
    shouldDrawErrors: false,
    showCourtyards: false,
    showDebugObjects: false,
    showFabricationNotes: false,
  })
}, 600_000)
