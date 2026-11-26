import { gzipSync } from "node:zlib"
import { join } from "node:path"
const bus = await import(join(process.cwd(), "node_modules/@tscircuit/bus-lanes-solver/dist/index.js"))
const autorouter = await import(join(process.cwd(), "node_modules/@tscircuit/capacity-autorouter/dist/index.js"))
let matching = false
const busStep = bus.BusLanesPipelineSolver.prototype.step
bus.BusLanesPipelineSolver.prototype.step = function (...args: unknown[]) {
  matching ||= this.input?.buses?.some((b: any) => b.minLength !== undefined || b.maxLengthSkew !== undefined)
  return busStep.apply(this, args)
}
const captured = new WeakSet()
const reports = new WeakMap()
const routeStep = autorouter.AutoroutingPipelineSolver.prototype.step
autorouter.AutoroutingPipelineSolver.prototype.step = function (...args: unknown[]) {
  if (matching && !captured.has(this)) {
    captured.add(this)
    console.log("GLIDER_MATCHING_PENDING_INPUT=" + gzipSync(JSON.stringify(this.originalSrj)).toString("base64"))
  }
  const value = routeStep.apply(this, args)
  if (matching && performance.now() > (reports.get(this) ?? 0)) {
    reports.set(this, performance.now() + 3000)
    console.log("GLIDER_MATCHING_PENDING_STAGE=" + JSON.stringify({iterations:this.iterations,solved:this.solved,failed:this.failed,active:this.activeSubSolver?.constructor.name,activeIterations:this.activeSubSolver?.iterations,error:this.error,timeSpentOnPhase:this.timeSpentOnPhase}))
  }
  return value
}
