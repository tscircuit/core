import { expect, test } from "bun:test"
import type { SimpleRouteJson } from "lib/utils/autorouting/SimpleRouteJson"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("later native phases preserve a completed length-constrained trace as exact copper", async () => {
  const { circuit } = getTestFixture()
  const inputs: SimpleRouteJson[] = []
  circuit.on("autorouting:start", (event) => {
    inputs.push(structuredClone(event.simpleRouteJson))
  })
  circuit.add(
    <board width={14} height={11} autorouter="beta-pipeline9">
      <pcbnotetext
        pcbY={4.4}
        fontSize={0.45}
        text="SHORT: maxLength 3 mm; preserve first-phase copper"
      />
      <pcbnotetext
        pcbY={3.5}
        fontSize={0.35}
        text="CROSS routes around it; RELAXED stays movable"
      />
      <testpoint name="SHORT_A" pcbX={-1} pcbY={0} padDiameter={0.5} />
      <testpoint name="SHORT_B" pcbX={1} pcbY={0} padDiameter={0.5} />
      <testpoint name="RELAXED_A" pcbX={-4} pcbY={2} padDiameter={0.5} />
      <testpoint name="RELAXED_B" pcbX={-2} pcbY={2} padDiameter={0.5} />
      <testpoint name="CROSS_A" pcbX={-4} pcbY={-3} padDiameter={0.5} />
      <testpoint name="CROSS_B" pcbX={4} pcbY={2} padDiameter={0.5} />
      <trace name="SHORT" from="SHORT_A.pin1" to="SHORT_B.pin1" maxLength={3} />
      <trace name="RELAXED" from="RELAXED_A.pin1" to="RELAXED_B.pin1" />
      <trace name="CROSS" from="CROSS_A.pin1" to="CROSS_B.pin1" />
      <autoroutingphase phaseIndex={0} connections={["SHORT", "RELAXED"]} />
    </board>,
  )
  await circuit.renderUntilSettled()
  expect(circuit.db.pcb_autorouting_error.list()).toEqual([])
  expect(circuit.db.pcb_trace_error.list()).toEqual([])
  expect(inputs).toHaveLength(2)
  const source = circuit.db.source_trace
    .list()
    .find((trace) => trace.name === "SHORT")!
  const relaxed = circuit.db.source_trace
    .list()
    .find((trace) => trace.name === "RELAXED")!
  const shortInput = inputs[1]!.traces!.find(
    (trace) => trace.connection_name === source.source_trace_id,
  )!
  expect(shortInput.isFixed).toBe(true)
  expect(
    inputs[1]!.traces!.find(
      (trace) => trace.connection_name === relaxed.source_trace_id,
    )!.isFixed,
  ).not.toBe(true)
  // The native graph receives the original polyline, not trace-shaped rectangles.
  expect(inputs[1]!.obstacles).toEqual(inputs[0]!.obstacles)
  const routed = circuit.db.pcb_trace
    .list()
    .find((trace) => trace.source_trace_id === source.source_trace_id)!
  // Wire points are board-world millimeters, +X right and +Y up.
  const positions = (route: typeof shortInput.route | typeof routed.route) =>
    route
      .filter((point) => point.route_type === "wire")
      .map(({ x, y, layer }) => ({ x, y, layer }))
  expect(positions(routed.route)).toEqual(positions(shortInput.route))
  const wires = positions(routed.route)
  const length = wires
    .slice(1)
    .reduce(
      (sum, point, index) =>
        sum + Math.hypot(point.x - wires[index]!.x, point.y - wires[index]!.y),
      0,
    )
  expect(length).toBeLessThanOrEqual(3)
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
