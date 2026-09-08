import { expect, spyOn, test } from "bun:test"
import type { LocalCacheEngine } from "lib/local-cache-engine"
import { TscircuitAutorouter } from "lib/utils/autorouting/CapacityMeshAutorouter"
import type { AutorouterWarningEvent } from "lib/utils/autorouting/GenericLocalAutorouter"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("local trace caching cannot discard autorouter warnings on the next render", async () => {
  const cache = new Map<string, string>()
  const localCacheEngine: LocalCacheEngine = {
    getItem: (key) => cache.get(key) ?? null,
    setItem: (key, value) => {
      cache.set(key, value)
    },
  }
  let emitWarning = true
  let startCount = 0
  const originalStart = TscircuitAutorouter.prototype.start
  const startSpy = spyOn(
    TscircuitAutorouter.prototype,
    "start",
  ).mockImplementation(function (this: TscircuitAutorouter) {
    startCount++
    if (emitWarning) {
      // Exercise a warning from a cacheable built-in adapter without altering
      // its actual routing result or the warning listener registration.
      const adapter = this as unknown as {
        emitEvent(event: AutorouterWarningEvent): void
      }
      adapter.emitEvent({
        type: "warning",
        message: "Recovered during routing",
      })
    }
    originalStart.call(this)
  })

  const render = async () => {
    const { circuit } = getTestFixture({ platform: { localCacheEngine } })
    circuit.add(
      <board width="16mm" height="8mm">
        <resistor name="R1" resistance="1k" footprint="0402" pcbX={-5} />
        <resistor name="R2" resistance="1k" footprint="0402" pcbX={5} />
        <trace from="R1.pin2" to="R2.pin1" />
      </board>,
    )
    await circuit.renderUntilSettled()
    return circuit
  }

  try {
    const first = await render()
    const second = await render()
    expect(startCount).toBe(2)
    expect(cache.size).toBe(0)
    expect(first.db.pcb_autorouter_warning.list()).toHaveLength(1)
    expect(second.db.pcb_autorouter_warning.list()).toHaveLength(1)
    expect(second.db.pcb_trace.list()).toEqual(first.db.pcb_trace.list())

    emitWarning = false
    const third = await render()
    const fourth = await render()
    expect(startCount).toBe(3)
    expect(cache.size).toBe(1)
    expect(third.db.pcb_autorouter_warning.list()).toEqual([])
    expect(fourth.db.pcb_autorouter_warning.list()).toEqual([])
    expect(fourth.db.pcb_trace.list()).toEqual(third.db.pcb_trace.list())
  } finally {
    startSpy.mockRestore()
  }
})
