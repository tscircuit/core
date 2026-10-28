import { expect, spyOn, test } from "bun:test"
import * as runtimeLoader from "lib/utils/autorouting/create-autorouter-runtime"
import { createThreadedAutorouter } from "tests/fixtures/autorouter-threads/createThreadedAutorouter"
import type { AutorouterOptions } from "../../../../lib/utils/autorouting/capacity-mesh-autorouter-options"

test("omitted and inline threads plus cloud and legacy solvers retain stepped routing", async () => {
  const loader = spyOn(
    runtimeLoader,
    "createAutorouterRuntime",
  ).mockImplementation(async () => {
    throw new Error("Unexpected worker loading")
  })
  try {
    const configurations: AutorouterOptions[] = [
      {},
      { platformConfig: { autorouterThreads: 1 } },
      { platformConfig: { autorouterThreads: 4, useCloudAutorouter: true } },
      {
        platformConfig: { autorouterThreads: 4 },
        autorouterVersion: "beta_pipeline7",
      },
    ]
    for (const options of configurations) {
      const { autorouter, solver } = createThreadedAutorouter(options)
      await new Promise<void>((resolve, reject) => {
        autorouter.on("complete", () => resolve())
        autorouter.on("error", (event) => reject(event.error))
        autorouter.start()
      })
      expect(solver.step).toHaveBeenCalledTimes(1)
      expect(solver.solveAsync).not.toHaveBeenCalled()
    }
    const { autorouter, solver } = createThreadedAutorouter()
    expect(autorouter.solveSync()).toEqual([])
    expect(solver.solve).toHaveBeenCalledTimes(1)
    expect(solver.solveAsync).not.toHaveBeenCalled()
    expect(loader).not.toHaveBeenCalled()
  } finally {
    loader.mockRestore()
  }
})
