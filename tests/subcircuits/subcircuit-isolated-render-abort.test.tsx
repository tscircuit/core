import { expect, test } from "bun:test"
import { ControllableAutorouter } from "tests/fixtures/controllable-autorouter"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { abortableDelay } from "lib/utils/abortable-delay"

test("isolated subcircuits forward routing progress and cancel with their parent", async () => {
  const { circuit } = getTestFixture()
  const controller = new AbortController()
  const reason = new Error("Cancel isolated routing")
  const routers: ControllableAutorouter[] = []
  const events: string[] = []
  circuit.on("autorouting:start", () => events.push("start"))
  circuit.on("autorouting:progress", () => {
    events.push("progress")
    controller.abort(reason)
  })
  circuit.on("autorouting:end", () => events.push("end"))
  circuit.on("autorouting:error", () => events.push("error"))
  circuit.add(
    <board width={20} height={20}>
      <subcircuit name="S1" _subcircuitCachingEnabled>
        <group
          subcircuit
          autorouter={{
            algorithmFn: async (input) => {
              const router = new ControllableAutorouter(input)
              routers.push(router)
              router.onStart = () =>
                router.emit({ type: "progress", steps: 1, progress: 0.5 })
              return router
            },
          }}
        >
          <resistor name="R1" resistance="1k" footprint="0402" pcbX={-4} />
          <resistor name="R2" resistance="1k" footprint="0402" pcbX={4} />
          <trace from="R1.pin1" to="R2.pin1" />
        </group>
      </subcircuit>
    </board>,
  )

  await expect(
    circuit.renderUntilSettled({ signal: controller.signal }),
  ).rejects.toBe(reason)
  await abortableDelay(0)
  expect(events).toEqual(["start", "progress"])
  expect(routers).toHaveLength(1)
  expect(routers[0]!.isRouting).toBe(false)
  expect(routers[0]!.stopCount).toBeGreaterThan(0)
  expect(circuit.pendingSubcircuitRenders!.size).toBe(0)
  expect(circuit.cachedSubcircuits!.size).toBe(0)
})
