import type {
  AnyCircuitElement,
  CadComponent,
  CadExplosionMove,
  CadExplosionStage,
  CadExplosionTarget,
} from "circuit-json"
import type {
  CadGeometryStateModel,
  ExplosionCadId,
  ExplosionGeometryStateTransition,
} from "./collision/types"

const MODEL_KEYS = [
  "model_jscad",
  "model_stl_url",
  "model_obj_url",
  "model_mtl_url",
  "model_gltf_url",
  "model_glb_url",
  "model_step_url",
  "model_wrl_url",
  "model_3mf_url",
  "model_asset",
  "footprinter_string",
] as const

export interface ResolvedMoveStateTransition {
  moveId: CadExplosionMove["cad_explosion_move_id"]
  stageId: CadExplosionStage["cad_explosion_stage_id"]
  stageName: string
  cadComponentId: ExplosionCadId
  fromState?: string
  toState: string
  transitionVerification: "verified" | "endpoint_only" | "unsupported"
}

export interface ExplosionStateTransitionWarning {
  cadComponentId: ExplosionCadId
  stageId: CadExplosionStage["cad_explosion_stage_id"]
  reason: "unsupported_geometry" | "invalid_geometry"
  detail: string
}

function normalizeStateModel(raw: unknown): CadGeometryStateModel | undefined {
  if (!raw || typeof raw !== "object") return undefined
  const obj = raw as Record<string, unknown>
  const normalized: CadGeometryStateModel = {}
  if ("model_jscad" in obj && obj.model_jscad !== undefined) {
    normalized.model_jscad = obj.model_jscad
  } else if ("jscad" in obj && obj.jscad !== undefined) {
    normalized.model_jscad = obj.jscad
  }
  if (typeof obj.model_stl_url === "string")
    normalized.model_stl_url = obj.model_stl_url
  else if (typeof obj.stlUrl === "string") normalized.model_stl_url = obj.stlUrl
  if (typeof obj.model_obj_url === "string")
    normalized.model_obj_url = obj.model_obj_url
  else if (typeof obj.objUrl === "string") normalized.model_obj_url = obj.objUrl
  if (typeof obj.model_mtl_url === "string")
    normalized.model_mtl_url = obj.model_mtl_url
  else if (typeof obj.mtlUrl === "string") normalized.model_mtl_url = obj.mtlUrl
  if (typeof obj.model_gltf_url === "string")
    normalized.model_gltf_url = obj.model_gltf_url
  else if (typeof obj.gltfUrl === "string")
    normalized.model_gltf_url = obj.gltfUrl
  if (typeof obj.model_glb_url === "string")
    normalized.model_glb_url = obj.model_glb_url
  else if (typeof obj.glbUrl === "string") normalized.model_glb_url = obj.glbUrl
  if (typeof obj.model_step_url === "string")
    normalized.model_step_url = obj.model_step_url
  else if (typeof obj.stepUrl === "string")
    normalized.model_step_url = obj.stepUrl
  if (typeof obj.model_wrl_url === "string")
    normalized.model_wrl_url = obj.model_wrl_url
  else if (typeof obj.wrlUrl === "string") normalized.model_wrl_url = obj.wrlUrl
  if (typeof obj.model_3mf_url === "string")
    normalized.model_3mf_url = obj.model_3mf_url
  else if (typeof obj.threeMfUrl === "string")
    normalized.model_3mf_url = obj.threeMfUrl
  if ("model_asset" in obj && obj.model_asset !== undefined)
    normalized.model_asset = obj.model_asset
  if (typeof obj.footprinter_string === "string")
    normalized.footprinter_string = obj.footprinter_string
  if (obj.position && typeof obj.position === "object")
    normalized.position = obj.position as CadGeometryStateModel["position"]
  if (obj.rotation && typeof obj.rotation === "object")
    normalized.rotation = obj.rotation as CadGeometryStateModel["rotation"]
  return normalized
}

/** Extract per-component named geometry states from assembled Circuit JSON. */
export function extractComponentGeometryStates(
  assembled: AnyCircuitElement[],
): Map<ExplosionCadId, Map<string, CadGeometryStateModel>> {
  const byCadId = new Map<ExplosionCadId, Map<string, CadGeometryStateModel>>()
  const ensureMap = (cadId: ExplosionCadId) => {
    let map = byCadId.get(cadId)
    if (!map) {
      map = new Map()
      byCadId.set(cadId, map)
    }
    return map
  }

  for (const element of assembled) {
    const raw = element as unknown as Record<string, unknown>
    if (element.type === "cad_component") {
      const statesRaw = raw.geometry_states ?? raw.geometryStates
      if (statesRaw && typeof statesRaw === "object") {
        const map = ensureMap(element.cad_component_id)
        for (const [stateName, stateModel] of Object.entries(
          statesRaw as Record<string, unknown>,
        )) {
          const parsed = normalizeStateModel(stateModel)
          if (parsed) map.set(stateName, parsed)
        }
      }
    } else if (raw.type === "cad_explosion_geometry_state") {
      const cadId =
        typeof raw.cad_component_id === "string"
          ? raw.cad_component_id
          : undefined
      const stateName =
        typeof raw.state_name === "string"
          ? raw.state_name
          : typeof raw.name === "string"
            ? raw.name
            : undefined
      const parsed = normalizeStateModel(raw.model ?? raw)
      if (cadId && stateName && parsed) {
        ensureMap(cadId).set(stateName, parsed)
      }
    }
  }
  return byCadId
}

