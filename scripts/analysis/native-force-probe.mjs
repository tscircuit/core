import { writeFileSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { gunzipSync } from "node:zlib"
import { AutoroutingPipelineSolver9_PreloadedTraceGraph as Pipeline } from "@tscircuit/capacity-autorouter"

const phases = []
const observed = new WeakMap()
const pipelines = []
const fixture = JSON.parse(gunzipSync(readFileSync(join(process.cwd(), "node_modules/@tscircuit/core-ddr-benchmark/circuits", process.env.CIRCUIT + ".json.gz"))))
const clearance = fixture.rules.appliedGlobalClearance
const output = join(process.cwd(), "native-force-diagnostics.json")

function getVias(route) {
  const vias = []
  const points = route.route
  for (let index = 0; index + 1 < points.length; index++) {
    const start = points[index]
    const end = points[index + 1]
    if (start.z === end.z) continue
    if (Math.hypot(start.x - end.x, start.y - end.y) >= 0.01) continue
    const previous = vias.at(-1)
    if (previous && previous.x === start.x && previous.y === start.y) {
      previous.minZ = Math.min(previous.minZ, start.z, end.z)
      previous.maxZ = Math.max(previous.maxZ, start.z, end.z)
      continue
    }
    vias.push({ x: start.x, y: start.y, minZ: Math.min(start.z, end.z), maxZ: Math.max(start.z, end.z), protected: index <= 1 || index + 1 >= points.length - 2 })
  }
  return vias
}

function inspectForce(pipeline) {
  const force = pipeline.highDensityForceImproveSolver
  const fixedVias = []
  for (const route of force.fixedHdRoutes) {
    for (const via of getVias(route)) {
      fixedVias.push({ ...via, radius: route.viaDiameter / 2, root: route.rootConnectionName ?? route.connectionName })
    }
  }
  const result = { fixedRoutes: force.fixedHdRoutes.length, fixedVias: fixedVias.length, improvedRoutes: force.improvedRoutesByIndex.size, protectedViasMoved: 0, newlyWorsenedFixedViaClearances: 0, originalFixedViaConflicts: 0, improvedFixedViaConflicts: 0, changedViaCounts: 0 }
  for (const [index, improved] of force.improvedRoutesByIndex) {
    const original = force.originalHdRoutes[index]
    const before = getVias(original)
    const after = getVias(improved)
    if (before.length !== after.length) { result.changedViaCounts++; continue }
    const root = original.rootConnectionName ?? original.connectionName
    for (let viaIndex = 0; viaIndex < before.length; viaIndex++) {
      const start = before[viaIndex]
      const end = after[viaIndex]
      if (!start.protected) continue
      const moved = Math.hypot(start.x - end.x, start.y - end.y) > 1e-6
      if (moved) result.protectedViasMoved++
      for (const fixed of fixedVias) {
        if (fixed.root === root || fixed.minZ > start.maxZ || fixed.maxZ < start.minZ) continue
        const required = original.viaDiameter / 2 + fixed.radius + clearance
        const oldDistance = Math.hypot(start.x - fixed.x, start.y - fixed.y)
        const newDistance = Math.hypot(end.x - fixed.x, end.y - fixed.y)
        if (oldDistance < required - 1e-6) result.originalFixedViaConflicts++
        if (newDistance < required - 1e-6) result.improvedFixedViaConflicts++
        if (moved && newDistance < required - 1e-6 && newDistance < oldDistance - 1e-6) result.newlyWorsenedFixedViaClearances++
      }
    }
  }
  return result
}

function save() {
  for (let index = 0; index < phases.length; index++) {
    const pipeline = pipelines[index].deref()
    if (!pipeline) continue
    const phase = phases[index]
    phase.forceConstructed = Boolean(pipeline.highDensityForceImproveSolver)
    phase.solved = pipeline.solved
    phase.failed = pipeline.failed
    phase.stages = []
    for (const definition of pipeline.pipelineDef) {
      const solver = pipeline[definition.solverName]
      if (!solver) continue
      phase.stages.push({ name: definition.solverName, solved: solver.solved, failed: solver.failed, iterations: solver.iterations, maxIterations: solver.MAX_ITERATIONS })
    }
    phase.lastStage = phase.stages.at(-1)?.name
  }
  const counters = phases.map(phase => ({
    inputConnections: Number(phase.connections),
    fixedInputTraces: Number(phase.fixedInputTraces),
    phaseSolved: Boolean(phase.solved),
    phaseFailed: Boolean(phase.failed),
    forceConstructed: Boolean(phase.forceConstructed),
    forceCompleted: Boolean(phase.force),
    highDensityRouteFailed: Boolean(phase.stages?.some(stage => stage.name === "highDensityRouteSolver" && stage.failed)),
    portPathingFailed: Boolean(phase.stages?.some(stage => stage.name === "portPointPathingSolver" && stage.failed)),
    jointRepairFailed: Boolean(phase.stages?.some(stage => stage.name === "pipeline9JointDrcRepairSolver" && stage.failed)),
    fixedRoutesInForce: Number(phase.force?.fixedRoutes ?? 0),
    fixedViasInForce: Number(phase.force?.fixedVias ?? 0),
    improvedRoutes: Number(phase.force?.improvedRoutes ?? 0),
    protectedViasMoved: Number(phase.force?.protectedViasMoved ?? 0),
    newlyWorsenedFixedViaClearances: Number(phase.force?.newlyWorsenedFixedViaClearances ?? 0),
    originalFixedViaConflicts: Number(phase.force?.originalFixedViaConflicts ?? 0),
    improvedFixedViaConflicts: Number(phase.force?.improvedFixedViaConflicts ?? 0),
    changedViaCounts: Number(phase.force?.changedViaCounts ?? 0)
  }))
  const serialized = JSON.stringify({ counters }, (key, value) => {
    if (typeof value === "string") throw new Error("Diagnostic values must be numeric or boolean")
    return value
  }, 2)
  writeFileSync(output, serialized)
}

const originalStep = Pipeline.prototype._step
if (typeof originalStep !== "function") throw new Error("Published Pipeline9 has no step implementation")
Pipeline.prototype._step = function (...args) {
  let phase = observed.get(this)
  if (!phase) {
    phase = { connections: this.srj.connections.length, fixedInputTraces: this.srj.traces?.filter(trace => trace.isFixed === true).length ?? 0, solvedStages: [], force: null }
    observed.set(this, phase)
    phases.push(phase)
    pipelines.push(new WeakRef(this))
    for (const definition of this.pipelineDef) {
      const onSolved = definition.onSolved
      definition.onSolved = pipeline => {
        onSolved?.(pipeline)
        phase.solvedStages.push(definition.solverName)
        if (definition.solverName === "highDensityForceImproveSolver") phase.force = inspectForce(pipeline)
        save()
      }
    }
  }
  const result = originalStep.apply(this, args)
  if ((this.solved || this.failed) && phase && !phase.finished) {
    phase.finished = true
    phase.solved = this.solved
    phase.failed = this.failed
    phase.stages = []
    for (const definition of this.pipelineDef) {
      const solver = this[definition.solverName]
      if (!solver) continue
      phase.stages.push({ name: definition.solverName, solved: solver.solved, failed: solver.failed, iterations: solver.iterations, maxIterations: solver.MAX_ITERATIONS })
    }
    phase.lastStage = phase.stages.at(-1)?.name
    save()
  }
  return result
}
process.on("exit", save)
