import { expect, test } from "bun:test"
import { TscircuitAutorouter } from "lib/utils/autorouting/CapacityMeshAutorouter"
import type { AutorouterProgressEvent } from "lib/utils/autorouting/GenericLocalAutorouter"
import type { SimpleRouteJson } from "lib/utils/autorouting/SimpleRouteJson"
import "tests/fixtures/get-test-fixture"

const createTestSimpleRouteJson = (): SimpleRouteJson => ({
  layerCount: 2,
  minTraceWidth: 0.15,
  obstacles: [],
  connections: [
    {
      name: "signal",
      pointsToConnect: [
        { x: -2, y: 0, layer: "top" },
        { x: 2, y: 0, layer: "top" },
      ],
    },
  ],
  bounds: { minX: -4, maxX: 4, minY: -3, maxY: 3 },
})

const createFakeSolver = ({
  stepAsync,
}: {
  stepAsync: () => Promise<void>
}) => ({
  solved: false,
  failed: false,
  error: undefined,
  iterations: 0,
  progress: 0,
  step() {
    throw new Error("synchronous step should not be called")
  },
  stepAsync,
  getOutputSimpleRouteJson() {
    return { traces: [] }
  },
  getCurrentPhase() {
    return "exact_geometry_improvement"
  },
  preview() {
    return undefined
  },
})

test("repro: unknown progress is reported as 0% and stop leaks progress", async () => {
  const progressAutorouter = new TscircuitAutorouter(
    createTestSimpleRouteJson(),
  )
  const progressSolver = createFakeSolver({
    stepAsync: async () => {
      progressSolver.iterations++
      progressSolver.solved = true
    },
  })
  ;(progressAutorouter as any).solver = progressSolver

  let reportedProgressEvent: AutorouterProgressEvent | undefined
  progressAutorouter.on("progress", (event) => {
    reportedProgressEvent = event
  })
  await new Promise<void>((resolve, reject) => {
    progressAutorouter.on("complete", () => resolve())
    progressAutorouter.on("error", (event) => reject(event.error))
    progressAutorouter.start()
  })

  let releaseStep: (() => void) | undefined
  let markStepStarted: (() => void) | undefined
  const stepStarted = new Promise<void>((resolve) => {
    markStepStarted = resolve
  })
  const stepCanFinish = new Promise<void>((resolve) => {
    releaseStep = resolve
  })
  const cancellationAutorouter = new TscircuitAutorouter(
    createTestSimpleRouteJson(),
  )
  const cancellationSolver = createFakeSolver({
    stepAsync: async () => {
      cancellationSolver.iterations++
      markStepStarted?.()
      await stepCanFinish
      cancellationSolver.solved = true
    },
  })
  ;(cancellationAutorouter as any).solver = cancellationSolver

  const progressEventsAfterStop: AutorouterProgressEvent[] = []
  cancellationAutorouter.on("progress", (event) => {
    progressEventsAfterStop.push(event)
  })
  cancellationAutorouter.start()
  await stepStarted
  cancellationAutorouter.stop()
  releaseStep?.()
  await new Promise((resolve) => setTimeout(resolve, 20))

  expect(reportedProgressEvent?.phase).toBe("exact_geometry_improvement")
  expect(reportedProgressEvent?.progress).toBe(0)
  expect(progressEventsAfterStop).toHaveLength(1)

  const reportedProgress = `${Math.round(
    (reportedProgressEvent?.progress ?? 0) * 100,
  )}%`
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="260" viewBox="0 0 800 260">
    <rect width="800" height="260" fill="#111827" />
    <text x="400" y="42" text-anchor="middle" fill="#f9fafb" font-family="Arial" font-size="24" font-weight="700">Autorouter status reproduction</text>
    <rect x="40" y="75" width="720" height="64" rx="8" fill="#450a0a" stroke="#ef4444" stroke-width="2" />
    <text x="65" y="103" fill="#fecaca" font-family="Arial" font-size="18">exact_geometry_improvement reported progress: ${reportedProgress}</text>
    <text x="65" y="127" fill="#fecaca" font-family="Arial" font-size="18">No phase estimate exists, but the API reports a definite zero.</text>
    <rect x="40" y="158" width="720" height="64" rx="8" fill="#450a0a" stroke="#ef4444" stroke-width="2" />
    <text x="65" y="186" fill="#fecaca" font-family="Arial" font-size="18">Progress events emitted after stop(): ${progressEventsAfterStop.length}</text>
    <text x="65" y="210" fill="#fecaca" font-family="Arial" font-size="18">The in-flight cycle continues after cancellation.</text>
  </svg>`
  expect(svg).toMatchSvgSnapshot(import.meta.path)
})
