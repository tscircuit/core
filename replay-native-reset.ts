import { readFileSync } from 'node:fs'
import { AutoroutingPipelineSolver9_PreloadedTraceGraph as Router } from './lib/autorouter-pipelines/AutoroutingPipeline9_PreloadedTraceGraph/AutoroutingPipelineSolver9_PreloadedTraceGraph'
const input=JSON.parse(readFileSync('../private-native-reset.json','utf8'))
for(const strategy of ['normal','node-routing']) {
 const solver=new Router(structuredClone(input));const start=performance.now();let initial:any
 while(!solver.solved&&!solver.failed&&performance.now()-start<90000){
  solver.step()
  const hd=solver.highDensityRouteSolver as any
  if(strategy==='node-routing'&&hd&&!hd.iterations)hd.bgaEscapeAttempt=undefined
  const joint=solver.pipeline9JointDrcRepairSolver as any
  if(joint&&!initial){
   const result=joint.cachedReferenceDrcEvaluator?.({routes:joint.inputNewHdRoutes})
   const errors=Array.isArray(result)?result:result?.errors??[]
   initial=Object.fromEntries([...new Set(errors.map((e:any)=>e.type))].map(type=>[type,errors.filter((e:any)=>e.type===type).length]))
  }
 }
 const joint=solver.pipeline9JointDrcRepairSolver as any
 const output=joint?.getOutput()
 const result=output&&joint.cachedReferenceDrcEvaluator?.({routes:output})
 const errors=Array.isArray(result)?result:result?.errors??[]
 console.log('RESET_REPLAY='+JSON.stringify({strategy,solved:solver.solved,failed:solver.failed,ms:performance.now()-start,fixed:input.traces.filter((t:any)=>t.isFixed).length,traces:input.traces.length,initial,final:errors.length,hdStats:solver.highDensityRouteSolver?.stats}))
}
