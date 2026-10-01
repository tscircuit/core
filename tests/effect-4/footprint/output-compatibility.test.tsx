import { expect, spyOn, test } from "bun:test"
import { createFootprintCircuit, footprintResponse } from "./helpers"

test("default and configured HTTP scopes preserve Circuit JSON, lifecycle events and PCB output", async () => {
  const fetchSpy = spyOn(globalThis, "fetch").mockImplementation(
    Object.assign(async () => footprintResponse(), {
      preconnect: globalThis.fetch.preconnect,
    }),
  )
  try {
    const legacy = createFootprintCircuit()
    const owned = createFootprintCircuit({})
    const lifecycle: string[][] = [[], []]
    for (const [index, circuit] of [legacy, owned].entries()) {
      circuit.on("asyncEffect:start", (event) => {
        lifecycle[index].push(`start:${event.effectName}:${event.phase}`)
      })
      circuit.on("asyncEffect:end", (event) => {
        lifecycle[index].push(
          `end:${event.effectName}:${event.phase}:${event.error}`,
        )
      })
      circuit.on("renderComplete", () =>
        lifecycle[index].push("renderComplete"),
      )
      await circuit.renderUntilSettled()
    }
    expect(owned.getCircuitJson()).toEqual(legacy.getCircuitJson())
    expect(lifecycle[1]).toEqual(lifecycle[0])
    expect(owned.db.pcb_smtpad.list()).toHaveLength(2)
    expect(legacy.experimentalFootprintLoader).toBeUndefined()
    expect(fetchSpy.mock.calls[0][1]?.signal).toBeInstanceOf(AbortSignal)
    expect(fetchSpy.mock.calls[1][1]?.signal).toBeInstanceOf(AbortSignal)
    expect(owned.experimentalFootprintLoader!.activeJobCount).toBe(0)
    expect(owned).toMatchPcbSnapshot(import.meta.path)
  } finally {
    fetchSpy.mockRestore()
  }
})