/** Apply a resolved geometry state model to a CadComponent without mutating identity or host pose. */
export function applyGeometryStateToCadComponent(
  component: CadComponent,
  stateName: string,
  stateModel?: CadGeometryStateModel,
): CadComponent {
  if (
    !stateName ||
    stateName === "rest" ||
    stateName === "nominal" ||
    !stateModel
  )
    return component
  const next = { ...component } as Record<string, unknown>
  for (const key of MODEL_KEYS) {
    delete next[key]
  }
  for (const key of MODEL_KEYS) {
    const val = stateModel[key]
    if (val !== undefined) next[key] = structuredClone(val)
  }
  next.active_geometry_state = stateName
  return next as unknown as CadComponent
}

export function resolveComponentSelector(
  selector: string,
  cadById: Map<ExplosionCadId, CadComponent>,
  sourceNameById: Map<string, string>,
): ExplosionCadId[] {
  if (cadById.has(selector)) return [selector]
  const matches: ExplosionCadId[] = []
  const tail = selector.split(".").at(-1)!
  for (const [cadId, cad] of cadById) {
    const sourceName = sourceNameById.get(cad.source_component_id)
    if (sourceName && (sourceName === selector || sourceName === tail)) {
      matches.push(cadId)
    }
  }
  return matches
}

