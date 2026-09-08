import { expect, test } from "bun:test"
import { ControllableAutorouter } from "tests/fixtures/controllable-autorouter"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import type { SimpleRouteJson } from "lib/utils/autorouting/SimpleRouteJson"

test("render cancellation stops the active phase and ignores late router events", async () => {
  const { circuit } = getTestFixture()
  const controller = new AbortController()
  const reason = new Error("Canceled during phase progress")
  const routers: ControllableAutorouter[] = []
  const events: string[] = []
  const algorithmFn = async (input: SimpleRouteJson) => {
    const router = new ControllableAutorouter(input)
    routers.push(router)
    router.onStart = () =>
      router.emit({ type: "progress", steps: 1, progress: 0.25 })
    return router
  }
  circuit.on("autorouting:start", () => events.push("start"))
  circuit.on("autorouting:end", () => events.push("end"))
  circuit.on("autorouting:error", () => events.push("error"))
  circuit.on("renderComplete", () => events.push("render_complete"))
  circuit.on("autorouting:progress", () => {
    events.push("progress")
    controller.abort(reason)
  })
  circuit.add(
    <board width={16} height={12} autorouter={{ algorithmFn }}>
      <resistor name="A1" resistance="1k" footprint="0402" pcbX={-5} pcbY={2} />
      <resistor name="A2" resistance="1k" footprint="0402" pcbX={5} pcbY={2} />
      <resistor
        name="B1"
        resistance="1k"
        footprint="0402"
        pcbX={-5}
        pcbY={-2}
      />
      <resistor name="B2" resistance="1k" footprint="0402" pcbX={5} pcbY={-2} />
      <trace from="A1.pin1" to="A2.pin1" routingPhaseIndex={0} />
      <trace from="B1.pin1" to="B2.pin1" routingPhaseIndex={1} />
    </board>,
  )

  await expect(
    circuit.renderUntilSettled({ signal: controller.signal }),
  ).rejects.toBe(reason)
  expect(routers).toHaveLength(1)
  expect(routers[0]!.isRouting).toBe(false)
  expect(routers[0]!.stopCount).toBeGreaterThan(0)
  routers[0]!.emit({ type: "progress", steps: 2, progress: 1 })
  routers[0]!.emit({ type: "complete", traces: [] })
  routers[0]!.emit({ type: "error", error: new Error("Late error") })
  expect(events).toEqual(["start", "progress"])
  expect(circuit.db.pcb_autorouting_error.list()).toHaveLength(0)
  expect(circuit.db.pcb_trace.list()).toHaveLength(0)
  expect(() => circuit.render()).toThrow(reason)
})
