import {
  cad_explosion_collision_error,
  cad_explosion_collision_check_warning,
  type AnyCircuitElement,
  type CadComponent,
  type CadExplosionCollisionCheckWarning,
  type CadExplosionCollisionObstacle,
  type CadExplosionMove,
  type CadExplosionStage,
  type Point3,
} from "circuit-json"
import type { Manifold, ManifoldToplevel, Vec3 } from "@tscircuit/manifold-2d"
import {
  CadCollisionCheckingSolver,
  loadCollisionManifold,
  serializeCollisionMesh,
  type CollisionSolidId,
} from "@tscircuit/cad-collision-checking"
import { getCircuitJsonAssemblyExplosion } from "./get-circuit-json-assembly-explosion"
import {
  loadCadCollisionSolid,
  type CollisionModelLoadOptions,
} from "./collision/load-cad-collision-solid"
import { createBoardCollisionSolid } from "./collision/create-board-collision-solid"
import {
  applyGeometryStateToCadComponent,
  resolveComponentSelector,
  resolveExplosionGeometryStateTransitions,
} from "./resolve-explosion-geometry-states"
import type {
  AssemblyExplosionAnnotatedContact,
  AssemblyExplosionCollisionCheck,
  AssemblyExplosionPolicyOptions,
  AssemblyExplosionPolicyResult,
  CadExplosionContactAnnotation,
  CadExplosionContactRegion,
  ExplosionBoardId,
  ExplosionCadId,
  ExplosionCollisionSolid,
} from "./collision/types"

const getCollisionSolidId = (
  obstacle: ExplosionCollisionSolid["reference"],
): CollisionSolidId =>
  obstacle.type === "cad_component"
    ? `cad_component:${obstacle.cad_component_id}`
    : `pcb_board:${obstacle.pcb_board_id}`

interface ResolvedContactAnnotation {
  annotationId: string
  moveId: CadExplosionMove["cad_explosion_move_id"]
  movingCadId: ExplosionCadId
  obstacle: CadExplosionCollisionObstacle
  region: CadExplosionContactRegion
  progressRange?: readonly [number, number]
  maxSweptVolumeMm3?: number
  rationale: string
  operation?: string
}

function validateRegion(
  region: unknown,
  context: string,
): CadExplosionContactRegion {
  if (!region || typeof region !== "object") {
    throw new Error(
      `${context} requires a spatial contact region with min/max bounds`,
    )
  }
  const r = region as CadExplosionContactRegion
  const frame = r.frame ?? "world"
  if (frame !== "world" && frame !== "obstacle" && frame !== "moving") {
    throw new Error(
      `${context} has unsupported region frame "${String(frame)}"`,
    )
  }
  const min = r.min
  const max = r.max
  if (
    !min ||
    !max ||
    ![min.x, min.y, min.z, max.x, max.y, max.z].every(Number.isFinite) ||
    min.x >= max.x ||
    min.y >= max.y ||
    min.z >= max.z
  ) {
    throw new Error(
      `${context} region must have finite min < max bounds on all axes`,
    )
  }
  return {
    frame,
    min: { x: min.x, y: min.y, z: min.z },
    max: { x: max.x, y: max.y, z: max.z },
  }
}

