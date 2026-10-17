import {
  type InputComponent,
  type InputObstacle,
  type PackInput,
  type PackOutput,
  PackSolver2,
  convertCircuitJsonToPackOutput,
  convertPackOutputToPackInput,
  getGraphicsFromPackOutput,
} from "calculate-packing"
import {
  type CircuitJsonUtilObjects,
  transformPCBElements,
} from "@tscircuit/circuit-json-util"
import { type LayerRef, type PcbComponent, length } from "circuit-json"
import Debug from "debug"
import type { NormalComponent } from "lib/components/base-components/NormalComponent"
import { solvePackSolverWithTimeout } from "lib/utils/packing/solvePackSolverWithTimeout"
import { inverse } from "transformation-matrix"
import type { Group } from "../Group"
import { applyComponentConstraintClusters } from "./applyComponentConstraintClusters"
import { applyPackOutput } from "./applyPackOutput"
import {
  getPackComponentPcbLayer,
  getPackInputsByPcbLayer,
} from "./getPackInputsByPcbLayer"

const DEFAULT_MIN_GAP = "1mm"
const TIGHTER_BOUNDED_GAP_CANDIDATES_MM = [0.5, 0.25, 0.15]
const debug = Debug("Group_doInitialPcbLayoutPack")

const getCollisionObstacleForStaticComponent = (
  component: InputComponent,
): InputObstacle | undefined => {
  if (component.courtyard && component.center) {
    return {
      obstacleId: component.componentId,
      absoluteCenter: {
        x: component.center.x + component.courtyard.offsetFromCenter.x,
        y: component.center.y + component.courtyard.offsetFromCenter.y,
      },
      width: component.courtyard.width,
      height: component.courtyard.height,
    }
  }

  if (component.pads.length === 0) return undefined

  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const pad of component.pads) {
    const absoluteCenter =
      pad.absoluteCenter ??
      (component.center
        ? {
            x: component.center.x + pad.offset.x,
            y: component.center.y + pad.offset.y,
          }
        : pad.offset)
    minX = Math.min(minX, absoluteCenter.x - pad.size.x / 2)
    minY = Math.min(minY, absoluteCenter.y - pad.size.y / 2)
    maxX = Math.max(maxX, absoluteCenter.x + pad.size.x / 2)
    maxY = Math.max(maxY, absoluteCenter.y + pad.size.y / 2)
  }

  return {
    obstacleId: component.componentId,
    absoluteCenter: { x: (minX + maxX) / 2, y: (minY + maxY) / 2 },
    width: maxX - minX,
    height: maxY - minY,
  }
}

// Opposite-side component bodies may overlap, but plated holes and vias occupy
// every copper layer listed on the primitive and must remain collision geometry.
const getCrossLayerPadObstacles = ({
  components,
  targetLayer,
  db,
}: {
  components: InputComponent[]
  targetLayer: LayerRef
  db: CircuitJsonUtilObjects
}): InputObstacle[] =>
  components.flatMap((component) =>
    component.pads.flatMap((pad) => {
      const platedHole = db.pcb_plated_hole.get(pad.padId)
      const via = db.pcb_via.get(pad.padId)
      const layers = platedHole?.layers ?? via?.layers
      if (!layers?.includes(targetLayer)) return []

      const absoluteCenter =
        pad.absoluteCenter ??
        (component.center
          ? {
              x: component.center.x + pad.offset.x,
              y: component.center.y + pad.offset.y,
            }
          : pad.offset)

      return [
        {
          obstacleId: `cross_layer_${targetLayer}_${pad.padId}`,
          absoluteCenter,
          width: pad.size.x,
          height: pad.size.y,
        },
      ]
    }),
  )

