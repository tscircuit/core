import {readFileSync,writeFileSync,mkdirSync} from "node:fs"
import {gzipSync} from "node:zlib"
import {AutoroutingPipelineSolver9_PreloadedTraceGraph,Pipeline9HighDensitySolver} from "@tscircuit/capacity-autorouter"
const hd:any=Pipeline9HighDensitySolver.prototype
const oldStart=hd.startRegionalFallback
let current:any
hd.startRegionalFallback=function(...args:any[]) {
 oldStart.apply(this,args)
 const child:any=this.activeFallbackSolver
 current={params:child.params,attempts:[]}
 const oldValidate=child.validateCandidateRoutes
 child.validateCandidateRoutes=function(routes:any[]) {
  const passed=oldValidate.call(this,routes)
  if(current.attempts.length<80) current.attempts.push({passed,routes:structuredClone(routes)})
  return passed
 }
}
const input=JSON.parse(readFileSync("native/glider/phase-3-start.srj.json","utf8"))
const solver=new AutoroutingPipelineSolver9_PreloadedTraceGraph(input,{cacheProvider:null})
while(!solver.failed&&!solver.solved) solver.step()
mkdirSync("region-probe",{recursive:true})
writeFileSync("region-probe/glider.json.gz",gzipSync(JSON.stringify({failed:solver.failed,error:solver.error,current,hdStats:solver.highDensityRouteSolver?.stats})))
console.log("REGION_PROBE",solver.failed,solver.error,current?.attempts.map((p:any)=>p.passed))
