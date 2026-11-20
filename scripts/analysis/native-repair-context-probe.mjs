import {writeFileSync} from "node:fs"
import {AutoroutingPipelineSolver9_PreloadedTraceGraph as Pipeline} from "@tscircuit/capacity-autorouter"
import {checkEachPcbTraceNonOverlapping} from "@tscircuit/checks"

const phases = []
const observed = new WeakSet()
const stageKeys = ["highDensityRouteSolver","highDensityForceImproveSolver","highDensityRepairSolver","highDensityStitchSolver","traceSimplificationSolver","traceWidthSolver","globalDrcForceImproveSolver","pipeline9JointDrcRepairSolver","effortCleanupSolver"]
function overlaps(pipeline, routes) {
 const fixed = pipeline.highDensityRouteSolver.getUpdatedFixedHdRoutes().filter(route => route.isFixed === true)
 const circuit = []
 for (const [index, route] of [...fixed, ...routes].entries()) {
  const name = route.rootConnectionName ?? route.connectionName
  const root = pipeline.connMap.getNetConnectedToId(route.connectionName) ?? pipeline.connMap.getNetConnectedToId(name) ?? name
  const sourceId = "net-" + root
  if (!circuit.some(part => part.type === "source_trace" && part.source_trace_id === sourceId))
   circuit.push({type:"source_trace",source_trace_id:sourceId,connected_source_port_ids:[],source_net_id:sourceId})
  circuit.push({type:"pcb_trace",pcb_trace_id:"trace-"+index,source_trace_id:sourceId,route:route.route.map(point => ({route_type:"wire",x:point.x,y:point.y,width:point.traceThickness??route.traceThickness,layer:point.z===0?"top":point.z===pipeline.srj.layerCount-1?"bottom":"inner"+point.z}))})
 }
 const errors=checkEachPcbTraceNonOverlapping(circuit,{minClearance:0}).filter(error=>error.type.endsWith("_error"))
 const fixedIds=new Set(fixed.map((_,index)=>"trace-"+index))
 return {fixedPaths:fixed.length,newPaths:routes.length,allTraceContacts:errors.length,fixedTraceContacts:errors.filter(error => error.pcb_trace_ids?.some(id=>fixedIds.has(id)) && error.pcb_trace_ids?.some(id=>!fixedIds.has(id))).length}
}
function save() {
 writeFileSync("native-repair-diagnostics.json",JSON.stringify({phases},(key,value)=>{
  if(typeof value==="string")throw Error("Only numeric or boolean diagnostics are exported")
  return value
 },2))
}
const step=Pipeline.prototype._step
Pipeline.prototype._step=function(...args) {
 if(!observed.has(this)) {
  observed.add(this)
  const phase={connections:this.srj.connections.length,fixedInputTraces:this.srj.traces?.filter(trace=>trace.isFixed===true).length??0,stages:Array(stageKeys.length).fill(null),done:false,failed:false}
  phases.push(phase)
  for(const definition of this.pipelineDef) {
   if(definition.solverName==="highDensityRepairSolver" && process.env.REPAIR_CONTEXT==="1") {
    const params=definition.getConstructorParams
    definition.getConstructorParams=pipeline=>{
     const result=params(pipeline)
     result[0].fixedHdRoutes=pipeline.highDensityRouteSolver.getUpdatedFixedHdRoutes().filter(route=>route.isFixed===true)
     return result
    }
   }
   const onSolved=definition.onSolved
   definition.onSolved=pipeline=>{
    onSolved?.(pipeline)
    const index=stageKeys.indexOf(definition.solverName)
    if(index<0)return
    const solver=pipeline[definition.solverName]
    let routes
    if(index===0)routes=solver.routes
    else if(index===3)routes=solver.mergedHdRoutes
    else if(index===4)routes=solver.simplifiedHdRoutes
    else if(index===5)routes=solver.getHdRoutesWithWidths()
    else routes=solver.getOutput()
    phase.stages[index]=overlaps(pipeline,routes)
    save()
   }
  }
 }
 const result=step.apply(this,args)
 const phase=phases.at(-1)
 phase.done=Boolean(this.solved)
 phase.failed=Boolean(this.failed)
 if(this.solved||this.failed)save()
 return result
}
process.on("exit",save)
