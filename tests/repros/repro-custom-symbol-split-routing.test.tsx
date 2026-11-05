import { expect, test } from "bun:test"
import {
  checkEachPcbTraceNonOverlapping,
  checkTracesAreContiguous,
} from "@tscircuit/checks"
import type { PcbPort, PcbTrace, SourcePort } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { ESP32_S3_WROOM_1_N16 } from "./esp32-s3-wroom-1-n16-import"
type PcbPortId = PcbPort["pcb_port_id"]
type SourcePortId = SourcePort["source_port_id"]

function traceConnectsPcbPorts({
  pcbTrace,
  firstPcbPortIds,
  secondPcbPortIds,
}: {
  pcbTrace: PcbTrace
  firstPcbPortIds: PcbPortId[]
  secondPcbPortIds: PcbPortId[]
}) {
  const firstRoutePoint = pcbTrace.route[0]
  const lastRoutePoint = pcbTrace.route.at(-1)
  if (
    firstRoutePoint?.route_type !== "wire" ||
    lastRoutePoint?.route_type !== "wire"
  ) {
    return false
  }
  const endpointPcbPortIds = [
    firstRoutePoint.start_pcb_port_id,
    lastRoutePoint.end_pcb_port_id,
  ]
  return (
    endpointPcbPortIds.some(
      (pcbPortId) =>
        pcbPortId !== undefined && firstPcbPortIds.includes(pcbPortId),
    ) &&
    endpointPcbPortIds.some(
      (pcbPortId) =>
        pcbPortId !== undefined && secondPcbPortIds.includes(pcbPortId),
    )
  )
}

test("route MCU split ground and separate signal to external pads", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={60} height={50} layers={2}>
      <ESP32_S3_WROOM_1_N16 name="U1" />
      <resistor
        name="R_GND"
        resistance="1k"
        footprint="0603"
        pcbX={18}
        pcbY={-10}
      />
      <resistor
        name="R_SIGNAL"
        resistance="1k"
        footprint="0603"
        pcbX={18}
        pcbY={10}
      />
      <trace from=".U1 > .pin41" to=".R_GND > .pin1" />
      <trace from=".U1 > .pin2" to=".R_SIGNAL > .pin1" />
    </board>,
  )
  await circuit.renderUntilSettled()
  const db = circuit.db
  const json = circuit.getCircuitJson()
  const traces = db.pcb_trace.list()
  const pads = db.pcb_smtpad.list()
  const pcbPorts = db.pcb_port.list()
  const sourcePorts = db.source_port.list()
  const components = db.source_component.list()
  const component = (n: string) => components.find((c) => c.name === n)!
  const sourceFor = (n: string, pin: number) =>
    sourcePorts.find(
      (p) =>
        p.source_component_id === component(n).source_component_id &&
        p.pin_number === pin,
    )!
  const pcbFor = (sourceId: SourcePortId) =>
    pcbPorts
      .filter((p) => p.source_port_id === sourceId)
      .map((p) => p.pcb_port_id)
  const splitPads = pads.filter((p) => p.port_hints?.includes("pin41"))
  expect(splitPads).toHaveLength(9)
  const splitPcb = splitPads.map((p) => p.pcb_port_id!)
  expect(new Set(splitPcb).size).toBe(9)
  const splitSrc = splitPcb.map(
    (id) => pcbPorts.find((p) => p.pcb_port_id === id)!.source_port_id!,
  )
  expect(new Set(splitSrc).size).toBe(9)
  const groups = db.source_component_internal_connection.list()
  expect(groups).toHaveLength(1)
  expect(new Set(groups[0].source_port_ids)).toEqual(new Set(splitSrc))
  const extGround = pcbFor(sourceFor("R_GND", 1).source_port_id)
  const extSignal = pcbFor(sourceFor("R_SIGNAL", 1).source_port_id)
  const signal = pcbFor(sourceFor("U1", 2).source_port_id)
  expect(traces).toHaveLength(2)
  const g = traces.find((pcbTrace) =>
    traceConnectsPcbPorts({
      pcbTrace,
      firstPcbPortIds: splitPcb,
      secondPcbPortIds: extGround,
    }),
  )
  const s = traces.find((pcbTrace) =>
    traceConnectsPcbPorts({
      pcbTrace,
      firstPcbPortIds: signal,
      secondPcbPortIds: extSignal,
    }),
  )
  expect(g).toBeDefined()
  expect(s).toBeDefined()
  expect(g!.pcb_trace_id).not.toBe(s!.pcb_trace_id)
  // The route must actually start and end at the named port coordinates.
  for (const pcbTrace of [g!, s!]) {
    const firstRoutePoint = pcbTrace.route[0]
    const lastRoutePoint = pcbTrace.route.at(-1)
    expect(firstRoutePoint?.route_type).toBe("wire")
    expect(lastRoutePoint?.route_type).toBe("wire")
    if (
      firstRoutePoint?.route_type !== "wire" ||
      lastRoutePoint?.route_type !== "wire"
    ) {
      throw new Error(
        "Expected wire endpoints for the ground and signal routes",
      )
    }
    for (const { routePoint, pcbPortId } of [
      {
        routePoint: firstRoutePoint,
        pcbPortId: firstRoutePoint.start_pcb_port_id,
      },
      { routePoint: lastRoutePoint, pcbPortId: lastRoutePoint.end_pcb_port_id },
    ]) {
      const port = pcbPorts.find((pcbPort) => pcbPort.pcb_port_id === pcbPortId)
      expect(port).toBeDefined()
      expect(
        Math.hypot(routePoint.x - port!.x, routePoint.y - port!.y),
      ).toBeLessThan(1e-6)
    }
  }
  expect(db.source_ambiguous_port_reference.list()).toEqual([])
  expect(db.pcb_autorouting_error.list()).toEqual([])
  expect(checkTracesAreContiguous(json)).toEqual([])
  expect(checkEachPcbTraceNonOverlapping(json, { minClearance: 0.15 })).toEqual(
    [],
  )
})
