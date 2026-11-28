import type { SpiceEngine } from "@tscircuit/props"
import { spawnSync } from "node:child_process"
import { join } from "node:path"

/** Keep a fatal WASM model-loading failure from terminating the test runner. */
export const createIsolatedNgspiceEngine = (): SpiceEngine => ({
  simulate: async (spice) => {
    const execution = spawnSync(
      process.execPath,
      [join(import.meta.dir, "run-isolated-ngspice.ts")],
      { input: spice, encoding: "utf8", timeout: 10_000 },
    )
    if (execution.status !== 0) {
      throw new Error(
        execution.stderr.trim().split("\n")[0] || "ngspice execution failed",
      )
    }
    return JSON.parse(execution.stdout.trim().split("\n").at(-1)!)
  },
})