export const Group_doInitialPcbLayoutPack = (group: Group) => {
  const { db } = group.root!
  const { _parsedProps: props } = group

  // Emit packing:start event
  group.root?.emit("packing:start", {
    subcircuit_id: group.subcircuit_id,
    componentDisplayName: group.getString(),
  })

  const {
    packOrderStrategy,
    packPlacementStrategy,
    gap: gapProp,
    pcbGap,
    pcbPackGap,
  } = props

  const gap = pcbPackGap ?? pcbGap ?? gapProp
  const gapMm = length.parse(gap ?? DEFAULT_MIN_GAP)

  const chipMarginsMap: Record<
    string,
    { left: number; right: number; top: number; bottom: number }
  > = {}

  // Collect pcb_component_ids that should be treated as static by the packer
  // Only collect from DIRECT children, not all descendants
  const staticPcbComponentIds = new Set<string>()

  // Recursively collect margins from all descendants
  const collectMargins = (comp: any) => {
    if (comp?.pcb_component_id && comp?._parsedProps) {
      const props = comp._parsedProps
      const left = length.parse(props.pcbMarginLeft ?? props.pcbMarginX ?? 0)
      const right = length.parse(props.pcbMarginRight ?? props.pcbMarginX ?? 0)
      const top = length.parse(props.pcbMarginTop ?? props.pcbMarginY ?? 0)
      const bottom = length.parse(
        props.pcbMarginBottom ?? props.pcbMarginY ?? 0,
      )
      if (left || right || top || bottom) {
        chipMarginsMap[comp.pcb_component_id] = { left, right, top, bottom }
      }
    }
    if (comp?.children) comp.children.forEach(collectMargins)
  }

  collectMargins(group)

  const excludedPcbGroupIds = new Set<string>()
  for (const child of group.children) {
    const childIsGroupOrNormalComponent = child as NormalComponent
    if (
      childIsGroupOrNormalComponent._isNormalComponent &&
      childIsGroupOrNormalComponent.isRelativelyPositioned?.()
    ) {
      if (childIsGroupOrNormalComponent.pcb_component_id) {
        staticPcbComponentIds.add(
          childIsGroupOrNormalComponent.pcb_component_id,
        )
      }
      if ((childIsGroupOrNormalComponent as Group).pcb_group_id) {
        excludedPcbGroupIds.add(
          (childIsGroupOrNormalComponent as Group).pcb_group_id!,
        )
      }
    }
  }

  const isDescendantGroup = (
    db: any,
    groupId: string,
    ancestorId: string,
  ): boolean => {
    if (groupId === ancestorId) return true
    const group = db.source_group.get(groupId)
    if (!group || !group.parent_source_group_id) return false
    return isDescendantGroup(db, group.parent_source_group_id, ancestorId)
  }

  // Mark all components belonging to relatively positioned groups as static
  if (excludedPcbGroupIds.size > 0) {
    for (const element of db.toArray()) {
      if (element.type !== "pcb_component") continue
      const sourceComponent = db.source_component.get(
        (element as PcbComponent).source_component_id,
      )
      if (!sourceComponent?.source_group_id) continue
      for (const groupId of excludedPcbGroupIds) {
        if (isDescendantGroup(db, sourceComponent.source_group_id, groupId)) {
          staticPcbComponentIds.add(element.pcb_component_id)
        }
      }
    }
  }

  // Keep all circuit elements; static components will remain fixed during packing
  const filteredCircuitJson = db.toArray()

  // Calculate bounds if width and height are specified
  let bounds:
    | { minX: number; minY: number; maxX: number; maxY: number }
    | undefined
  if (props.width !== undefined && props.height !== undefined) {
    const widthMm = length.parse(props.width)
    const heightMm = length.parse(props.height)

    // Bounds should be in local packing space (centered at 0,0)
    // The group's global position will be applied later by applyPackOutput
    bounds = {
      minX: -widthMm / 2,
      maxX: widthMm / 2,
      minY: -heightMm / 2,
      maxY: heightMm / 2,
    }
  }

  const initialPackOutput = convertCircuitJsonToPackOutput(
    filteredCircuitJson,
    {
      source_group_id: group.source_group_id!,
      // shouldAddInnerObstacles: true,
      chipMarginsMap,
      staticPcbComponentIds: Array.from(staticPcbComponentIds),
    },
  )

  const packInput: PackInput = {
    ...convertPackOutputToPackInput(initialPackOutput),
    // @ts-expect-error calculate-packing is missing some supported strategies
    packOrderStrategy: packOrderStrategy ?? "largest_to_smallest",
    packPlacementStrategy:
      packPlacementStrategy ?? "minimum_sum_squared_distance_to_network",
    minGap: gapMm,
    bounds,
  }

  const clusterMap = applyComponentConstraintClusters(group, packInput)

  if (debug.enabled) {
    group.root?.emit("debug:logOutput", {
      type: "debug:logOutput",
      name: `packInput-circuitjson-${group.name}`,
      content: JSON.stringify(db.toArray()),
    })
    group.root?.emit("debug:logOutput", {
      type: "debug:logOutput",
      name: `packInput-${group.name}`,
      content: packInput,
    })
  }

  const packInputs = getPackInputsByPcbLayer(packInput, db)
  const packOutput: PackOutput = {
    ...packInput,
    components: [],
  }
  let packingFailed = false
  const reportPackingError = (solverErrorMessage: string) => {
    const message = `Unable to pack all PCB components within the layout bounds: ${solverErrorMessage}`

    db.pcb_packing_error.insert({
      error_type: "pcb_packing_error",
      message,
      pcb_group_id: group.pcb_group_id ?? undefined,
      subcircuit_id: group.subcircuit_id ?? undefined,
    })
    group.root?.emit("packing:error", {
      subcircuit_id: group.subcircuit_id,
      componentDisplayName: group.getString(),
      error: { message },
    })
  }

  try {
    for (const layerPackInput of packInputs) {
      const targetLayer = getPackComponentPcbLayer(
        layerPackInput.components[0]!,
        db,
      )
      const componentIdsForLayer = new Set(
        layerPackInput.components.map((component) => component.componentId),
      )
      // Authored static components historically acted as obstacles on their own
      // layer. Preserve that behavior so existing explicitly positioned layouts
      // do not change, while the original pad-bearing components remain
      // available as opposite-layer network references below.
      const staticLayerObstacles = layerPackInput.components.flatMap(
        (component) => {
          if (!component.isStatic) return []
          const obstacle = getCollisionObstacleForStaticComponent(component)
          return obstacle ? [obstacle] : []
        },
      )
      // Aggregate packed groups can contain global geometry (for example shaft
      // holes) that is not represented by their pad-derived PCB layer. Moving
      // those groups toward an opposite-layer reference can detach them from
      // that authored geometry. Limit cross-layer references to layer-pure,
      // directly represented PCB components for now.
      const canUseCrossLayerNetworkReferences = layerPackInput.components.every(
        (component) =>
          Boolean(db.pcb_component.get(component.componentId)) &&
          !clusterMap[component.componentId],
      )
      const crossLayerStaticComponents = packInput.components.filter(
        (component) =>
          component.isStatic &&
          !componentIdsForLayer.has(component.componentId),
      )
      const fallbackCrossLayerObstacles = canUseCrossLayerNetworkReferences
        ? []
        : crossLayerStaticComponents.flatMap((component) => {
            const obstacle = getCollisionObstacleForStaticComponent(component)
            return obstacle ? [obstacle] : []
          })
      const collisionOnlyPadIds = new Set(
        [
          ...layerPackInput.components.filter(
            (component) => component.isStatic,
          ),
          ...(canUseCrossLayerNetworkReferences
            ? []
            : crossLayerStaticComponents),
        ].flatMap((component) => component.pads.map((pad) => pad.padId)),
      )
      // Include both components packed on earlier layers and authored static
      // components on later layers. This keeps cross-layer network attraction
      // independent of the top-first solve order.
      // Keep the historical epsilon for solver-produced references to avoid
      // perturbing existing layouts. Authored static references use a small but
      // representable size so they do not collapse at nonzero coordinates.
      const networkReferenceSources = new Map<
        string,
        { component: InputComponent; courtyardSize: number }
      >([
        ...packOutput.components.map(
          (component) =>
            [
              component.componentId,
              { component, courtyardSize: Number.EPSILON },
            ] as const,
        ),
        ...(canUseCrossLayerNetworkReferences
          ? crossLayerStaticComponents.map(
              (component) =>
                [
                  component.componentId,
                  { component, courtyardSize: 1e-6 },
                ] as const,
            )
          : []),
      ])
      const networkReferenceComponents = Array.from(
        networkReferenceSources.values(),
        ({ component, courtyardSize }) => ({
          ...component,
          componentId: `network_reference_${component.componentId}`,
          isStatic: true,
          // Keep opposite-layer pads available to the placement objective while
          // reducing their collision geometry to a point at the component center.
          courtyard: {
            offsetFromCenter: { x: 0, y: 0 },
            width: courtyardSize,
            height: courtyardSize,
          },
        }),
      )
      const crossLayerPadObstacles = targetLayer
        ? getCrossLayerPadObstacles({
            components: Array.from(
              networkReferenceSources.values(),
              ({ component }) => component,
            ),
            targetLayer,
            db,
          })
        : []
      const isBoardInstance = (target: any): boolean =>
        target?.componentName === "Board" || Boolean(target?.pcb_board_id)
      const isBoardGroup = isBoardInstance(group)

      const isGroupFixedInWorld = (targetGroup: Group): boolean => {
        let curr: Group | null = targetGroup
        while (curr) {
          if (isBoardInstance(curr) || !curr.parent) return true
          const parentGroup = curr.parent?.getGroup?.() as unknown as
            | Group
            | undefined
          if (!parentGroup) return true
          if (!curr.isRelativelyPositioned?.()) {
            const parentLayoutMode = parentGroup._getPcbLayoutMode?.() ?? "none"
            if (parentLayoutMode !== "none") return false
          }
          curr = parentGroup
        }
        return true
      }

      const externalPlacedObstacles: InputObstacle[] = []
      if (
        bounds !== undefined &&
        !isBoardGroup &&
        group.source_group_id &&
        isGroupFixedInWorld(group)
      ) {
        const worldToLocalTransform = inverse(
          group._computePcbGlobalTransformBeforeLayout(),
        )
        const explicitlyFixedExternalPcbCompIds = new Set<string>()
        const rootContainer = group._getBoard?.() ?? group.getSubcircuit?.()
        const collectFixedExternalIds = (comp: any) => {
          if (!comp || comp === group) return
          if (
            comp._isNormalComponent &&
            comp.pcb_component_id &&
            comp.isRelativelyPositioned?.()
          ) {
            const parentGrp = comp.getGroup?.() as Group | undefined
            if (!parentGrp || isGroupFixedInWorld(parentGrp)) {
              explicitlyFixedExternalPcbCompIds.add(comp.pcb_component_id)
            }
          }
          if (Array.isArray(comp.children)) {
            for (const child of comp.children) {
              collectFixedExternalIds(child)
            }
          }
        }
        collectFixedExternalIds(rootContainer)

        const allElements = db.toArray()
        for (const extComp of db.pcb_component.list()) {
          if (
            extComp.position_mode !== "relative_to_group_anchor" &&
            extComp.position_mode !== "packed" &&
            !explicitlyFixedExternalPcbCompIds.has(extComp.pcb_component_id)
          ) {
            continue
          }
          const sourceComp = db.source_component.get(
            extComp.source_component_id,
          )
          if (
            sourceComp?.source_group_id &&
            isDescendantGroup(
              db,
              sourceComp.source_group_id,
              group.source_group_id,
            )
          ) {
            continue
          }

          const related = structuredClone(
            allElements.filter(
              (elm) =>
                (elm.type === "pcb_component" &&
                  elm.pcb_component_id === extComp.pcb_component_id) ||
                ("pcb_component_id" in elm &&
                  elm.pcb_component_id === extComp.pcb_component_id),
            ),
          )
          transformPCBElements(related as any, worldToLocalTransform)

          const extLayer = (extComp.layer ?? "top") as LayerRef
          if (!targetLayer || extLayer === targetLayer) {
            let minX = Infinity
            let minY = Infinity
            let maxX = -Infinity
            let maxY = -Infinity
            for (const elm of related) {
              if (elm.type === "pcb_courtyard_rect") {
                minX = Math.min(minX, elm.center.x - elm.width / 2)
                maxX = Math.max(maxX, elm.center.x + elm.width / 2)
                minY = Math.min(minY, elm.center.y - elm.height / 2)
                maxY = Math.max(maxY, elm.center.y + elm.height / 2)
              } else if (elm.type === "pcb_courtyard_circle") {
                minX = Math.min(minX, elm.center.x - elm.radius)
                maxX = Math.max(maxX, elm.center.x + elm.radius)
                minY = Math.min(minY, elm.center.y - elm.radius)
                maxY = Math.max(maxY, elm.center.y + elm.radius)
              } else if (elm.type === "pcb_courtyard_outline") {
                for (const pt of elm.outline) {
                  minX = Math.min(minX, pt.x)
                  maxX = Math.max(maxX, pt.x)
                  minY = Math.min(minY, pt.y)
                  maxY = Math.max(maxY, pt.y)
                }
              }
            }
            const localComp = related.find(
              (e): e is PcbComponent => e.type === "pcb_component",
            )
            if (!Number.isFinite(minX) && localComp) {
              minX = localComp.center.x - localComp.width / 2
              maxX = localComp.center.x + localComp.width / 2
              minY = localComp.center.y - localComp.height / 2
              maxY = localComp.center.y + localComp.height / 2
            }
            if (Number.isFinite(minX) && maxX > minX && maxY > minY) {
              externalPlacedObstacles.push({
                obstacleId: `external_static_${extComp.pcb_component_id}`,
                absoluteCenter: {
                  x: (minX + maxX) / 2,
                  y: (minY + maxY) / 2,
                },
                width: maxX - minX,
                height: maxY - minY,
              })
            }
          } else {
            for (const elm of related) {
              if (
                elm.type === "pcb_plated_hole" &&
                elm.layers.includes(targetLayer)
              ) {
                const width =
                  "outer_diameter" in elm
                    ? elm.outer_diameter
                    : "outer_width" in elm
                      ? elm.outer_width
                      : 0
                const height =
                  "outer_diameter" in elm
                    ? elm.outer_diameter
                    : "outer_height" in elm
                      ? elm.outer_height
                      : 0
                if (width > 0 && height > 0) {
                  externalPlacedObstacles.push({
                    obstacleId: `external_cross_layer_${targetLayer}_${elm.pcb_plated_hole_id}`,
                    absoluteCenter: { x: elm.x, y: elm.y },
                    width,
                    height,
                  })
                }
              }
            }
          }
        }
      }

      const solverInput = {
        ...layerPackInput,
        weightedConnections: layerPackInput.weightedConnections?.filter(
          (connection) =>
            connection.padIds.every((padId) => !collisionOnlyPadIds.has(padId)),
        ),
        obstacles: [
          ...(layerPackInput.obstacles ?? []),
          ...staticLayerObstacles,
          ...fallbackCrossLayerObstacles,
          ...crossLayerPadObstacles,
          ...externalPlacedObstacles,
        ],
        components: [
          ...networkReferenceComponents,
          ...layerPackInput.components.filter(
            (component) => !component.isStatic,
          ),
        ],
      }
      let solver = new PackSolver2(solverInput)
      const solverParams = solver.getConstructorParams()
      group.root?.emit("solver:started", {
        type: "solver:started",
        solverName: "PackSolver2",
        solverParams,
        solverConstructorArgs: [solverParams],
        componentName: group.getString(),
      })

      const pcbPackSolverTimeoutMs =
        group.root?.platform?.pcbPackSolverTimeoutMs
      let { timedOut } = solvePackSolverWithTimeout(
        solver,
        pcbPackSolverTimeoutMs,
      )

      if (
        solver.failed &&
        !timedOut &&
        bounds !== undefined &&
        !isBoardGroup &&
        gap === undefined
      ) {
        for (const candidateGap of TIGHTER_BOUNDED_GAP_CANDIDATES_MM) {
          if (candidateGap >= gapMm) continue
          const retrySolver = new PackSolver2({
            ...solverInput,
            minGap: candidateGap,
          })
          const retryResult = solvePackSolverWithTimeout(
            retrySolver,
            pcbPackSolverTimeoutMs,
          )
          if (retryResult.timedOut) {
            timedOut = true
            break
          }
          if (!retrySolver.failed) {
            solver = retrySolver
            break
          }
        }
      }

      if (timedOut) {
        packingFailed = true
        reportPackingError(
          `PackSolver2 timed out after ${pcbPackSolverTimeoutMs}ms`,
        )
      }

      const packedForLayer = solver.packedComponents.filter((component) =>
        componentIdsForLayer.has(component.componentId),
      )

      if (solver.failed) {
        packingFailed = true
        const solverErrorMessage =
          solver.error ??
          solver.activeSubSolver?.error ??
          "No valid packing solution found"
        reportPackingError(solverErrorMessage)

        if (!timedOut && bounds !== undefined && !isBoardGroup) {
          const placedIds = new Set(
            packedForLayer.map((component) => component.componentId),
          )
          const unplacedComponents = layerPackInput.components.filter(
            (component) =>
              !component.isStatic && !placedIds.has(component.componentId),
          )
          if (unplacedComponents.length > 0) {
            const placedObstacles = packedForLayer.flatMap((component) => {
              const obstacle = getCollisionObstacleForStaticComponent({
                ...component,
                isStatic: true,
              })
              return obstacle ? [obstacle] : []
            })
            const fallbackSolver = new PackSolver2({
              ...solverInput,
              bounds: undefined,
              obstacles: [...(solverInput.obstacles ?? []), ...placedObstacles],
              components: unplacedComponents,
            })
            solvePackSolverWithTimeout(fallbackSolver, pcbPackSolverTimeoutMs)
            for (const fallbackPacked of fallbackSolver.packedComponents) {
              if (
                componentIdsForLayer.has(fallbackPacked.componentId) &&
                !placedIds.has(fallbackPacked.componentId)
              ) {
                packedForLayer.push(fallbackPacked)
              }
            }
          }
        }
      }

      packOutput.components.push(...packedForLayer)

      if (timedOut) break
    }
  } catch (error) {
    reportPackingError(error instanceof Error ? error.message : String(error))
    throw error
  }

  if (debug.enabled && global?.debugGraphics) {
    const graphics = getGraphicsFromPackOutput(packOutput)
    graphics.title = `packOutput-${group.name}`
    global.debugGraphics?.push(graphics)
  }

  applyPackOutput(group, packOutput, clusterMap, initialPackOutput)

  if (packingFailed) return

  // Emit packing:end event
  group.root?.emit("packing:end", {
    subcircuit_id: group.subcircuit_id,
    componentDisplayName: group.getString(),
  })
}
