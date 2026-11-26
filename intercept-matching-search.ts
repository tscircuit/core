import { join } from "node:path"
import { startSamplingProfiler, samplingProfilerStackTraces } from "bun:jsc"
const bus = await import(join(process.cwd(), "node_modules/@tscircuit/bus-lanes-solver/dist/index.js"))
const step = bus.BusLanesPipelineSolver.prototype.step
let started = false
let nextReport = 0
bus.BusLanesPipelineSolver.prototype.step = function (...args: unknown[]) {
  const hasTiming = this.input?.buses?.some((b: any) => b.minLength !== undefined || b.maxLengthSkew !== undefined) || this.routingInput?.buses?.some((b: any) => b.minLength !== undefined || b.maxLengthSkew !== undefined)
  if (hasTiming && !started) {
    started = true
    startSamplingProfiler()
    nextReport = performance.now() + 5000
  }
  const result = step.apply(this, args)
  if (started && performance.now() >= nextReport) {
    nextReport = performance.now() + 5000
    const sampled = samplingProfilerStackTraces()
    const counts = new Map<string, number>()
    for (const sample of sampled.traces) {
      const frame = sample.frames[0]
      if (!frame) continue
      const key = `${frame.name}:${frame.sourceURL}:${frame.line}:${frame.column}`
      counts.set(key, (counts.get(key) ?? 0) + 1)
    }
    console.log("MATCH_SEARCH_PROFILE=" + JSON.stringify({phase:this.phase,childPhase:this.child?.phase,iterations:this.iterations,stats:this.stats,samples:sampled.traces.length,frames:[...counts].sort((a,b)=>b[1]-a[1]).slice(0,15)}))
  }
  return result
}
