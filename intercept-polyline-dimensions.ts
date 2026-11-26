import { join } from "node:path"
const router = await import(join(process.cwd(), "node_modules/@tscircuit/capacity-autorouter/dist/index.js"))
const Constructor = router.PortfolioSingleIntraNodeSolver
if (!Constructor) throw new Error("Portfolio export missing")
const generate = Constructor.prototype.generateSolver
let calls = 0
let mismatches = 0
Constructor.prototype.generateSolver = function (parameters: unknown) {
  const result = generate.call(this, parameters)
  if (!result.hyperParameters?.MULTI_HEAD_POLYLINE_SOLVER) return result
  calls++
  const requested = this.constructorParams
  if ((requested.traceWidth !== undefined && requested.traceWidth !== result.traceWidth) ||
      (requested.obstacleMargin !== undefined && requested.obstacleMargin !== result.obstacleMargin)) mismatches++
  if (calls <= 3 || calls % 100 === 0) console.log("POLYLINE_DIMENSIONS=" + JSON.stringify({calls,mismatches,requestedWidth:requested.traceWidth,actualWidth:result.traceWidth,requestedClearance:requested.obstacleMargin,actualClearance:result.obstacleMargin,node:this.nodeWithPortPoints.capacityMeshNodeId,portCount:this.nodeWithPortPoints.portPoints.length}))
  return result
}
