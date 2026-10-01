import { expect, test } from "bun:test"
import type {
  SimpleRouteJson,
  SimplifiedPcbTrace,
} from "lib/utils/autorouting/SimpleRouteJson"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { ControlledAutorouter } from "../routing-fixture"

test("local routing observers return before the public end event and render settlement", async () => {
  const { circuit } = getTestFixture({
    platform: { drcChecksDisabled: true },
  })
  const router = new ControlledAutorouter()
  const order: string[] = []
  const observedTraceCounts: Array<{ at: string; count: number }> = []
  let outputTraces: SimplifiedPcbTrace[] = []
  let signalStarted!: () => void
  const started = new Promise<void>((resolve) => {
    signalStarted = resolve
  })
  router.onStart = () => {
    order.push("router:start")
    // Register after core's complete listener. A synchronous continuation would
    // emit autorouting:end before this later observer has returned.
    router.on("complete", () => {
      order.push("router:other-complete")
      observedTraceCounts.push({
        at: "complete observer",
        count: circuit
          .getCircuitJson()
          .filter((element) => element.type === "pcb_trace").length,
      })
    })
    signalStarted()
  }
  circuit.on("autorouting:start", () => order.push("autorouting:start"))
  circuit.on("autorouting:progress", () => order.push("autorouting:progress"))
  circuit.on("autorouting:end", () => order.push("autorouting:end"))
  circuit.on("renderComplete", () => order.push("renderComplete"))
  circuit.add(
    <board
      width={20}
      height={10}
      autorouter={{
        local: true,
        groupMode: "subcircuit",
        algorithmFn: async (input: SimpleRouteJson) => {
          order.push("factory")
          const connection = input.connections[0]!
          outputTraces = [
            {
              type: "pcb_trace",
              pcb_trace_id: "controlled_route",
              connection_name: connection.name,
              route: connection.pointsToConnect.map((point) => ({
                route_type: "wire",
                x: point.x,
                y: point.y,
                layer: "top",
                width: 0.15,
              })),
            },
          ]
          return router
        },
      }}
    >
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={-4} />
      <resistor name="R2" resistance="1k" footprint="0402" pcbX={4} />
      <trace from="R1.1" to="R2.1" />
    </board>,
  )

  const settling = circuit.renderUntilSettled()
  await started
  expect(order).toEqual(["autorouting:start", "factory", "router:start"])
  router.progress()
  router.complete(outputTraces)
  order.push("complete:return")
  observedTraceCounts.push({
    at: "complete returned",
    count: circuit
      .getCircuitJson()
      .filter((element) => element.type === "pcb_trace").length,
  })
  expect(order).toEqual([
    "autorouting:start",
    "factory",
    "router:start",
    "autorouting:progress",
    "router:other-complete",
    "complete:return",
  ])

  await settling
  order.push("settled")
  observedTraceCounts.push({
    at: "settled",
    count: circuit
      .getCircuitJson()
      .filter((element) => element.type === "pcb_trace").length,
  })
  expect(order).toEqual([
    "autorouting:start",
    "factory",
    "router:start",
    "autorouting:progress",
    "router:other-complete",
    "complete:return",
    "autorouting:end",
    "renderComplete",
    "settled",
  ])
  expect(observedTraceCounts).toEqual([
    { at: "complete observer", count: 0 },
    { at: "complete returned", count: 0 },
    { at: "settled", count: 1 },
  ])
})
