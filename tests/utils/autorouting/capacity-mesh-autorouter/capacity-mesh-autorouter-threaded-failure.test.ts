import { expect, mock, spyOn, test } from "bun:test"
import * as runtimeLoader from "lib/utils/autorouting/create-autorouter-runtime"
import type { AutorouterRuntime } from "lib/utils/autorouting/create-autorouter-runtime"
import { createThreadedAutorouter } from "tests/fixtures/autorouter-threads/createThreadedAutorouter"

test("worker load and solve failures emit one error after disposing owned workers", async () => {
  const loader = spyOn(runtimeLoader, "createAutorouterRuntime")
  try {
    for (const failLoad of [true, false]) {
      const dispose = mock(async (): Promise<void> => {})
      const runtime = { dispose } as unknown as AutorouterRuntime
      loader.mockImplementation(async () => {
        if (failLoad) throw new Error("Worker module failed")
        return runtime
      })
      const { autorouter, solver } = createThreadedAutorouter()
      solver.solveAsync.mockImplementation(async () => {
        throw new Error("Worker solve failed")
      })
      const events: string[] = []
      autorouter.on("complete", () => events.push("complete"))
      const error = await new Promise<Error>((resolve) => {
        autorouter.on("error", (event) => {
          events.push("error")
          expect(dispose).toHaveBeenCalledTimes(failLoad ? 0 : 1)
          resolve(event.error)
        })
        autorouter.start()
      })
      expect(error.message).toStartWith(
        failLoad ? "Worker module failed" : "Worker solve failed",
      )
      expect(events).toEqual(["error"])
      expect(autorouter.isRouting).toBe(false)
    }
  } finally {
    loader.mockRestore()
  }
})
