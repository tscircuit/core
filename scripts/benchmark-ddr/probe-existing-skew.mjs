import { readFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
const [coreRoot, resultsRoot, mode] = process.argv.slice(2)
const modulePath = Bun.resolveSync('@tscircuit/bus-lanes-solver', coreRoot)
const { BusLanesPipelineSolver, BusLanesSolver, busLengthReports, pairLengthReports } = await import(pathToFileURL(modulePath).href)
const { getBusLanesInputFromSrj } = await import(pathToFileURL(resolve(coreRoot,'lib/utils/autorouting/get-bus-lanes-input-from-srj.ts')).href)
const matchingRoot = resolve(resultsRoot,'h616/attempts/matching')
const startFile = readdirSync(matchingRoot).find(name => /^phase-1-start\.srj\.json$/.test(name))
if (!startFile) throw Error('Missing captured constrained byte phase')
const input = getBusLanesInputFromSrj(JSON.parse(readFileSync(resolve(matchingRoot,startFile),'utf8')))
const summary = {mode,connections:input.connections.length,buses:input.buses,traceCount:input.traces?.length??0,modulePath}
let solver
if (mode === 'without_lengths') {
 const routing = structuredClone(input)
 routing.buses = routing.buses.map(({minLength,maxLength,maxLengthSkew,...bus})=>bus)
 solver = new BusLanesPipelineSolver(routing)
} else if (mode === 'constrained') {
 solver = new BusLanesPipelineSolver(input)
} else if (mode === 'refine_completed') {
 const routingRoot=resolve(resultsRoot,'h616/attempts/routing')
 const finalFile=readdirSync(routingRoot).filter(name=>/-end\.srj\.json$/.test(name)).sort((a,b)=>Number(a.split('-')[1])-Number(b.split('-')[1])).at(-1)
 const completed=JSON.parse(readFileSync(resolve(routingRoot,finalFile),'utf8'))
 const activeNames=new Set(input.connections.map(connection=>connection.name))
 const active=[]
 const fixed=[]
 for(const trace of completed.traces??[]) {
  const connection=input.connections.find(connection=>connection.name===trace.connection_name || connection.source_trace_id && connection.source_trace_id===trace.source_trace_id)
  if(connection)active.push({...trace,connection_name:connection.name})
  else fixed.push(trace)
 }
 summary.mapping={completed:completed.traces?.length,active:active.length,fixed:fixed.length,distinctActive:new Set(active.map(trace=>trace.connection_name)).size,requested:activeNames.size}
 if(active.length!==activeNames.size || new Set(active.map(trace=>trace.connection_name)).size!==activeNames.size){console.log('SKEW_PROBE='+JSON.stringify({...summary,available:false,reason:'Completed copper does not map one-to-one to constrained paths'}));process.exit(0)}
 if(typeof BusLanesSolver.forRefinement!=='function')throw Error('Published solver has no existing refinement API')
 solver=BusLanesSolver.forRefinement({...input,traces:[...(input.traces??[]),...fixed]},active)
} else throw Error('Unknown diagnostic mode')
const started=performance.now()
solver.solve()
const traces=solver.traces??[]
console.log('SKEW_PROBE='+JSON.stringify({...summary,available:true,seconds:(performance.now()-started)/1000,solved:solver.solved,failed:solver.failed,error:solver.error,phase:solver.phase,iterations:solver.iterations,stats:solver.stats,busReports:busLengthReports(input,traces),pairReports:pairLengthReports(input,traces),child:solver.child?{phase:solver.child.phase,error:solver.child.error,failureCode:solver.child.failureCode,iterations:solver.child.iterations,stats:solver.child.stats}:null}))
