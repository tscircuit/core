import type { AnyCircuitElement, CadComponent } from "circuit-json"
import { mat3, mat4, vec3 } from "gl-matrix"
import type { RootCircuit } from "lib/RootCircuit"
import type { PrimitiveComponent } from "lib/components/base-components/PrimitiveComponent"
import { AssemblyExplosionStage } from "lib/components/primitive-components/AssemblyExplosionStage"
import type { AssemblyExplosionMove } from "lib/components/primitive-components/AssemblyExplosionMove"
import {
  isPositionedAssembly,
  resolveAssemblyPlacement,
} from "lib/components/primitive-components/resolve-assembly-placement"

export type AssemblyExplosionStageRef = string
type SourceComponentId = CadComponent["source_component_id"]
type AssemblyWorldPoint = CadComponent["position"]

/** Right-handed circuit-world XYZ, +X right, +Y top, +Z above, millimeters.
 * Vertices are points. Rendering adapters must explicitly convert scene frames.
 */
export interface AssemblyExplosionLine {
  stageRef: AssemblyExplosionStageRef
  targetRef: string
  points: AssemblyWorldPoint[]
}

export interface AssemblyExplosionOptions {
  /** Inclusive qualified stage name, e.g. LAMP.remove-shade. Omit for all stages. */
  throughStageRef?: AssemblyExplosionStageRef
  /** Fraction of the selected stage's ordered moves, 0..1; defaults to 1. */
  stageProgress?: number
}

export interface AssemblyExplosionView {
  circuitJson: AnyCircuitElement[]
  stages: AssemblyExplosionStageRef[]
  lines: AssemblyExplosionLine[]
  /** This speculative view does not establish swept-path collision clearance. */
  collisionCheckStatus: "not_implemented"
}

const assemblyPath = (
  assembly: PrimitiveComponent,
): AssemblyExplosionStageRef => {
  const names: string[] = []
  let ancestor: PrimitiveComponent | null = assembly
  while (ancestor) {
    if (
      [
        "AssemblyDevice",
        "AssemblySubassembly",
        "AssemblyPart",
        "AssemblyPrintedPart",
        "AssemblyScreen",
        "AssemblyMotor",
      ].includes(ancestor.componentName)
    ) {
      names.unshift(ancestor.name || "unnamed assembly")
    }
    ancestor = ancestor.parent
  }
  return names.join(".")
}

/** Schedule precedence edges; depth-first authored order only breaks ties.
 * References are scoped to the stage owner or explicitly qualified from root.
 */
export const resolveAssemblyExplosionStages = (
  roots: readonly PrimitiveComponent[],
): AssemblyExplosionStage[] => {
  const stages = roots
    .flatMap((root) => [root, ...root.getDescendants()])
    .filter(
      (part): part is AssemblyExplosionStage =>
        part instanceof AssemblyExplosionStage,
    )
  const stageRef = (stage: AssemblyExplosionStage) =>
    `${assemblyPath(stage.parent!)}.${stage.name}`
  const byRef = new Map<AssemblyExplosionStageRef, AssemblyExplosionStage>()
  for (const stage of stages) {
    const ref = stageRef(stage)
    if (byRef.has(ref)) throw new Error(`Duplicate explosion stage "${ref}"`)
    byRef.set(ref, stage)
  }
  const edges = new Map<AssemblyExplosionStage, Set<AssemblyExplosionStage>>()
  const indegrees = new Map(stages.map((stage) => [stage, 0]))
  for (const stage of stages) {
    for (const direction of ["prevStageRef", "nextStageRef"] as const) {
      const ref = stage._parsedProps[direction]
      if (!ref) continue
      const ownerPath = assemblyPath(stage.parent!)
      const resolved =
        byRef.get(`${ownerPath}.${ref}`) ??
        (ref.startsWith(`${ownerPath.split(".")[0]}.`)
          ? byRef.get(ref)
          : undefined)
      if (!resolved)
        throw new Error(
          `Explosion stage "${stageRef(stage)}" references unknown stage "${ref}"`,
        )
      const before = direction === "nextStageRef" ? stage : resolved
      const after = direction === "nextStageRef" ? resolved : stage
      const successors = edges.get(before) ?? new Set<AssemblyExplosionStage>()
      if (!successors.has(after)) {
        successors.add(after)
        edges.set(before, successors)
        indegrees.set(after, indegrees.get(after)! + 1)
      }
    }
  }
  const remaining = new Set(stages)
  const ordered: AssemblyExplosionStage[] = []
  while (remaining.size) {
    const eligible = stages.find(
      (stage) => remaining.has(stage) && indegrees.get(stage) === 0,
    )
    if (!eligible)
      throw new Error(
        `Explosion stage ordering cycle: ${[...remaining].map(stageRef).join(", ")}`,
      )
    remaining.delete(eligible)
    ordered.push(eligible)
    for (const successor of edges.get(eligible) ?? [])
      indegrees.set(successor, indegrees.get(successor)! - 1)
  }
  return ordered
}