function resolveContactAnnotations(params: {
  circuitJson: AnyCircuitElement[]
  stages: CadExplosionStage[]
  moves: CadExplosionMove[]
  cadById: Map<ExplosionCadId, CadComponent>
  boardIds: Set<ExplosionBoardId>
  sourceNameById: Map<string, string>
  extraAnnotations?: CadExplosionContactAnnotation[]
}): ResolvedContactAnnotation[] {
  const {
    circuitJson,
    stages,
    moves,
    cadById,
    boardIds,
    sourceNameById,
    extraAnnotations = [],
  } = params
  const stagesById = new Map(stages.map((s) => [s.cad_explosion_stage_id, s]))
  const movesById = new Map(moves.map((m) => [m.cad_explosion_move_id, m]))
  const movesByStageId = new Map<string, CadExplosionMove[]>()
  for (const m of moves) {
    const list = movesByStageId.get(m.cad_explosion_stage_id) ?? []
    list.push(m)
    movesByStageId.set(m.cad_explosion_stage_id, list)
  }
  for (const list of movesByStageId.values()) {
    list.sort((a, b) => a.order - b.order)
  }

  const rawAnnotations: {
    raw: CadExplosionContactAnnotation
    defaultMoveId?: string
    defaultStageId?: string
  }[] = []

  for (const record of circuitJson) {
    const raw = record as unknown as Record<string, unknown>
    if (raw.type === "cad_explosion_contact_annotation") {
      rawAnnotations.push({
        raw: raw as unknown as CadExplosionContactAnnotation,
      })
    } else if (record.type === "cad_explosion_move") {
      const list = raw.contact_annotations ?? raw.contactAnnotations
      if (Array.isArray(list)) {
        for (const item of list) {
          rawAnnotations.push({
            raw: item as CadExplosionContactAnnotation,
            defaultMoveId: record.cad_explosion_move_id,
            defaultStageId: record.cad_explosion_stage_id,
          })
        }
      }
    } else if (record.type === "cad_explosion_stage") {
      const list = raw.contact_annotations ?? raw.contactAnnotations
      if (Array.isArray(list)) {
        for (const item of list) {
          rawAnnotations.push({
            raw: item as CadExplosionContactAnnotation,
            defaultStageId: record.cad_explosion_stage_id,
          })
        }
      }
    }
  }
  for (const item of extraAnnotations) {
    rawAnnotations.push({ raw: item })
  }

  const resolved: ResolvedContactAnnotation[] = []
  for (const [index, entry] of rawAnnotations.entries()) {
    const { raw, defaultMoveId, defaultStageId } = entry
    const annotationId =
      typeof raw.cad_explosion_contact_annotation_id === "string" &&
      raw.cad_explosion_contact_annotation_id.trim()
        ? raw.cad_explosion_contact_annotation_id.trim()
        : `cad_explosion_contact_annotation_${index}`
    const context = `Explosion contact annotation "${annotationId}"`
    const rationale =
      typeof raw.rationale === "string" ? raw.rationale.trim() : ""
    if (!rationale) {
      throw new Error(`${context} requires a non-empty rationale`)
    }
    const region = validateRegion(raw.region, context)
    if (raw.progressRange !== undefined) {
      const [tMin, tMax] = raw.progressRange
      if (
        !Number.isFinite(tMin) ||
        !Number.isFinite(tMax) ||
        tMin < 0 ||
        tMax > 1 ||
        tMin >= tMax
      ) {
        throw new Error(
          `${context} progressRange must satisfy 0 <= min < max <= 1`,
        )
      }
    }
    if (
      raw.maxSweptVolumeMm3 !== undefined &&
      (!Number.isFinite(raw.maxSweptVolumeMm3) || raw.maxSweptVolumeMm3 <= 0)
    ) {
      throw new Error(`${context} maxSweptVolumeMm3 must be a positive number`)
    }

    // Resolve moveId
    let moveId = raw.cad_explosion_move_id ?? defaultMoveId
    if (!moveId) {
      let stageId = raw.cad_explosion_stage_id ?? defaultStageId
      if (!stageId && raw.stageRef) {
        const matchedStages = stages.filter(
          (s) => s.name === raw.stageRef || s.name.endsWith(`.${raw.stageRef}`),
        )
        if (matchedStages.length !== 1) {
          throw new Error(
            `${context} stageRef "${raw.stageRef}" matched ${matchedStages.length} stages; expected one`,
          )
        }
        stageId = matchedStages[0]!.cad_explosion_stage_id
      }
      if (!stageId || !stagesById.has(stageId)) {
        throw new Error(
          `${context} must reference a valid explosion move or stage`,
        )
      }
      const stageMoves = movesByStageId.get(stageId) ?? []
      if (raw.moveOrder !== undefined) {
        const matchedMove = stageMoves.find((m) => m.order === raw.moveOrder)
        if (!matchedMove) {
          throw new Error(
            `${context} moveOrder ${raw.moveOrder} not found in stage "${stagesById.get(stageId)!.name}"`,
          )
        }
        moveId = matchedMove.cad_explosion_move_id
      } else if (stageMoves.length === 1) {
        moveId = stageMoves[0]!.cad_explosion_move_id
      } else {
        throw new Error(
          `${context} references stage "${stagesById.get(stageId)!.name}" with ${stageMoves.length} moves; specify cad_explosion_move_id or moveOrder`,
        )
      }
    }
    if (!movesById.has(moveId)) {
      throw new Error(`${context} references unknown move "${moveId}"`)
    }

    // Resolve moving part
    const movingSelector = raw.moving_cad_component_id ?? raw.movingTargetRef
    if (!movingSelector) {
      throw new Error(
        `${context} must specify moving_cad_component_id or movingTargetRef`,
      )
    }
    const movingMatches = resolveComponentSelector(
      movingSelector,
      cadById,
      sourceNameById,
    )
    if (movingMatches.length !== 1) {
      throw new Error(
        `${context} moving part "${movingSelector}" matched ${movingMatches.length} CAD components; expected one`,
      )
    }
    const movingCadId = movingMatches[0]!

    // Resolve obstacle
    let obstacle: CadExplosionCollisionObstacle | undefined
    if (raw.obstacle_pcb_board_id) {
      if (!boardIds.has(raw.obstacle_pcb_board_id)) {
        throw new Error(
          `${context} references unknown obstacle board "${raw.obstacle_pcb_board_id}"`,
        )
      }
      obstacle = {
        type: "pcb_board",
        pcb_board_id: raw.obstacle_pcb_board_id,
      }
    } else {
      const obstacleSelector =
        raw.obstacle_cad_component_id ?? raw.obstacleTargetRef
      if (!obstacleSelector) {
        throw new Error(
          `${context} must specify obstacle_cad_component_id, obstacle_pcb_board_id, or obstacleTargetRef`,
        )
      }
      const obstacleMatches = resolveComponentSelector(
        obstacleSelector,
        cadById,
        sourceNameById,
      )
      if (obstacleMatches.length !== 1) {
        throw new Error(
          `${context} obstacle "${obstacleSelector}" matched ${obstacleMatches.length} CAD components; expected one`,
        )
      }
      obstacle = {
        type: "cad_component",
        cad_component_id: obstacleMatches[0]!,
      }
    }
    if (
      obstacle.type === "cad_component" &&
      obstacle.cad_component_id === movingCadId
    ) {
      throw new Error(`${context} moving and obstacle parts must be distinct`)
    }

    resolved.push({
      annotationId,
      moveId,
      movingCadId,
      obstacle,
      region,
      progressRange: raw.progressRange,
      maxSweptVolumeMm3: raw.maxSweptVolumeMm3,
      rationale,
      operation:
        typeof raw.operation === "string" && raw.operation.trim()
          ? raw.operation.trim()
          : undefined,
    })
  }
  return resolved
}

