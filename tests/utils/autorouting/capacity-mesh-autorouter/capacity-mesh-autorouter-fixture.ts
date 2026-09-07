import { TscircuitAutorouter } from "lib/utils/autorouting/CapacityMeshAutorouter"
import type { SimpleRouteJson } from "lib/utils/autorouting/SimpleRouteJson"

export const createCapacityAutorouterFixture = () => {
  const input: SimpleRouteJson = {
    layerCount: 2,
    minTraceWidth: 0.2,
    obstacles: [],
    connections: [],
    bounds: { minX: -5, maxX: 5, minY: -5, maxY: 5 },
  }
  const autorouter = new TscircuitAutorouter(input)
  const solver = {
    solved: false,
    failed: false,
    error: undefined as string | undefined,
    iterations: 0,
    progress: 0,
    step() {
      this.iterations++
      this.solved = true
    },
    stepAsync: undefined as (() => Promise<void>) | undefined,
    getOutputSimplifiedPcbTraces() {
      return []
    },
    getCurrentPhase() {
      return "test_phase"
    },
    preview() {
      return undefined
    },
  }
  ;(autorouter as unknown as { solver: typeof solver }).solver = solver
  return { autorouter, solver }
}

export const deferred = () => {
  let resolve!: () => void
  let reject!: (error: Error) => void
  const promise = new Promise<void>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise
    reject = rejectPromise
  })
  return { promise, resolve, reject }
}

export const waitForRoutingTimer = () =>
  new Promise<void>((resolve) => setTimeout(resolve, 10))
