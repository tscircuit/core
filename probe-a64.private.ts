import { readFileSync, writeFileSync, mkdirSync } from "node:fs"
import { gunzipSync } from "node:zlib"
import { AutoroutingPipelineSolver9_PreloadedTraceGraph, convertSrjToGraphicsObject } from "@tscircuit/capacity-autorouter"
import { getSvgFromGraphicsObject, stackGraphicsHorizontally } from "graphics-debug"
const label=process.argv[2]
const input=JSON.parse(gunzipSync(readFileSync("captured/"+label+"/remaining.srj.json.gz")).toString())
const solver=new AutoroutingPipelineSolver9_PreloadedTraceGraph(input,{cacheProvider:null})
const started=performance.now()
let initial:any
while(!solver.failed&&!solver.solved&&!initial?.solved&&!initial?.failed) {
 solver.step()
 const active=solver.portPointPathingSolver?.activeSubSolver
 if(!initial&&active?.problem?.routeCount!==undefined&&active?.state?.regionSegments) initial=active
 if(performance.now()-started>300000) throw Error("Initial probe exceeded 300 seconds")
}
mkdirSync("probe-results",{recursive:true})
const planned=initial ? new Set(initial.state.regionSegments.flatMap((segments:any)=>segments.map(([id]:any)=>id))).size : null
const metric={label,obstacles:input.obstacles.length,traces:input.traces?.length??0,preload:solver.preloadedTraceGraphSolver?.stats,planned,routeCount:initial?.problem.routeCount,initialSolved:initial?.solved,initialFailed:initial?.failed,error:initial?.error??solver.error,seconds:(performance.now()-started)/1000,memory:process.memoryUsage(),solverStats:solver.portPointPathingSolver?.stats}
writeFileSync("probe-results/"+label+".json",JSON.stringify(metric,null,2))
const graphics=convertSrjToGraphicsObject(input)
const plan=initial?.preview()
if(plan) {
 graphics.lines=[...(graphics.lines??[]),...(plan.lines??[])]
 graphics.circles=[...(graphics.circles??[]),...(plan.circles??[])]
}
writeFileSync("probe-results/"+label+".svg",getSvgFromGraphicsObject(stackGraphicsHorizontally([graphics],{titles:[label+" | "+planned+"/"+initial?.problem.routeCount+" paths planned"]}),{backgroundColor:"white"}))
console.log("A64_PROBE="+JSON.stringify(metric))