function computeMeshBounds(mesh?: {
  vertProperties?: Float32Array | number[]
}): { min: Point3; max: Point3 } | undefined {
  const verts = mesh?.vertProperties
  if (!verts || verts.length < 3) return undefined
  let minX = Number.POSITIVE_INFINITY
  let minY = Number.POSITIVE_INFINITY
  let minZ = Number.POSITIVE_INFINITY
  let maxX = Number.NEGATIVE_INFINITY
  let maxY = Number.NEGATIVE_INFINITY
  let maxZ = Number.NEGATIVE_INFINITY
  for (let i = 0; i + 2 < verts.length; i += 3) {
    const x = verts[i]!
    const y = verts[i + 1]!
    const z = verts[i + 2]!
    if (x < minX) minX = x
    if (y < minY) minY = y
    if (z < minZ) minZ = z
    if (x > maxX) maxX = x
    if (y > maxY) maxY = y
    if (z > maxZ) maxZ = z
  }
  return {
    min: { x: minX, y: minY, z: minZ },
    max: { x: maxX, y: maxY, z: maxZ },
  }
}

function isBoundsWithinRegion(
  bounds: { min: Point3; max: Point3 },
  region: { min: Point3; max: Point3 },
  tolerance = 1e-4,
): boolean {
  return (
    bounds.min.x >= region.min.x - tolerance &&
    bounds.max.x <= region.max.x + tolerance &&
    bounds.min.y >= region.min.y - tolerance &&
    bounds.max.y <= region.max.y + tolerance &&
    bounds.min.z >= region.min.z - tolerance &&
    bounds.max.z <= region.max.z + tolerance
  )
}

/** Evaluate explicit CLI/build policy for explosion collision results.
 * Default requires acknowledgement of annotated contacts; allowAnnotatedContacts
 * permits scoped annotated contacts while still failing unexpected collisions
 * and incomplete/missing geometry checks.
 */
export function evaluateExplosionCollisionPolicy(
  check: AssemblyExplosionCollisionCheck,
  options: AssemblyExplosionPolicyOptions = {},
): AssemblyExplosionPolicyResult {
  const allowAnnotated = Boolean(
    options.allowAnnotatedContacts || options.allowAnnotatedUnverifiedContacts,
  )
  const unacknowledgedAnnotatedContacts = allowAnnotated
    ? []
    : check.annotatedContacts
  const passed =
    check.status === "checked" &&
    check.errors.length === 0 &&
    unacknowledgedAnnotatedContacts.length === 0
  return {
    passed,
    verificationCategory: check.verificationCategory,
    blockingErrors: check.errors,
    unacknowledgedAnnotatedContacts,
    warnings: check.warnings,
  }
}

