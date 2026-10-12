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
import type { CircuitJsonUtilObjects } from "@tscircuit/circuit-json-util"
import { type LayerRef, type PcbComponent, length } from "circuit-json"
import Debug from "debug"
import type { NormalComponent } from "lib/components/base-components/NormalComponent"
import { solvePackSolverWithTimeout } from "lib/utils/packing/solvePackSolverWithTimeout"
import type { Group } from "../Group"
import { applyComponentConstraintClusters } from "./applyComponentConstraintClusters"
import { applyPackOutput } from "./applyPackOutput"
import { applyToPoint, inverse } from "transformation-matrix"
import {
  getPackComponentPcbLayer,
  getPackInputsByPcbLayer,
} from "./getPackInputsByPcbLayer"

const DEFAULT_MIN_GAP = "1mm"
const debug = Debug("Group_doInitialPcbLayoutPack")

const isDescendantGroup = (
  db: any,
  groupId: string | null | undefined,
  ancestorId: string | null | undefined,
): boolean => {
  if (!groupId || !ancestorId) return false
  if (groupId === ancestorId) return true
  const group = db.source_group.get(groupId)
  if (!group || !group.parent_source_group_id) return false
  return isDescendantGroup(db, group.parent_source_group_id, ancestorId)
}

const getOutsideStaticObstacles = ({
  group,
  bounds,
  targetLayer,
  db,
}: {
  group: Group
  bounds?: { minX: number; minY: number; maxX: number; maxY: number }
  targetLayer?: LayerRef
  db: CircuitJsonUtilObjects
}): InputObstacle[] => {
  if (!bounds) return []
  const obstacles: InputObstacle[] = []
  const groupTransform = group._computePcbGlobalTransformBeforeLayout()
  let invGroupTransform: any
  try {
    invGroupTransform = inverse(groupTransform)
  } catch {
    return []
  }

  const pcbComponents = db.pcb_component?.list ? db.pcb_component.list() : []

  for (const pcbComp of pcbComponents) {
    if (!pcbComp.center || pcbComp.position_mode === "packed") continue
    const srcComp = db.source_component.get(pcbComp.source_component_id)
    const compGroupId = srcComp?.source_group_id
    if (
      compGroupId &&
      group.source_group_id &&
      isDescendantGroup(db, compGroupId, group.source_group_id)
    ) {
      continue
    }

    const compLayer = pcbComp.layer ?? "top"
    const pads = db.pcb_smtpad?.list
      ? db.pcb_smtpad.list({ pcb_component_id: pcbComp.pcb_component_id })
      : []
    const platedHoles = db.pcb_plated_hole?.list
      ? db.pcb_plated_hole.list({ pcb_component_id: pcbComp.pcb_component_id })
      : []

    const occupiesTargetLayer =
      !targetLayer ||
      compLayer === targetLayer ||
      platedHoles.some((ph) => ph.layers?.includes(targetLayer)) ||
      pads.some((pad) => pad.layer === targetLayer)

    if (!occupiesTargetLayer) continue

    const localCenter = applyToPoint(invGroupTransform, pcbComp.center)

    let width = pcbComp.width ?? 0
    let height = pcbComp.height ?? 0

    const courtyardRects = db.pcb_courtyard_rect?.list
      ? db.pcb_courtyard_rect.list({
          pcb_component_id: pcbComp.pcb_component_id,
        })
      : []
    for (const cy of courtyardRects) {
      if (cy.width && cy.height) {
        width = Math.max(width, cy.width)
        height = Math.max(height, cy.height)
      }
    }

    if (width === 0 || height === 0) {
      let minX = Infinity
      let minY = Infinity
      let maxX = -Infinity
      let maxY = -Infinity
      for (const pad of pads) {
        const padAny = pad as any
        const px = typeof padAny.x === "number" ? padAny.x : 0
        const py = typeof padAny.y === "number" ? padAny.y : 0
        const pw =
          typeof padAny.width === "number"
            ? padAny.width
            : typeof padAny.radius === "number"
              ? padAny.radius * 2
              : 0
        const ph =
          typeof padAny.height === "number"
            ? padAny.height
            : typeof padAny.radius === "number"
              ? padAny.radius * 2
              : 0
        minX = Math.min(minX, px - pw / 2)
        maxX = Math.max(maxX, px + pw / 2)
        minY = Math.min(minY, py - ph / 2)
        maxY = Math.max(maxY, py + ph / 2)
      }
      for (const ph of platedHoles) {
        const phAny = ph as any
        const px = typeof phAny.x === "number" ? phAny.x : 0
        const py = typeof phAny.y === "number" ? phAny.y : 0
        const d =
          (typeof phAny.outer_diameter === "number"
            ? phAny.outer_diameter
            : typeof phAny.hole_diameter === "number"
              ? phAny.hole_diameter
              : 0) / 2
        minX = Math.min(minX, px - d)
        maxX = Math.max(maxX, px + d)
        minY = Math.min(minY, py - d)
        maxY = Math.max(maxY, py + d)
      }
      if (minX !== Infinity) {
        width = maxX - minX
        height = maxY - minY
      }
    }

    if (width > 0 && height > 0) {
      const obsMinX = localCenter.x - width / 2
      const obsMaxX = localCenter.x + width / 2
      const obsMinY = localCenter.y - height / 2
      const obsMaxY = localCenter.y + height / 2

      const intersectsBounds =
        obsMinX <= bounds.maxX &&
        obsMaxX >= bounds.minX &&
        obsMinY <= bounds.maxY &&
        obsMaxY >= bounds.minY

      if (intersectsBounds) {
        obstacles.push({
          obstacleId: `outside_${pcbComp.pcb_component_id}`,
          absoluteCenter: localCenter,
          width,
          height,
        })
      }
    }
  }

  return obstacles
}

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
      const outsideStaticObstacles = getOutsideStaticObstacles({
        group,
        bounds,
        targetLayer,
        db,
      })
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
          ...outsideStaticObstacles,
        ],
        components: [
          ...networkReferenceComponents,
          ...layerPackInput.components.filter(
            (component) => !component.isStatic,
          ),
        ],
      }
      const solver = new PackSolver2(solverInput)
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
      const { timedOut } = solvePackSolverWithTimeout(
        solver,
        pcbPackSolverTimeoutMs,
      )

      if (timedOut) {
        packingFailed = true
        reportPackingError(
          `PackSolver2 timed out after ${pcbPackSolverTimeoutMs}ms`,
        )
      }

      if (solver.failed) {
        packingFailed = true
        const solverErrorMessage =
          solver.error ??
          solver.activeSubSolver?.error ??
          "No valid packing solution found"
        reportPackingError(solverErrorMessage)
      }

      packOutput.components.push(
        ...solver.packedComponents.filter((component) =>
          componentIdsForLayer.has(component.componentId),
        ),
      )

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
