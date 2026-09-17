import { expect, test } from "bun:test"
import { getFullConnectivityMapFromCircuitJson } from "circuit-json-to-connectivity-map"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import GndViaBottomRoute from "./gnd-via-bottom-route/index.circuit"

test("repro: autorouted bottom GND trace has connected endpoints but no source trace ID", async () => {
  const { circuit } = getTestFixture()
  circuit.add(<GndViaBottomRoute />)
  await circuit.renderUntilSettled()

  const bottomTraces = circuit.db.pcb_trace
    .list()
    .filter((trace) =>
      trace.route.some(
        (point) => point.route_type === "wire" && point.layer === "bottom",
      ),
    )
  expect(bottomTraces).toHaveLength(1)
  expect(bottomTraces[0].source_trace_id).toBeUndefined()

  const ground = circuit.db.source_net.list().find((net) => net.name === "GND")!
  const connectivityMap = getFullConnectivityMapFromCircuitJson(
    circuit.getCircuitJson(),
  )
  expect(
    connectivityMap.areAllIdsConnected([
      ground.source_net_id,
      bottomTraces[0].pcb_trace_id,
      ...circuit.db.pcb_via.list().map((via) => via.pcb_via_id),
    ]),
  ).toBe(true)

  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    layer: "bottom",
  })
})
