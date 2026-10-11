import { beforeAll, expect, test } from "bun:test"
import { getDogbonePhaseHandoffFixture } from "tests/fixtures/get-dogbone-phase-handoff-fixture"

const { circuit, phaseIo, earlierRoute } = getDogbonePhaseHandoffFixture()

beforeAll(async () => {
  await circuit.renderUntilSettled()
  expect(phaseIo).toHaveLength(3)
  const earlierTrace = phaseIo[0]!.endSimpleRouteJson!.traces![0]!
  expect(phaseIo[1]!.startSimpleRouteJson!.traces).toEqual([earlierTrace])
  expect(circuit.db.pcb_via.list()).toHaveLength(1)
  expect(circuit.db.pcb_autorouting_error.list()).toEqual([])
  expect(circuit.db.pcb_port_not_connected_error.list()).toEqual([])
  expect(circuit.db.pcb_trace_missing_error.list()).toEqual([])

  // The final circuit retains the earlier wire in both versions. The bug drops
  // it from the handoff, allowing the native continuation to cross its copper.
  const earlierSourceTraceId =
    phaseIo[0]!.startSimpleRouteJson!.connections[0]!.source_trace_id
  const physicalEarlierTraces = circuit.db.pcb_trace
    .list()
    .filter((trace) => trace.source_trace_id === earlierSourceTraceId)
  expect(physicalEarlierTraces).toHaveLength(1)
  expect(
    physicalEarlierTraces[0]!.route.map((point) => {
      if (point.route_type !== "wire")
        throw new Error("Earlier wire gained a via")
      return {
        route_type: point.route_type,
        x: point.x,
        y: point.y,
        layer: point.layer,
        width: point.width,
      }
    }),
  ).toEqual(earlierRoute)

  // Await visual assertions outside test.failing so snapshot errors fail CI.
  await expect(phaseIo).toMatchAutoroutingPhaseIoStackSnapshot(
    import.meta.path,
    "repro-dogbone-drops-earlier-phase-copper-handoff",
    circuit,
    { includePreloadedTraces: false, diffThresholdPercent: 0 },
  )
})

test("native dogbone preserves earlier copper for a collision-free bus-lanes continuation", () => {
  const earlierTrace = phaseIo[0]!.endSimpleRouteJson!.traces![0]!
  expect(
    phaseIo[1]!.endSimpleRouteJson!.traces?.filter(
      (trace) => trace.pcb_trace_id === earlierTrace.pcb_trace_id,
    ),
  ).toEqual([earlierTrace])
  expect(
    phaseIo[2]!.startSimpleRouteJson!.traces?.filter(
      (trace) => trace.pcb_trace_id === earlierTrace.pcb_trace_id,
    ),
  ).toEqual([earlierTrace])
  expect(
    circuit
      .getCircuitJson()
      .filter((element) => element.type.endsWith("_error")),
  ).toEqual([])
})
