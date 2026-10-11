import { beforeAll, expect, test } from "bun:test"
import { getDogbonePhaseHandoffFixture } from "tests/fixtures/get-dogbone-phase-handoff-fixture"

const { circuit, phaseIo, earlierRoute, savedRoute } =
  getDogbonePhaseHandoffFixture({ includeSavedCopper: true })

beforeAll(async () => {
  await circuit.renderUntilSettled()
  expect(phaseIo).toHaveLength(4)
  expect(circuit.db.pcb_via.list()).toHaveLength(1)
  expect(circuit.db.pcb_autorouting_error.list()).toEqual([])
  expect(circuit.db.pcb_port_not_connected_error.list()).toEqual([])
  expect(circuit.db.pcb_trace_missing_error.list()).toEqual([])

  // Saved S1-S2 is already fixed as an obstacle. The distinct custom M1-M2 wire
  // exposes the dogbone handoff loss; both physical wires must remain once.
  const savedSourceTraceId =
    phaseIo[0]!.startSimpleRouteJson!.connections[0]!.source_trace_id
  const earlierSourceTraceId =
    phaseIo[1]!.startSimpleRouteJson!.connections[0]!.source_trace_id
  const savedTraces = circuit.db.pcb_trace
    .list()
    .filter((trace) => trace.source_trace_id === savedSourceTraceId)
  const earlierTraces = circuit.db.pcb_trace
    .list()
    .filter((trace) => trace.source_trace_id === earlierSourceTraceId)
  expect(savedTraces).toHaveLength(1)
  expect(earlierTraces).toHaveLength(1)
  expect(
    savedTraces[0]!.route.map((point) => {
      if (point.route_type !== "wire")
        throw new Error("Saved wire gained a via")
      return {
        route_type: point.route_type,
        x: point.x,
        y: point.y,
        layer: point.layer,
        width: point.width,
      }
    }),
  ).toEqual(savedRoute)
  expect(
    earlierTraces[0]!.route.map((point) => {
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
  expect(
    phaseIo[3]!.startSimpleRouteJson!.obstacles.some(
      (obstacle) =>
        Math.abs(obstacle.center.x + 5) < 1e-6 &&
        Math.abs(obstacle.center.y - 3) < 1e-6,
    ),
  ).toBe(true)

  // This is an actual PCB snapshot: the buggy SIGNAL crosses M1-M2, while the
  // fixed continuation detours. Notes and fixture geometry are identical.
  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    layer: "bottom",
    diffThresholdPercent: 0,
  })
})

test.failing(
  "saved copper stays fixed while native SIGNAL avoids earlier custom copper",
  () => {
    const earlierTrace = phaseIo[1]!.endSimpleRouteJson!.traces![0]!
    expect(
      phaseIo[2]!.endSimpleRouteJson!.traces?.filter(
        (trace) => trace.pcb_trace_id === earlierTrace.pcb_trace_id,
      ),
    ).toEqual([earlierTrace])
    expect(
      phaseIo[3]!.startSimpleRouteJson!.traces?.filter(
        (trace) => trace.pcb_trace_id === earlierTrace.pcb_trace_id,
      ),
    ).toEqual([earlierTrace])
    expect(
      circuit
        .getCircuitJson()
        .filter((element) => element.type.endsWith("_error")),
    ).toEqual([])
  },
)