const pointPlus = (
  point: AssemblyWorldPoint,
  offset: AssemblyWorldPoint,
): AssemblyWorldPoint => ({
  x: point.x + offset.x,
  y: point.y + offset.y,
  z: point.z + offset.z,
})
const zero = (): AssemblyWorldPoint => ({ x: 0, y: 0, z: 0 })

/** Derive a display view AFTER renderUntilSettled, from finalized mounting
 * constraints. CAD and reference-frame origins are circuit-world points (mm,
 * right-handed +Z up). Move offsets are owner-local directions, rotated without
 * translation. Never change authored props, PCB geometry, or assembled CAD.
 */
export function getAssemblyExplosion(
  circuit: RootCircuit,
  options: AssemblyExplosionOptions = {},
): AssemblyExplosionView {
  if (!circuit.firstChild?.renderPhaseStates.CadModelRender.initialized) {
    throw new Error("Render the assembly before evaluating explosion stages")
  }
  const progress = options.stageProgress ?? 1
  if (!Number.isFinite(progress) || progress < 0 || progress > 1)
    throw new Error("Explosion stage progress must be between 0 and 1")
  const ordered = resolveAssemblyExplosionStages(circuit.children)
  const stages = ordered.map(
    (stage) => `${assemblyPath(stage.parent!)}.${stage.name}`,
  )
  const stop =
    options.throughStageRef === undefined
      ? ordered.length - 1
      : stages.indexOf(options.throughStageRef)
  if (options.throughStageRef !== undefined && stop < 0)
    throw new Error(`Unknown explosion stage "${options.throughStageRef}"`)
  const assembled = circuit.getCircuitJson()
  const sourceOffsets = new Map<SourceComponentId, AssemblyWorldPoint>()
  const partOffsets = new Map<PrimitiveComponent, AssemblyWorldPoint>()
  const lines: AssemblyExplosionLine[] = []
  for (const [stageIndex, stage] of ordered.entries()) {
    const owner = stage.parent!
    for (const [moveIndex, instruction] of stage.children.entries()) {
      const move = instruction as AssemblyExplosionMove
      const targets = new Map<PrimitiveComponent, string>()
      // Resolve and validate the entire instruction before applying its shared
      // displacement, including stages later than the selected view.
      for (const targetRef of move._parsedProps.targetRefs) {
        let target = owner
        for (const segment of targetRef.split(".")) {
          const matches = target.children.filter(
            (part) =>
              part.name === segment &&
              [
                "AssemblyPart",
                "AssemblyPrintedPart",
                "AssemblySubassembly",
                "AssemblyScreen",
                "AssemblyMotor",
              ].includes(part.componentName),
          )
          if (matches.length !== 1)
            throw new Error(
              `Explosion stage "${stages[stageIndex]}" target "${targetRef}" matched ${matches.length} assembly parts; expected one`,
            )
          target = matches[0]
        }
        if (
          [target, ...target.getDescendants()].some(
            (part) =>
              part.pcb_component_id ||
              part.componentName === "Board" ||
              part.componentName === "AssemblyCable",
          )
        ) {
          throw new Error(
            `Explosion target "${targetRef}" includes PCB or cable geometry; this prototype moves mechanical CAD parts only`,
          )
        }
        if (!targets.has(target)) targets.set(target, targetRef)
      }
      if (stageIndex > stop) continue
      const fraction =
        stageIndex === stop
          ? Math.max(
              0,
              Math.min(1, progress * stage.children.length - moveIndex),
            )
          : 1
      if (!fraction) continue
      const placement = isPositionedAssembly(owner)
        ? resolveAssemblyPlacement(owner)
        : undefined
      const frame = placement?.worldTransform
        ? mat4.clone(placement.worldTransform)
        : mat4.create()
      if (placement && !placement.worldTransform) {
        mat4.rotateZ(frame, frame, (placement.pcbRotation * Math.PI) / 180)
        if (placement.layer === "bottom") mat4.rotateY(frame, frame, Math.PI)
      }
      const displacement = vec3.transformMat3(
        vec3.create(),
        [
          (move._parsedProps.offX ?? 0) * fraction,
          (move._parsedProps.offY ?? 0) * fraction,
          (move._parsedProps.offZ ?? 0) * fraction,
        ],
        mat3.fromMat4(mat3.create(), frame),
      )
      const offset = {
        x: displacement[0],
        y: displacement[1],
        z: displacement[2],
      }
      const movedParts = new Set<PrimitiveComponent>()
      for (const [target, targetRef] of targets) {
        const descendants = [target, ...target.getDescendants()]
        const targetCad = assembled.find(
          (cad): cad is CadComponent =>
            cad.type === "cad_component" &&
            cad.source_component_id === target.source_component_id,
        )
        // Model-less containers use the centroid of their emitted CAD origins for
        // guide placement. Motion frames still come from the constraint resolver.
        const targetSources = new Set(
          descendants.map((part) => part.source_component_id),
        )
        const descendantCad = assembled.filter(
          (cad): cad is CadComponent =>
            cad.type === "cad_component" &&
            targetSources.has(cad.source_component_id),
        )
        const currentCadPositions = descendantCad.map((cad) =>
          pointPlus(
            cad.position,
            sourceOffsets.get(cad.source_component_id) ?? zero(),
          ),
        )
        const centroid = currentCadPositions.length
          ? {
              x:
                currentCadPositions.reduce(
                  (sum, position) => sum + position.x,
                  0,
                ) / currentCadPositions.length,
              y:
                currentCadPositions.reduce(
                  (sum, position) => sum + position.y,
                  0,
                ) / currentCadPositions.length,
              z:
                currentCadPositions.reduce(
                  (sum, position) => sum + position.z,
                  0,
                ) / currentCadPositions.length,
            }
          : undefined
        const anchor =
          (targetCad
            ? pointPlus(
                targetCad.position,
                sourceOffsets.get(targetCad.source_component_id) ?? zero(),
              )
            : undefined) ??
          centroid ??
          (isPositionedAssembly(target)
            ? pointPlus(
                resolveAssemblyPlacement(target).position,
                partOffsets.get(target) ?? zero(),
              )
            : undefined)
        if (!anchor)
          throw new Error(
            `Explosion target "${targetRef}" has no resolved assembly pose`,
          )
        const from = anchor
        if (Math.hypot(offset.x, offset.y, offset.z) > 0)
          lines.push({
            stageRef: stages[stageIndex],
            targetRef,
            points: [from, pointPlus(from, offset)],
          })
        for (const part of descendants) movedParts.add(part)
      }
      const movedSources = new Set<SourceComponentId>()
      for (const part of movedParts) {
        partOffsets.set(
          part,
          pointPlus(partOffsets.get(part) ?? zero(), offset),
        )
        if (part.source_component_id) movedSources.add(part.source_component_id)
      }
      for (const sourceId of movedSources) {
        sourceOffsets.set(
          sourceId,
          pointPlus(sourceOffsets.get(sourceId) ?? zero(), offset),
        )
      }
    }
  }
  const circuitJson = structuredClone(assembled).map((record) => {
    if (
      record.type !== "cad_component" &&
      record.type !== "cad_reference_surface"
    )
      return record
    const offset = sourceOffsets.get(record.source_component_id)
    if (!offset) return record
    if (record.type === "cad_component")
      return { ...record, position: pointPlus(record.position, offset) }
    return { ...record, center: pointPlus(record.center, offset) }
  })
  return { circuitJson, stages, lines, collisionCheckStatus: "not_implemented" }
}
