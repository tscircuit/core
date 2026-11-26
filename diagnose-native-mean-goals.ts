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
  for(const input of new Set([this.input,this.routingInput])){
   if(!input?.buses)continue
   input.buses=input.buses.map(b=>goals.has(b.busId)?{...b,skewReference:'mean',maxLengthSkew:goals.get(b.busId)}:b)
  }
 }
 return step.apply(this,args)
}
