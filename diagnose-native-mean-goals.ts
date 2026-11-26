// Diagnostic interception only. Apply the original KiCad mean goals directly
// to the existing solver, preserving the benchmark inputs, phases and budget.
import {join} from 'node:path'
import {readFileSync} from 'node:fs'
const root=process.cwd()
const bus=await import(join(root,'node_modules/@tscircuit/bus-lanes-solver/dist/index.js'))
const source=JSON.parse(readFileSync(join(root,'node_modules/@tscircuit/core-ddr-benchmark/circuits/ddr-constraints.json'),'utf8'))
const goals=new Map(source.h616.constraints.filter(c=>c.skewReference==='mean'&&!c.assessmentOnly&&(c.severity??'error')==='error').map(c=>[c.name,c.maxLengthSkew]))
const seen=new WeakSet<object>()
const step=bus.BusLanesPipelineSolver.prototype.step
bus.BusLanesPipelineSolver.prototype.step=function(...args:unknown[]){
 if(!seen.has(this)){
  seen.add(this)
  if(this.input?.connections?.length<=4){
   const connections=this.input.connections
   const summarizeConnection=(c:any)=>({terminals:c.pointsToConnect.length,layers:c.pointsToConnect.map((p:any)=>p.layer),handoffs:c.pointsToConnect.map((p:any)=>p.layers?.length??0)})
   console.log("SMALL_REQUEST="+JSON.stringify({connections:connections.map(summarizeConnection),sharedPorts:connections.map((c:any)=>connections.map((other:any)=>c.pointsToConnect.filter((p:any)=>p.pcb_port_id&&other.pointsToConnect.some((q:any)=>q.pcb_port_id===p.pcb_port_id)).length)),buses:this.input.buses?.map((b:any)=>({members:b.connectionNames.length,selectedPaths:b.lengthMatchingPaths?.length??0,min:b.minLength,max:b.maxLength,skew:b.maxLengthSkew})),fixed:this.input.traces?.length}))
  }
  for(const input of new Set([this.input,this.routingInput])){
   if(!input?.buses)continue
   input.buses=input.buses.map(b=>goals.has(b.busId)?{...b,skewReference:'mean',maxLengthSkew:goals.get(b.busId)}:b)
  }
 }
 const value=step.apply(this,args)
 if(this.input?.connections?.length<=2){
  const key=JSON.stringify({phase:this.phase,childPhase:this.child?.phase,childFailure:this.child?.failureCode,failed:this.failed,code:this.failureCode,canNegotiate:this.canNegotiateGeneratedSites})
  if(key!==this.__clockPhase){this.__clockPhase=key;console.log("CLOCK_PHASE="+JSON.stringify({terminals:this.input.connections.map(c=>c.pointsToConnect.length),...JSON.parse(key),iteration:this.iterations}))}
 }
 if(this.failed&&!this.__failureDiagnosticReported){this.__failureDiagnosticReported=true;console.log("SOLVER_FAILURE="+JSON.stringify({connections:this.input?.connections?.length,phase:this.phase,code:this.failureCode,childCode:this.child?.failureCode}))}
 return value
}
