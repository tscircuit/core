import { expect, test } from "bun:test"
import { TscircuitAutorouter } from "lib/utils/autorouting/CapacityMeshAutorouter"
import type { SimpleRouteJson } from "lib/utils/autorouting/SimpleRouteJson"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("a via-only keepout permits ordinary single-layer routing", async () => {
  const { circuit } = getTestFixture()
  const routingInputs: SimpleRouteJson[] = []
  const solverNames: string[] = []
  circuit.on("autorouting:start", ({ simpleRouteJson }) =>
    routingInputs.push(simpleRouteJson),
  )
  circuit.on("solver:started", ({ solverName }) => solverNames.push(solverName))

  circuit.add(
    <board width={10} height={10} layers={1}>
      <testpoint name="TP1" footprintVariant="pad" pcbX={-2} layer="top" />
      <testpoint name="TP2" footprintVariant="pad" pcbX={2} layer="top" />
      <keepout shape="circle" radius={0.5} allowTraces allowPlacements />
      <trace from="TP1.pin1" to="TP2.pin1" />
    </board>,
  )
  await circuit.renderUntilSettled()

  expect(circuit.db.pcb_autorouting_error.list()).toEqual([])
  expect(solverNames).toContain("AssignableAutoroutingPipeline2")
  expect(routingInputs).toHaveLength(1)
  expect(routingInputs[0]!.viaKeepouts).toHaveLength(1)
  expect(circuit.db.pcb_trace.list()).toHaveLength(1)
  expect(circuit.db.pcb_via.list()).toEqual([])

  const traces = new TscircuitAutorouter(routingInputs[0]!, {
    useAssignableSolver: true,
  }).solveSync()
  expect(traces).toHaveLength(1)
  expect(traces[0]!.route.some((segment) => segment.route_type === "via")).toBe(
    false,
  )
})
