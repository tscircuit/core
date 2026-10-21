import type { AutoroutingPipelineSolver9_PreloadedTraceGraph } from "@tscircuit/capacity-autorouter"
import type { AutorouterProgressEvent } from "./GenericLocalAutorouter"
import {
  createAutorouterRuntime,
  type AutorouterRuntime,
} from "./create-autorouter-runtime"

export type ThreadedAutoroutingRun = {
  stopped: boolean
  runtime?: AutorouterRuntime
  disposal?: Promise<void>
}

/** Own the worker pool until solving and disposal have both finished. */
export async function runThreadedAutorouter(
  solver: AutoroutingPipelineSolver9_PreloadedTraceGraph,
  workerCount: number,
  run: ThreadedAutoroutingRun,
  onProgress: (progress: Omit<AutorouterProgressEvent, "steps">) => void,
): Promise<"inline" | "complete" | "stopped"> {
  let progressTimer: ReturnType<typeof setInterval> | undefined
  let progressError: unknown
  let progressThrew = false
  try {
    const runtime = await createAutorouterRuntime(workerCount)
    run.runtime = runtime
    if (run.stopped) return "stopped"
    if (!runtime) return "inline"

    let previousIterations = solver.iterations
    let previousTime = performance.now()
    progressTimer = setInterval(() => {
      if (run.stopped || progressThrew) return
      const now = performance.now()
      try {
        onProgress({
          type: "progress",
          iterationsPerSecond:
            ((solver.iterations - previousIterations) / (now - previousTime)) *
            1000,
          progress: solver.progress,
          phase: solver.getCurrentPhase(),
          debugGraphics: solver.preview() || undefined,
        })
        previousIterations = solver.iterations
        previousTime = now
      } catch (error) {
        progressThrew = true
        progressError = error
        run.disposal ??= runtime.dispose()
        // The solve below observes disposal and owns the resulting failure.
        void run.disposal.catch(() => {})
      }
    }, 250)
    try {
      await solver.solveAsync(runtime)
    } catch (error) {
      throw progressThrew ? progressError : error
    }
    if (progressThrew) throw progressError
    if (run.stopped) return "stopped"
    if (!solver.solved && !solver.failed) {
      throw new Error("Asynchronous autorouting did not finish")
    }
    return "complete"
  } finally {
    if (progressTimer !== undefined) clearInterval(progressTimer)
    if (run.runtime) {
      run.disposal ??= run.runtime.dispose()
      await run.disposal
    }
  }
}
