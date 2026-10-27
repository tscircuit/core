import { expect, mock, spyOn, test } from "bun:test"
import * as runtimeLoader from "lib/utils/autorouting/create-autorouter-runtime"
import type { AutorouterRuntime } from "lib/utils/autorouting/create-autorouter-runtime"
import { createThreadedAutorouter } from "tests/fixtures/autorouter-threads/createThreadedAutorouter"

test("stop disposes active workers and suppresses their late cancellation error", async () => {
  const { autorouter, solver } = createThreadedAutorouter()
  let failSolve!: (error: Error) => void
  let started!: () => void
  const solveStarted = new Promise<void>((resolve) => {
    started = resolve
  })
  solver.solveAsync.mockImplementation(
    () =>
      new Promise<void>((_resolve, reject) => {
        failSolve = reject
        started()
      }),
  )
  const dispose = mock(async (): Promise<void> => {
    failSolve(new Error("Workers cancelled"))
  })
  const loader = spyOn(
    runtimeLoader,
    "createAutorouterRuntime",
  ).mockResolvedValue({ dispose } as unknown as AutorouterRuntime)
  const events: string[] = []
  autorouter.on("complete", () => events.push("complete"))
  autorouter.on("error", () => events.push("error"))
  try {
    autorouter.start()
    await solveStarted
    expect(() => autorouter.solveSync()).toThrow()
    autorouter.stop()
    autorouter.start()
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(loader).toHaveBeenCalledTimes(1)
    expect(dispose).toHaveBeenCalledTimes(1)
    expect(autorouter.isRouting).toBe(false)
    expect(events).toEqual([])
  } finally {
    autorouter.stop()
    loader.mockRestore()
  }
})