/** Check the entire serialized explosion program without mutating its geometry.
 * All solids/points and translations use right-handed Circuit JSON world mm
 * (+X right, +Y top, +Z above). Movements are continuous straight translations;
 * each stage's moves execute sequentially and each move's targets move together.
 * Initial occupied space is subtracted per move, allowing parts to separate from
 * existing overlaps. Only newly entered positive-volume intersections are errors.
 * Unsupported/invalid geometry yields explicit incomplete-check warnings.
 */
export async function checkCircuitJsonAssemblyExplosionCollisions(
  circuitJson: AnyCircuitElement[],
  options: CollisionModelLoadOptions & {
    manifold?: ManifoldToplevel
    contactAnnotations?: CadExplosionContactAnnotation[]
  } = {},
): Promise<AssemblyExplosionCollisionCheck> {
  // Use the playback validator before looking at any geometry or partial path.
  getCircuitJsonAssemblyExplosion(circuitJson)
  const stages = circuitJson
    .filter((r) => r.type === "cad_explosion_stage")
    .sort((a, b) => a.order - b.order)
  const moves = circuitJson.filter((r) => r.type === "cad_explosion_move")
  const result: AssemblyExplosionCollisionCheck = {
    status: "checked",
    verificationCategory: "verified_clear",
    errors: [],
    annotatedContacts: [],
    warnings: [],
  }
  const stageIds = stages.map((stage) => stage.cad_explosion_stage_id)
  const stagesById = new Map(
    stages.map((stage) => [stage.cad_explosion_stage_id, stage]),
  )
  const movesById = new Map(
    moves.map((move) => [move.cad_explosion_move_id, move]),
  )
  const movesByStage = new Map<string, CadExplosionMove[]>()
  for (const stage of stages) {
    movesByStage.set(
      stage.cad_explosion_stage_id,
      moves
        .filter(
          (move) =>
            move.cad_explosion_stage_id === stage.cad_explosion_stage_id,
        )
        .sort((a, b) => a.order - b.order),
    )
  }
  const expandMoveTargets = (targets: CadExplosionMove["targets"]) => {
    const cadIds = new Set<ExplosionCadId>()
    for (const target of targets) {
      if (target.type === "cad_component") cadIds.add(target.cad_component_id)
      else if (target.type === "cad_explosion_stage") {
        for (const id of stagesById.get(target.cad_explosion_stage_id)!
          .cad_component_ids) {
          cadIds.add(id)
        }
      }
    }
    return { cadIds }
  }

  const sources = new Map(
    circuitJson
      .filter((r) => r.type === "source_component")
      .map((source) => [source.source_component_id, source.name]),
  )
  const cadRecords = circuitJson.filter(
    (r): r is CadComponent => r.type === "cad_component",
  )
  const cadById = new Map(cadRecords.map((r) => [r.cad_component_id, r]))
  const boardIds = new Set(
    circuitJson
      .filter((r) => r.type === "pcb_board")
      .map((r) => r.pcb_board_id),
  )

  const annotations = resolveContactAnnotations({
    circuitJson,
    stages,
    moves,
    cadById,
    boardIds,
    sourceNameById: sources,
    extraAnnotations: options.contactAnnotations,
  })
  const {
    statesByCadId,
    transitionsByMoveId,
    warnings: stateTransitionWarnings,
  } = resolveExplosionGeometryStateTransitions({
    assembled: circuitJson,
    stages,
    movesByStage,
    expandTargets: expandMoveTargets,
  })

  if (
    !moves.some((move) =>
      Math.hypot(move.translation.x, move.translation.y, move.translation.z),
    ) &&
    transitionsByMoveId.size === 0
  )
    return result

  const solids: ExplosionCollisionSolid[] = []
  const stateSolids = new Map<string, Manifold>()
  const incompleteSolidIds = new Set<CollisionSolidId>()
  const unavailable = new Map<
    CadExplosionCollisionCheckWarning["reason"],
    {
      cad_component_ids: ExplosionCadId[]
      pcb_board_ids: ExplosionBoardId[]
      names: string[]
    }
  >()
  const skip = (
    reason: CadExplosionCollisionCheckWarning["reason"],
    reference: ExplosionCollisionSolid["reference"],
    name: string,
  ) => {
    incompleteSolidIds.add(getCollisionSolidId(reference))
    const group = unavailable.get(reason) ?? {
      cad_component_ids: [],
      pcb_board_ids: [],
      names: [],
    }
    if (reference.type === "cad_component") {
      if (!group.cad_component_ids.includes(reference.cad_component_id))
        group.cad_component_ids.push(reference.cad_component_id)
    } else {
      if (!group.pcb_board_ids.includes(reference.pcb_board_id))
        group.pcb_board_ids.push(reference.pcb_board_id)
    }
    group.names.push(name)
    unavailable.set(reason, group)
  }

  for (const stateWarning of stateTransitionWarnings) {
    const cad = cadById.get(stateWarning.cadComponentId)
    const name = (cad && sources.get(cad.source_component_id)) || "unnamed part"
    skip(
      stateWarning.reason,
      {
        type: "cad_component",
        cad_component_id: stateWarning.cadComponentId,
      },
      name,
    )
  }

  const manifold = options.manifold ?? (await loadCollisionManifold())
  try {
    for (const record of circuitJson) {
      if (record.type === "cad_component") {
        const reference = {
          type: "cad_component" as const,
          cad_component_id: record.cad_component_id,
        }
        const name = sources.get(record.source_component_id) || "unnamed part"
        const hasSupportedModel = Boolean(
          record.model_jscad ||
            record.model_stl_url ||
            record.model_obj_url ||
            record.model_gltf_url ||
            record.model_glb_url ||
            record.model_step_url,
        )
        if (
          !hasSupportedModel &&
          (record.model_wrl_url ||
            record.model_3mf_url ||
            record.model_asset ||
            !record.footprinter_string)
        ) {
          skip("unsupported_geometry", reference, name)
          continue
        }
        try {
          solids.push({
            reference,
            name,
            sourceComponentId: record.source_component_id,
            solid: await loadCadCollisionSolid(
              record,
              circuitJson,
              manifold,
              options,
            ),
          })
        } catch {
          skip("invalid_geometry", reference, name)
        }
        // Load any named geometry states referenced by transitions for this component
        const stateMap = statesByCadId.get(record.cad_component_id)
        if (stateMap) {
          for (const [stateName, stateModel] of stateMap) {
            const stateCad = applyGeometryStateToCadComponent(
              record,
              stateName,
              stateModel,
            )
            const hasSupportedStateModel = Boolean(
              stateCad.model_jscad ||
                stateCad.model_stl_url ||
                stateCad.model_obj_url ||
                stateCad.model_gltf_url ||
                stateCad.model_glb_url ||
                stateCad.model_step_url,
            )
            if (!hasSupportedStateModel) {
              skip("unsupported_geometry", reference, name)
              continue
            }
            try {
              const stateSolid = await loadCadCollisionSolid(
                stateCad,
                circuitJson,
                manifold,
                options,
              )
              stateSolids.set(
                `${record.cad_component_id}@${stateName}`,
                stateSolid,
              )
            } catch {
              skip("invalid_geometry", reference, name)
            }
          }
        }
      } else if (record.type === "pcb_board") {
        const reference = {
          type: "pcb_board" as const,
          pcb_board_id: record.pcb_board_id,
        }
        try {
          const solid = createBoardCollisionSolid(record, circuitJson, manifold)
          if (solid) solids.push({ reference, name: "PCB", solid })
          else skip("unsupported_geometry", reference, "PCB")
        } catch {
          skip("invalid_geometry", reference, "PCB")
        }
      }
    }

    const solidsById = new Map(
      solids.map((solid) => [getCollisionSolidId(solid.reference), solid]),
    )
    const orderedMoves = stages.flatMap((stage) =>
      (movesByStage.get(stage.cad_explosion_stage_id) ?? []).map((move) => ({
        stage,
        move,
        solidIds: [...expandMoveTargets(move.targets).cadIds]
          .map((cad_component_id) =>
            getCollisionSolidId({
              type: "cad_component",
              cad_component_id,
            }),
          )
          .filter((solidId) => solidsById.has(solidId)),
      })),
    )

    // Precompute start-of-move world positions for each CAD component
    const moveStartPositions = new Map<
      CadExplosionMove["cad_explosion_move_id"],
      Map<ExplosionCadId, Point3>
    >()
    const runningOffsets = new Map<ExplosionCadId, Point3>()
    for (const { move } of orderedMoves) {
      const snapshot = new Map<ExplosionCadId, Point3>()
      for (const [cadId, cad] of cadById) {
        const off = runningOffsets.get(cadId) ?? { x: 0, y: 0, z: 0 }
        snapshot.set(cadId, {
          x: cad.position.x + off.x,
          y: cad.position.y + off.y,
          z: cad.position.z + off.z,
        })
      }
      moveStartPositions.set(move.cad_explosion_move_id, snapshot)
      for (const cadId of expandMoveTargets(move.targets).cadIds) {
        const prev = runningOffsets.get(cadId) ?? { x: 0, y: 0, z: 0 }
        runningOffsets.set(cadId, {
          x: prev.x + move.translation.x,
          y: prev.y + move.translation.y,
          z: prev.z + move.translation.z,
        })
      }
    }

    interface RawDetectedCollision {
      moveId: CadExplosionMove["cad_explosion_move_id"]
      movingSolidId: CollisionSolidId
      obstacleSolidId: CollisionSolidId
      sweptIntersectionVolumeMm3: number
      collisionMesh?: {
        numProp: number
        vertProperties: Float32Array
        triVerts: Uint32Array
      }
      movingStartMesh?: ReturnType<typeof serializeCollisionMesh>
      obstacleStartMesh?: ReturnType<typeof serializeCollisionMesh>
    }
    const detectedCollisions: RawDetectedCollision[] = []

    if (transitionsByMoveId.size === 0) {
      const baseMeshes = new Map<
        CollisionSolidId,
        ReturnType<typeof serializeCollisionMesh>
      >()
      for (const solid of solids) {
        const id = getCollisionSolidId(solid.reference)
        baseMeshes.set(id, serializeCollisionMesh(solid.solid))
      }
      const solver = new CadCollisionCheckingSolver(
        {
          solids: solids.map((solid) => ({
            solidId: getCollisionSolidId(solid.reference),
            name: solid.name,
            mesh: baseMeshes.get(getCollisionSolidId(solid.reference))!,
          })),
          moves: orderedMoves.map(({ stage, move, solidIds }) => ({
            moveId: move.cad_explosion_move_id,
            name: stage.name,
            translation: [
              move.translation.x,
              move.translation.y,
              move.translation.z,
            ] as Vec3,
            solidIds,
          })),
        },
        { manifold },
      )
      try {
        solver.solve()
        const rawCollisions = solver.getOutput().collisions
        const rawMeshes = (
          solver as unknown as {
            collisionMeshes?: RawDetectedCollision["collisionMesh"][]
          }
        ).collisionMeshes
        for (const [idx, c] of rawCollisions.entries()) {
          detectedCollisions.push({
            ...c,
            collisionMesh: rawMeshes?.[idx],
          })
        }
      } finally {
        solver.dispose()
      }
    } else {
      // State-aware move-by-move execution
      const currentStateByCadId = new Map<ExplosionCadId, string>()
      const currentOffsetBySolidId = new Map<CollisionSolidId, Vec3>()
      for (const solid of solids) {
        currentOffsetBySolidId.set(
          getCollisionSolidId(solid.reference),
          [0, 0, 0],
        )
      }
      const getActiveSolid = (solid: ExplosionCollisionSolid): Manifold => {
        if (solid.reference.type === "cad_component") {
          const stateName = currentStateByCadId.get(
            solid.reference.cad_component_id,
          )
          if (stateName && stateName !== "rest" && stateName !== "nominal") {
            const stateSolid = stateSolids.get(
              `${solid.reference.cad_component_id}@${stateName}`,
            )
            if (stateSolid) return stateSolid
          }
        }
        return solid.solid
      }

      for (const { stage, move, solidIds } of orderedMoves) {
        const transitions = transitionsByMoveId.get(move.cad_explosion_move_id)
        if (transitions) {
          for (const tr of transitions) {
            currentStateByCadId.set(tr.cadComponentId, tr.toState)
          }
        }
        const distance = Math.hypot(
          move.translation.x,
          move.translation.y,
          move.translation.z,
        )
        if (!distance || !solidIds.length) continue

        const stepSolids: {
          solidId: CollisionSolidId
          name: string
          mesh: ReturnType<typeof serializeCollisionMesh>
        }[] = []
        const stepMeshBySolidId = new Map<
          CollisionSolidId,
          ReturnType<typeof serializeCollisionMesh>
        >()
        for (const solid of solids) {
          const solidId = getCollisionSolidId(solid.reference)
          const offset = currentOffsetBySolidId.get(solidId) ?? [0, 0, 0]
          const baseSolid = getActiveSolid(solid)
          const translated =
            offset[0] || offset[1] || offset[2]
              ? baseSolid.translate(offset)
              : baseSolid
          try {
            const mesh = serializeCollisionMesh(translated)
            stepSolids.push({ solidId, name: solid.name, mesh })
            stepMeshBySolidId.set(solidId, mesh)
          } finally {
            if (translated !== baseSolid) translated.delete()
          }
        }

        const solver = new CadCollisionCheckingSolver(
          {
            solids: stepSolids,
            moves: [
              {
                moveId: move.cad_explosion_move_id,
                name: stage.name,
                translation: [
                  move.translation.x,
                  move.translation.y,
                  move.translation.z,
                ] as Vec3,
                solidIds,
              },
            ],
          },
          { manifold },
        )
        try {
          solver.solve()
          const rawCollisions = solver.getOutput().collisions
          const rawMeshes = (
            solver as unknown as {
              collisionMeshes?: RawDetectedCollision["collisionMesh"][]
            }
          ).collisionMeshes
          for (const [idx, c] of rawCollisions.entries()) {
            detectedCollisions.push({
              ...c,
              collisionMesh: rawMeshes?.[idx],
              movingStartMesh: stepMeshBySolidId.get(c.movingSolidId),
              obstacleStartMesh: stepMeshBySolidId.get(c.obstacleSolidId),
            })
          }
        } finally {
          solver.dispose()
        }

        for (const solidId of new Set(solidIds)) {
          const prev = currentOffsetBySolidId.get(solidId) ?? [0, 0, 0]
          currentOffsetBySolidId.set(solidId, [
            prev[0] + move.translation.x,
            prev[1] + move.translation.y,
            prev[2] + move.translation.z,
          ])
        }
      }
    }

    const hasCollisionInProgressInterval = (
      movingSolid: ExplosionCollisionSolid,
      obstacleSolid: ExplosionCollisionSolid,
      move: CadExplosionMove,
      tStart: number,
      tEnd: number,
    ): boolean => {
      if (tEnd <= tStart + 1e-6) return false
      const startSnapshot = moveStartPositions.get(move.cad_explosion_move_id)
      const getSolidAtMoveStart = (s: ExplosionCollisionSolid): Manifold => {
        if (s.reference.type === "cad_component") {
          const cad = cadById.get(s.reference.cad_component_id)!
          const posAtStart =
            startSnapshot?.get(s.reference.cad_component_id) ?? cad.position
          const dx = posAtStart.x - cad.position.x
          const dy = posAtStart.y - cad.position.y
          const dz = posAtStart.z - cad.position.z
          if (dx || dy || dz) return s.solid.translate([dx, dy, dz])
        }
        return s.solid
      }
      const mStart = getSolidAtMoveStart(movingSolid)
      const oStart = getSolidAtMoveStart(obstacleSolid)
      const mIntervalStart =
        tStart > 0
          ? mStart.translate([
              move.translation.x * tStart,
              move.translation.y * tStart,
              move.translation.z * tStart,
            ])
          : mStart
      try {
        const dt = tEnd - tStart
        const subSolver = new CadCollisionCheckingSolver(
          {
            solids: [
              {
                solidId: getCollisionSolidId(movingSolid.reference),
                name: movingSolid.name,
                mesh: serializeCollisionMesh(mIntervalStart),
              },
              {
                solidId: getCollisionSolidId(obstacleSolid.reference),
                name: obstacleSolid.name,
                mesh: serializeCollisionMesh(oStart),
              },
            ],
            moves: [
              {
                moveId: move.cad_explosion_move_id,
                name: "sub-interval",
                translation: [
                  move.translation.x * dt,
                  move.translation.y * dt,
                  move.translation.z * dt,
                ] as Vec3,
                solidIds: [getCollisionSolidId(movingSolid.reference)],
              },
            ],
          },
          { manifold },
        )
        try {
          subSolver.solve()
          return subSolver.getOutput().collisions.length > 0
        } finally {
          subSolver.dispose()
        }
      } finally {
        if (mIntervalStart !== mStart) mIntervalStart.delete()
        if (mStart !== movingSolid.solid) mStart.delete()
        if (oStart !== obstacleSolid.solid) oStart.delete()
      }
    }

    for (const collision of detectedCollisions) {
      const move = movesById.get(collision.moveId)!
      const stage = stagesById.get(move.cad_explosion_stage_id)!
      const moving = solidsById.get(collision.movingSolidId)!
      const obstacle = solidsById.get(collision.obstacleSolidId)!
      if (moving.reference.type !== "cad_component") continue

      const diagnostic = cad_explosion_collision_error.parse({
        type: "cad_explosion_collision_error",
        cad_explosion_stage_id: stage.cad_explosion_stage_id,
        cad_explosion_move_id: move.cad_explosion_move_id,
        moving_cad_component_id: moving.reference.cad_component_id,
        obstacle: obstacle.reference,
        source_component_ids: [
          ...new Set([
            moving.sourceComponentId!,
            ...(obstacle.sourceComponentId ? [obstacle.sourceComponentId] : []),
          ]),
        ],
        swept_intersection_volume_mm3: collision.sweptIntersectionVolumeMm3,
        message: `Explosion stage "${stage.name}" moves "${moving.name}" through "${obstacle.name}" (new swept intersection: ${Number(collision.sweptIntersectionVolumeMm3.toPrecision(5))} mm³)`,
        is_fatal: false,
      })

      const measuredBounds = computeMeshBounds(collision.collisionMesh)
      const startPositions = moveStartPositions.get(move.cad_explosion_move_id)
      const canMatchAnnotation =
        !incompleteSolidIds.has(collision.movingSolidId) &&
        !incompleteSolidIds.has(collision.obstacleSolidId) &&
        measuredBounds !== undefined

      let matchedAnnotation:
        | {
            annotation: ResolvedContactAnnotation
            worldRegion: { min: Point3; max: Point3 }
          }
        | undefined

      if (canMatchAnnotation && measuredBounds) {
        for (const candidate of annotations) {
          if (candidate.moveId !== move.cad_explosion_move_id) continue
          if (candidate.movingCadId !== moving.reference.cad_component_id)
            continue
          const sameObstacle =
            candidate.obstacle.type === obstacle.reference.type &&
            (candidate.obstacle.type === "cad_component" &&
            obstacle.reference.type === "cad_component"
              ? candidate.obstacle.cad_component_id ===
                obstacle.reference.cad_component_id
              : candidate.obstacle.type === "pcb_board" &&
                  obstacle.reference.type === "pcb_board"
                ? candidate.obstacle.pcb_board_id ===
                  obstacle.reference.pcb_board_id
                : false)
          if (!sameObstacle) continue

          const frameOrigin: Point3 =
            candidate.region.frame === "moving"
              ? (startPositions?.get(moving.reference.cad_component_id) ?? {
                  x: 0,
                  y: 0,
                  z: 0,
                })
              : candidate.region.frame === "obstacle" &&
                  obstacle.reference.type === "cad_component"
                ? (startPositions?.get(obstacle.reference.cad_component_id) ?? {
                    x: 0,
                    y: 0,
                    z: 0,
                  })
                : { x: 0, y: 0, z: 0 }

          const worldRegion = {
            min: {
              x: candidate.region.min.x + frameOrigin.x,
              y: candidate.region.min.y + frameOrigin.y,
              z: candidate.region.min.z + frameOrigin.z,
            },
            max: {
              x: candidate.region.max.x + frameOrigin.x,
              y: candidate.region.max.y + frameOrigin.y,
              z: candidate.region.max.z + frameOrigin.z,
            },
          }
          if (!isBoundsWithinRegion(measuredBounds, worldRegion)) continue
          if (
            candidate.maxSweptVolumeMm3 !== undefined &&
            collision.sweptIntersectionVolumeMm3 > candidate.maxSweptVolumeMm3
          ) {
            continue
          }
          if (candidate.progressRange) {
            const [tMin, tMax] = candidate.progressRange
            if (
              hasCollisionInProgressInterval(moving, obstacle, move, 0, tMin) ||
              hasCollisionInProgressInterval(moving, obstacle, move, tMax, 1)
            ) {
              continue
            }
          }
          matchedAnnotation = { annotation: candidate, worldRegion }
          break
        }
      }

      if (matchedAnnotation && measuredBounds) {
        result.annotatedContacts.push({
          verification_status: "annotated_unverified_contact",
          annotationId: matchedAnnotation.annotation.annotationId,
          rationale: matchedAnnotation.annotation.rationale,
          operation: matchedAnnotation.annotation.operation,
          region: matchedAnnotation.annotation.region,
          worldRegion: matchedAnnotation.worldRegion,
          measuredBounds,
          progressRange: matchedAnnotation.annotation.progressRange,
          diagnostic,
        })
      } else {
        result.errors.push(diagnostic)
      }
    }

    for (const [reason, group] of unavailable) {
      const names = [...new Set(group.names)]
      const description = names
        .slice(0, 6)
        .map((name) => `"${name}"`)
        .join(", ")
      const remaining =
        names.length > 6 ? ` and ${names.length - 6} other parts` : ""
      result.warnings.push(
        cad_explosion_collision_check_warning.parse({
          type: "cad_explosion_collision_check_warning",
          cad_explosion_stage_ids: stageIds,
          cad_component_ids: group.cad_component_ids,
          pcb_board_ids: group.pcb_board_ids,
          reason,
          message: `Explosion collision checking is incomplete: ${reason === "invalid_geometry" ? "could not load or validate closed geometry for" : "unsupported geometry for"} ${description}${remaining}`,
          is_fatal: false,
        }),
      )
    }
    if (result.warnings.length) {
      result.status = "incomplete"
      result.verificationCategory = "incomplete"
    } else if (result.errors.length) {
      result.verificationCategory = "unexpected_collision"
    } else if (result.annotatedContacts.length) {
      result.verificationCategory = "annotated_unverified_contact"
    } else {
      result.verificationCategory = "verified_clear"
    }
    return result
  } finally {
    for (const { solid } of solids) solid.delete()
    for (const solid of stateSolids.values()) solid.delete()
  }
}
