import type { createAutorouterSolverRuntime } from "@tscircuit/capacity-autorouter/runtime/node"

export type AutorouterRuntime = ReturnType<typeof createAutorouterSolverRuntime>

/** Load worker code only on Node/Bun hosts; browser routing stays inline. */
export async function createAutorouterRuntime(
  workerCount: number,
): Promise<AutorouterRuntime | undefined> {
  if (typeof process === "undefined" || !process.versions?.node) {
    return undefined
  }

  const runtimeModule = process.versions.bun
    ? "@tscircuit/capacity-autorouter/runtime/bun"
    : "@tscircuit/capacity-autorouter/runtime/node"
  // Keep optional Node worker imports out of consumers' browser bundles.
  const { createAutorouterSolverRuntime } = (await import(
    /* @vite-ignore */ runtimeModule
  )) as typeof import("@tscircuit/capacity-autorouter/runtime/node")
  return createAutorouterSolverRuntime({ workerCount, requireWorker: true })
}
