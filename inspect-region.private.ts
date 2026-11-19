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
const pp:any=solver.portPointPathingSolver
const tiny:any=pp.tinyPipelineSolver.getSolvedTinySolver()
const nodes=pp.getOutput().nodesWithPortPoints
const endpointChecks=current.params.nodeWithPortPoints.portPoints.map((point:any)=>{
 const candidates=tiny.topology.portMetadata.map((metadata:any,index:number)=>({metadata,index})).filter(({metadata}:any)=>metadata.portId===point.portPointId||metadata.serializedPortId===point.portPointId)
 return {point,candidates:candidates.map(({metadata,index}:any)=>({metadata,index,reservation:tiny.problem.portReservationNetId?.[index],endpointReservation:tiny.problemSetup.portEndpointReservationNetId[index],x:tiny.topology.portX[index],y:tiny.topology.portY[index],z:tiny.topology.portZ[index]}))}
})
const beforeUniform=nodes.find((node:any)=>node.capacityMeshNodeId===current.params.nodeWithPortPoints.capacityMeshNodeId)
writeFileSync("region-probe/glider.json.gz",gzipSync(JSON.stringify({failed:solver.failed,error:solver.error,current,hdStats:solver.highDensityRouteSolver?.stats,endpointChecks,beforeUniform,reservedPortCount:tiny.problem.portReservationNetId?.filter((net:number)=>net!==-1).length,routeMetadata:tiny.problem.routeMetadata,routeNet:[...tiny.problem.routeNet]})))
writeFileSync("region-probe/glider.srj.json.gz",gzipSync(JSON.stringify(input)))
console.log("REGION_PROBE",solver.failed,solver.error,current?.attempts.map((p:any)=>p.passed))