/** Resolve all state transitions declared across stages and moves in execution order. */
export function resolveExplosionGeometryStateTransitions(params: {
  assembled: AnyCircuitElement[]
  stages: CadExplosionStage[]
  movesByStage: Map<
    CadExplosionStage["cad_explosion_stage_id"],
    CadExplosionMove[]
  >
  expandTargets: (targets: CadExplosionTarget[]) => {
    cadIds: Set<ExplosionCadId>
  }
}): {
  statesByCadId: Map<ExplosionCadId, Map<string, CadGeometryStateModel>>
  transitionsByMoveId: Map<
    CadExplosionMove["cad_explosion_move_id"],
    ResolvedMoveStateTransition[]
  >
  warnings: ExplosionStateTransitionWarning[]
} {
  const { assembled, stages, movesByStage, expandTargets } = params
  const statesByCadId = extractComponentGeometryStates(assembled)
  const cadById = new Map<ExplosionCadId, CadComponent>()
  const sourceNameById = new Map<string, string>()
  for (const record of assembled) {
    if (record.type === "cad_component")
      cadById.set(record.cad_component_id, record)
    else if (record.type === "source_component")
      sourceNameById.set(record.source_component_id, record.name)
  }

  const rawStagesById = new Map<string, Record<string, unknown>>()
  const rawMovesById = new Map<string, Record<string, unknown>>()
  for (const record of assembled) {
    const raw = record as unknown as Record<string, unknown>
    if (
      record.type === "cad_explosion_stage" &&
      typeof raw.cad_explosion_stage_id === "string"
    ) {
      rawStagesById.set(raw.cad_explosion_stage_id, raw)
    } else if (
      record.type === "cad_explosion_move" &&
      typeof raw.cad_explosion_move_id === "string"
    ) {
      rawMovesById.set(raw.cad_explosion_move_id, raw)
    }
  }

  const transitionsByMoveId = new Map<
    CadExplosionMove["cad_explosion_move_id"],
    ResolvedMoveStateTransition[]
  >()
  const warnings: ExplosionStateTransitionWarning[] = []

  const parseRawTransitions = (
    rawContainer: Record<string, unknown> | undefined,
    defaultTargetIds: ExplosionCadId[],
    stage: CadExplosionStage,
    move: CadExplosionMove,
  ): ResolvedMoveStateTransition[] => {
    if (!rawContainer) return []
    const list: ResolvedMoveStateTransition[] = []
    const explicit =
      rawContainer.state_transitions ?? rawContainer.stateTransitions
    if (Array.isArray(explicit)) {
      for (const item of explicit as ExplosionGeometryStateTransition[]) {
        if (
          !item ||
          typeof item !== "object" ||
          typeof item.toState !== "string"
        )
          continue
        const toState = item.toState.trim()
        if (!toState) continue
        const selector = item.cad_component_id ?? item.targetRef
        const resolvedIds = selector
          ? resolveComponentSelector(selector, cadById, sourceNameById)
          : defaultTargetIds
        if (selector && resolvedIds.length !== 1) {
          throw new Error(
            `Explosion stage "${stage.name}" geometry state transition target "${selector}" matched ${resolvedIds.length} CAD components; expected one`,
          )
        }
        for (const cadComponentId of resolvedIds) {
          list.push({
            moveId: move.cad_explosion_move_id,
            stageId: stage.cad_explosion_stage_id,
            stageName: stage.name,
            cadComponentId,
            fromState:
              typeof item.fromState === "string"
                ? item.fromState.trim()
                : undefined,
            toState,
            transitionVerification: item.transitionVerification ?? "verified",
          })
        }
      }
    }
    const shorthand = rawContainer.geometry_state ?? rawContainer.geometryState
    if (typeof shorthand === "string" && shorthand.trim()) {
      for (const cadComponentId of defaultTargetIds) {
        list.push({
          moveId: move.cad_explosion_move_id,
          stageId: stage.cad_explosion_stage_id,
          stageName: stage.name,
          cadComponentId,
          toState: shorthand.trim(),
          transitionVerification: "verified",
        })
      }
    } else if (shorthand && typeof shorthand === "object") {
      for (const [selector, stateVal] of Object.entries(
        shorthand as Record<string, unknown>,
      )) {
        if (typeof stateVal !== "string" || !stateVal.trim()) continue
        const resolvedIds = resolveComponentSelector(
          selector,
          cadById,
          sourceNameById,
        )
        if (resolvedIds.length !== 1) {
          throw new Error(
            `Explosion stage "${stage.name}" geometryState target "${selector}" matched ${resolvedIds.length} CAD components; expected one`,
          )
        }
        list.push({
          moveId: move.cad_explosion_move_id,
          stageId: stage.cad_explosion_stage_id,
          stageName: stage.name,
          cadComponentId: resolvedIds[0]!,
          toState: stateVal.trim(),
          transitionVerification: "verified",
        })
      }
    }
    return list
  }

  for (const stage of stages) {
    const stageMoves = movesByStage.get(stage.cad_explosion_stage_id) ?? []
    const rawStage = rawStagesById.get(stage.cad_explosion_stage_id)
    for (const [moveIndex, move] of stageMoves.entries()) {
      const rawMove = rawMovesById.get(move.cad_explosion_move_id)
      const moveTargetIds = [...expandTargets(move.targets).cadIds]
      const moveTransitions = [
        ...(moveIndex === 0
          ? parseRawTransitions(rawStage, stage.cad_component_ids, stage, move)
          : []),
        ...parseRawTransitions(rawMove, moveTargetIds, stage, move),
      ]
      if (!moveTransitions.length) continue
      transitionsByMoveId.set(move.cad_explosion_move_id, moveTransitions)

      for (const tr of moveTransitions) {
        const component = cadById.get(tr.cadComponentId)
        if (!component) continue
        if (tr.transitionVerification !== "verified") {
          warnings.push({
            cadComponentId: tr.cadComponentId,
            stageId: stage.cad_explosion_stage_id,
            reason: "unsupported_geometry",
            detail: `endpoint-only or unverified geometry state transition to "${tr.toState}"`,
          })
          continue
        }
        if (tr.toState === "rest" || tr.toState === "nominal") continue
        const stateMap = statesByCadId.get(tr.cadComponentId)
        const stateModel = stateMap?.get(tr.toState)
        if (!stateModel) {
          warnings.push({
            cadComponentId: tr.cadComponentId,
            stageId: stage.cad_explosion_stage_id,
            reason: "unsupported_geometry",
            detail: `missing geometry state "${tr.toState}"`,
          })
          continue
        }
        // Changing coordinate frame in a geometry state is invalid.
        if (
          (stateModel.position &&
            (stateModel.position.x !== component.position.x ||
              stateModel.position.y !== component.position.y ||
              stateModel.position.z !== component.position.z)) ||
          (stateModel.rotation &&
            component.rotation &&
            (stateModel.rotation.x !== component.rotation.x ||
              stateModel.rotation.y !== component.rotation.y ||
              stateModel.rotation.z !== component.rotation.z))
        ) {
          warnings.push({
            cadComponentId: tr.cadComponentId,
            stageId: stage.cad_explosion_stage_id,
            reason: "invalid_geometry",
            detail: `geometry state "${tr.toState}" changes host coordinate frame`,
          })
          continue
        }
        const hasSupportedStateModel = Boolean(
          stateModel.model_jscad ||
            stateModel.model_stl_url ||
            stateModel.model_obj_url ||
            stateModel.model_gltf_url ||
            stateModel.model_glb_url ||
            stateModel.model_step_url,
        )
        if (!hasSupportedStateModel) {
          warnings.push({
            cadComponentId: tr.cadComponentId,
            stageId: stage.cad_explosion_stage_id,
            reason: "unsupported_geometry",
            detail: `unsupported geometry representation in state "${tr.toState}"`,
          })
        }
      }
    }
  }

  return { statesByCadId, transitionsByMoveId, warnings }
}
