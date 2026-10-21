import { expect, mock, spyOn, test } from "bun:test"
import * as runtimeLoader from "lib/utils/autorouting/create-autorouter-runtime"
import type { AutorouterRuntime } from "lib/utils/autorouting/create-autorouter-runtime"
import { createThreadedAutorouter } from "tests/fixtures/autorouter-threads/createThreadedAutorouter"

test("stop during worker loading disposes late workers and blocks overlapping restarts", async () => {
  let finishImport!: (runtime: AutorouterRuntime) => void
  const importPending = new Promise<AutorouterRuntime>((resolve) => {
    finishImport = resolve
  })
  const loader = spyOn(
    runtimeLoader,
    "createAutorouterRuntime",
  ).mockReturnValue(importPending)
  const dispose = mock(async (): Promise<void> => {})
  const runtime = { dispose } as unknown as AutorouterRuntime
  const { autorouter, solver } = createThreadedAutorouter()
  const events: string[] = []
  autorouter.on("complete", () => events.push("complete"))
  autorouter.on("error", () => events.push("error"))
  try {
    autorouter.start()
    autorouter.stop()
    autorouter.start()
    expect(loader).toHaveBeenCalledTimes(1)
    finishImport(runtime)
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(autorouter.isRouting).toBe(false)
    expect(dispose).toHaveBeenCalledTimes(1)
    expect(solver.solveAsync).not.toHaveBeenCalled()
    expect(events).toEqual([])
    loader.mockResolvedValue(runtime)
    await new Promise<void>((resolve, reject) => {
      autorouter.on("complete", () => resolve())
      autorouter.on("error", (event) => reject(event.error))
      autorouter.start()
    })
    expect(loader).toHaveBeenCalledTimes(2)
    expect(solver.solveAsync).toHaveBeenCalledTimes(1)
    expect(dispose).toHaveBeenCalledTimes(2)
  } finally {
    autorouter.stop()
    loader.mockRestore()
  }
})
