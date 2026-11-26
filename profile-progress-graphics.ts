import { join } from "node:path"
const bus = await import(join(process.cwd(), "node_modules/@tscircuit/bus-lanes-solver/dist/index.js"))
const ar = await import(join(process.cwd(), "node_modules/@tscircuit/capacity-autorouter/dist/index.js"))
const metrics = { busCalls: 0, busMs: 0, previewCalls: 0, previewMs: 0, graphicsElements: 0 }
const visualize = bus.BusLanesPipelineSolver.prototype.visualize
bus.BusLanesPipelineSolver.prototype.visualize = function (...args: unknown[]) {
  const start = performance.now()
  const result = visualize.apply(this, args)
  metrics.busCalls++
  metrics.busMs += performance.now() - start
  metrics.graphicsElements += (result.lines?.length ?? 0) + (result.rects?.length ?? 0) + (result.circles?.length ?? 0) + (result.points?.length ?? 0)
  return result
}
const preview = ar.AutoroutingPipelineSolver.prototype.preview
if (preview) {
  ar.AutoroutingPipelineSolver.prototype.preview = function (...args: unknown[]) {
    const start = performance.now()
    const result = preview.apply(this, args)
    metrics.previewCalls++
    metrics.previewMs += performance.now() - start
    return result
  }
}
setInterval(() => console.log("PROGRESS_GRAPHICS_PROFILE=" + JSON.stringify(metrics)), 5000).unref()
