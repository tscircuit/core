import { expect, test } from "bun:test"
import type { AutoroutingStartEvent } from "lib/events"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("conservative preflight runs before a cached phase without invalidating its routing cache", async () => {
  const cache = new Map<string, string>()
  const render = async () => {
    const { circuit } = getTestFixture({
      platform: {
        localCacheEngine: {
          getItem: (key) => cache.get(key) ?? null,
          setItem: (key, value) => {
            cache.set(key, value)
          },
        },
      },
    })
    const order: string[] = []
    const starts: AutoroutingStartEvent[] = []
    circuit.on("autorouting:preflight", () => order.push("preflight"))
    circuit.on("autorouting:start", (e) => {
      order.push("start")
      starts.push(e)
    })
    circuit.add(
      <board width={10} height={8} preflightRoutingCheckPolicy="conservative">
        <resistor name="R1" resistance="1k" footprint="0402" pcbX={-3} />
        <resistor name="R2" resistance="1k" footprint="0402" pcbX={3} />
        <trace from=".R1 > .pin2" to=".R2 > .pin1" />
        <pcbnotetext
          pcbY={-3}
          text="PREFLIGHT BEFORE CACHE HIT"
          fontSize={0.4}
        />
      </board>,
    )
    await circuit.renderUntilSettled()
    expect(order).toEqual(["preflight", "start"])
    expect(circuit.db.pcb_preflight_routing_error.list()).toHaveLength(0)
    return { circuit, starts }
  }
  const first = await render()
  const second = await render()
  expect(first.starts[0].cacheStatus).toBe("miss")
  expect(second.starts[0].cacheStatus).toBe("hit")
  expect(second.circuit.db.pcb_trace.list()).toEqual(
    first.circuit.db.pcb_trace.list(),
  )
  expect(second.circuit).toMatchPcbSnapshot(import.meta.path)
})
