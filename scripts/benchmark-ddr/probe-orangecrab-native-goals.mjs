import { readFileSync, writeFileSync, mkdirSync } from "node:fs"
import { join } from "node:path"
import { gunzipSync } from "node:zlib"

const [corePath, output, mode] = process.argv.slice(2)
mkdirSync(output, { recursive: true })
const benchmark = join(corePath, "node_modules/@tscircuit/core-ddr-benchmark")
const { RootCircuit } = await import(join(corePath, "index.ts"))
const { NativeDdrBoard } = await import(join(benchmark, "circuits/native-ddr-board.tsx"))
const { getDdrRoutingBuses, getDdrReference } = await import(join(benchmark, "circuits/ddr-constraints.ts"))
const { getDdrSkewGroups, getDdrNetEndpoints } = await import(join(benchmark, "circuits/ddr-signals.ts"))
const { Children, createElement, cloneElement, Fragment } = await import(join(corePath, "node_modules/react/index.js"))
const { BusLanesPipelineSolver } = await import(join(corePath, "node_modules/@tscircuit/bus-lanes-solver/dist/index.js"))
const profile = { visualizations: 0, visualizationMs: 0, phases: {} }
const originalVisualize = BusLanesPipelineSolver.prototype.visualize
BusLanesPipelineSolver.prototype.visualize = function () {
  const start = performance.now()
  try { return originalVisualize.call(this) }
  finally { profile.visualizations++; profile.visualizationMs += performance.now() - start }
}
const originalStep = BusLanesPipelineSolver.prototype._step
BusLanesPipelineSolver.prototype._step = function () {
  const phase = this.phase
  const start = performance.now()
  try { return originalStep.call(this) }
  finally { profile.phases[phase] = (profile.phases[phase] ?? 0) + performance.now() - start }
}
const source = JSON.parse(gunzipSync(readFileSync(join(benchmark, "circuits/orangecrab.json.gz"))).toString())
const sourceBefore = JSON.stringify(source)
const dataNames = new Set(getDdrSkewGroups(source).filter(group => / byte[01]$/.test(group.name)).flatMap(group => group.signals.map(signal => signal.name)))
const timingName = trace => `DDR_TIMING_${trace.name}`
const selector = trace => trace.path.length > 2 ? timingName(trace) : getDdrNetEndpoints(source, trace)[0]
const traceForNet = net => {
  const trace = source.traces.find(trace => trace.nativeNet === net)
  if (!trace) throw Error(`Unknown native signal ${net}`)
  return trace
}
const phaseForTrace = trace => dataNames.has(trace.nativeNet) ? 0 : 1
const buses = getDdrRoutingBuses(source).map(({ group, ...bus }) => bus)
const targets = getDdrReference(source.id).constraints
for (const target of targets) {
  if ((target.severity ?? "error") !== "error" || target.maxLengthSkew === undefined) throw Error("Unexpected OrangeCrab timing requirement")
  if (target.skewReference && target.skewReference !== "references") throw Error("Unsupported timing comparison")
  if (buses.some(bus => bus.name === target.name)) continue
  const references = target.referenceNets ?? []
  const members = target.nets.filter(net => !references.includes(net))
  const bus = {
    name: target.name,
    connections: members.map(net => selector(traceForNet(net))),
    maxLengthSkew: target.maxLengthSkew,
  }
  if (references.length) bus.lengthMatchTo = references.map(net => selector(traceForNet(net)))
  buses.push(bus)
}
const resolveSelector = connection => {
  const trace = source.traces.find(trace => trace.path.includes(connection) || timingName(trace) === connection)
  if (!trace) throw Error(`Unresolved timing selector ${connection}`)
  return trace
}
const stagedBuses = buses.map(bus => {
  const members = [...bus.connections, ...(bus.lengthMatchTo ?? [])].map(resolveSelector)
  const phases = new Set(members.map(phaseForTrace))
  if (phases.size !== 1) throw Error("Unexpected data/control timing dependency")
  return { ...bus, routingPhaseIndex: phaseForTrace(members[0]), pcbAllowedLayers: source.signalLayers }
})
const original = NativeDdrBoard({ source, matchLengths: true })
const originalChildren = Children.toArray(original.props.children)
const physicalChildren = originalChildren.filter(child => !["bus", "net", "autoroutingphase"].includes(child.type))
const nets = source.traces.map(trace => {
  const originalNet = originalChildren.find(child => child.type === "net" && child.props.name === trace.name)
  if (!originalNet) throw Error("Native net disappeared")
  const props = { routingPhaseIndex: phaseForTrace(trace) }
  if (trace.path.length > 2) {
    const endpoints = getDdrNetEndpoints(source, trace)
    props.connectsTo = trace.path.filter(port => !endpoints.includes(port))
  }
  return cloneElement(originalNet, props)
})
const timingTraces = source.traces.filter(trace => trace.path.length > 2).map(trace => {
  const [from, to] = getDdrNetEndpoints(source, trace)
  return createElement("trace", { key: timingName(trace), name: timingName(trace), path: [from, to, `net.${trace.name}`], routingPhaseIndex: phaseForTrace(trace) })
})
const phases = [0, 1].map(phaseIndex => createElement("autoroutingphase", {
  key: `native_goal_phase_${phaseIndex}`,
  name: `native_goal_phase_${phaseIndex}`,
  phaseIndex,
  autorouter: "bus_lanes",
  connections: source.traces.filter(trace => phaseForTrace(trace) === phaseIndex).flatMap(trace => trace.path),
}))
let routingChildren = [...nets, ...timingTraces]
if (mode === "interleaved") routingChildren = nets.map(net => createElement(Fragment, { key: net.props.name }, net,
  timingTraces.find(trace => trace.props.name === `DDR_TIMING_${net.props.name}`)))
const board = cloneElement(original, {}, ...physicalChildren, ...phases, ...routingChildren,
  ...stagedBuses.map(bus => createElement("bus", { key: bus.name, ...bus })))
const circuit = new RootCircuit()
const started = performance.now()
const progress = { renderCompleted: false, renderMs: null, phases: [], errors: [], profile }
const save = () => {
  writeFileSync(join(output, "progress.json"), JSON.stringify(progress))
  writeFileSync(join(output, "circuit.json"), JSON.stringify(circuit.getCircuitJson()))
}
for (const eventName of ["autorouting:start", "autorouting:end", "autorouting:error"]) {
  circuit.on(eventName, event => {
    if (eventName === "autorouting:start") {
      progress.phases.push({ phase: event.phaseName, status: "running", startedMs: performance.now() - started, durationMs: null, connections: event.simpleRouteJson.connections.length })
    } else {
      const active = progress.phases.findLast(phase => phase.status === "running")
      active.status = eventName === "autorouting:end" ? "completed" : "failed"
      active.durationMs = performance.now() - started - active.startedMs
      if (eventName === "autorouting:error") progress.errors.push(event.error?.message)
    }
    if (event.simpleRouteJson) writeFileSync(join(output, `phase-${progress.phases.length}-${eventName.split(":")[1]}.srj.json`), JSON.stringify(event.simpleRouteJson))
    save()
  })
}
circuit.add(board)
try {
  await circuit.renderUntilSettled()
  progress.renderCompleted = true
} catch (error) {
  progress.errors.push(String(error))
}
progress.renderMs = performance.now() - started
if (JSON.stringify(source) !== sourceBefore) throw Error("Native fixture mutated")
save()
console.log(JSON.stringify(progress))
