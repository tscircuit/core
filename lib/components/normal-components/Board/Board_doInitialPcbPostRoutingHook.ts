import {
  type CircuitJsonUtilObjects,
  transformPCBElements,
} from "@tscircuit/circuit-json-util"
import { normalizeDegrees } from "@tscircuit/math-utils"
import type {
  AnyCircuitElement,
  PCBHole,
  PcbBoard,
  PcbPlatedHole,
  PcbPort,
  PcbSilkscreenText,
  PcbSmtPad,
  PcbTrace,
  PcbVia,
} from "circuit-json"
import type { IsolatedCircuit } from "lib/IsolatedCircuit"
import type { NormalComponent } from "lib/components/base-components/NormalComponent/NormalComponent"
import { NormalComponent_doInitialSilkscreenOverlapAdjustment } from "lib/components/base-components/NormalComponent/NormalComponent_doInitialSilkscreenOverlapAdjustment"
import type { PrimitiveComponent } from "lib/components/base-components/PrimitiveComponent"
import type { Port } from "lib/components/primitive-components/Port"
import { selectPortForPcbPrimitive } from "lib/components/primitive-components/Port/selectPortForPcbPrimitive"
import { createInstanceFromReactElement } from "lib/fiber/create-instance-from-react-element"
import { getAxisAlignedSizeFromRotatedRect } from "lib/utils/pcb/get-axis-aligned-size-from-rotated-rect"
import { type ReactElement, isValidElement } from "react"
import { compose, decomposeTSR, rotate, translate } from "transformation-matrix"
import type { Board } from "./Board"

export type PostRoutingPrimitiveTarget = string | PrimitiveComponent

export type PostRoutingPrimitiveInput =
  | PrimitiveComponent
  | ReactElement
  | Array<PrimitiveComponent | ReactElement>

export interface PostRoutingHookContext {
  board: Board
  circuit: IsolatedCircuit
  db: CircuitJsonUtilObjects
  readonly circuitJson: AnyCircuitElement[]
  readonly pcbBoard: PcbBoard | undefined
  readonly pcbTraces: PcbTrace[]
  readonly pcbVias: PcbVia[]
  readonly pcbSmtPads: PcbSmtPad[]
  readonly pcbPlatedHoles: PcbPlatedHole[]
  readonly pcbHoles: PCBHole[]
  readonly pcbPorts: PcbPort[]
  readonly pcbSilkscreenTexts: PcbSilkscreenText[]
  selectOne: <T extends PrimitiveComponent = NormalComponent>(
    selector: string,
    opts?: { type?: string },
  ) => T | null
  selectAll: <T extends PrimitiveComponent = NormalComponent>(
    selector: string,
    opts?: { type?: string },
  ) => T[]
  addFootprintPrimitive: (
    target: PostRoutingPrimitiveTarget,
    primitiveOrElement: PostRoutingPrimitiveInput,
  ) => PrimitiveComponent[]
}

export type PostRoutingHookFn = (
  ctx: PostRoutingHookContext,
) => void | AnyCircuitElement[] | Promise<void> | Promise<AnyCircuitElement[]>

const NON_PHYSICAL_PCB_PRIMITIVE_PREFIXES = [
  "Silkscreen",
  "PcbNote",
  "Courtyard",
  "FabricationNote",
]

function isPhysicalPcbPrimitive(component: PrimitiveComponent): boolean {
  if (!component.isPcbPrimitive) return false
  return !NON_PHYSICAL_PCB_PRIMITIVE_PREFIXES.some((prefix) =>
    component.componentName.startsWith(prefix),
  )
}

function getBoundsOfPcbSmtPadElement(pad: PcbSmtPad): {
  left: number
  right: number
  bottom: number
  top: number
} | null {
  if (pad.shape === "rect" || pad.shape === "pill") {
    return {
      left: pad.x - pad.width / 2,
      right: pad.x + pad.width / 2,
      bottom: pad.y - pad.height / 2,
      top: pad.y + pad.height / 2,
    }
  }
  if (pad.shape === "rotated_rect" || pad.shape === "rotated_pill") {
    const { xExtent, yExtent } = getAxisAlignedSizeFromRotatedRect({
      width: pad.width,
      height: pad.height,
      ccwRotationDegrees: pad.ccw_rotation,
    })
    return {
      left: pad.x - xExtent,
      right: pad.x + xExtent,
      bottom: pad.y - yExtent,
      top: pad.y + yExtent,
    }
  }
  if (pad.shape === "circle") {
    return {
      left: pad.x - pad.radius,
      right: pad.x + pad.radius,
      bottom: pad.y - pad.radius,
      top: pad.y + pad.radius,
    }
  }
  if (pad.shape === "polygon") {
    if (!pad.points || pad.points.length === 0) return null
    const xs = pad.points.map((p) => p.x)
    const ys = pad.points.map((p) => p.y)
    return {
      left: Math.min(...xs),
      right: Math.max(...xs),
      bottom: Math.min(...ys),
      top: Math.max(...ys),
    }
  }
  return null
}

function getBoundsOfPcbPlatedHoleElement(hole: PcbPlatedHole): {
  left: number
  right: number
  bottom: number
  top: number
} | null {
  if (hole.shape === "circle") {
    const r = hole.outer_diameter / 2
    return {
      left: hole.x - r,
      right: hole.x + r,
      bottom: hole.y - r,
      top: hole.y + r,
    }
  }
  if (hole.shape === "oval" || hole.shape === "pill") {
    const { xExtent, yExtent } = getAxisAlignedSizeFromRotatedRect({
      width: hole.outer_width,
      height: hole.outer_height,
      ccwRotationDegrees: hole.ccw_rotation ?? 0,
    })
    return {
      left: hole.x - xExtent,
      right: hole.x + xExtent,
      bottom: hole.y - yExtent,
      top: hole.y + yExtent,
    }
  }
  if (
    hole.shape === "circular_hole_with_rect_pad" ||
    hole.shape === "pill_hole_with_rect_pad" ||
    hole.shape === "rotated_pill_hole_with_rect_pad"
  ) {
    const { xExtent, yExtent } = getAxisAlignedSizeFromRotatedRect({
      width: hole.rect_pad_width,
      height: hole.rect_pad_height,
      ccwRotationDegrees: (hole as any).rect_ccw_rotation ?? 0,
    })
    return {
      left: hole.x - xExtent,
      right: hole.x + xExtent,
      bottom: hole.y - yExtent,
      top: hole.y + yExtent,
    }
  }
  if (hole.shape === "hole_with_polygon_pad") {
    const pts = hole.pad_outline
    if (!pts || pts.length === 0) return null
    const xs = pts.map((p) => hole.x + p.x)
    const ys = pts.map((p) => hole.y + p.y)
    return {
      left: Math.min(...xs),
      right: Math.max(...xs),
      bottom: Math.min(...ys),
      top: Math.max(...ys),
    }
  }
  return null
}

function getBoundsOfPcbHoleElement(hole: PCBHole): {
  left: number
  right: number
  bottom: number
  top: number
} | null {
  if (hole.hole_shape === "circle" || hole.hole_shape === "square") {
    const r = hole.hole_diameter / 2
    return {
      left: hole.x - r,
      right: hole.x + r,
      bottom: hole.y - r,
      top: hole.y + r,
    }
  }
  if (
    hole.hole_shape === "oval" ||
    hole.hole_shape === "pill" ||
    hole.hole_shape === "rect" ||
    hole.hole_shape === "rotated_pill"
  ) {
    const { xExtent, yExtent } = getAxisAlignedSizeFromRotatedRect({
      width: hole.hole_width,
      height: hole.hole_height,
      ccwRotationDegrees: (hole as any).ccw_rotation ?? 0,
    })
    return {
      left: hole.x - xExtent,
      right: hole.x + xExtent,
      bottom: hole.y - yExtent,
      top: hole.y + yExtent,
    }
  }
  return null
}

/**
 * Recompute pcb_component.width, pcb_component.height, and pcb_component.center
 * from the component's post-layout PCB primitives and Circuit JSON elements,
 * while preserving pcb_component.footprint_origin.
 */
export function recomputePcbComponentBoundsPostRouting(
  db: CircuitJsonUtilObjects,
  component: NormalComponent,
): void {
  const pcbComponentId = component.pcb_component_id
  if (!pcbComponentId) return
  const pcbComponent = db.pcb_component.get(pcbComponentId)
  if (!pcbComponent) return

  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  let hasBounds = false

  const includeRect = (rect: {
    left: number
    right: number
    bottom: number
    top: number
  }) => {
    const x0 = Math.min(rect.left, rect.right)
    const x1 = Math.max(rect.left, rect.right)
    const y0 = Math.min(rect.bottom, rect.top)
    const y1 = Math.max(rect.bottom, rect.top)
    if (!Number.isFinite(x0) || !Number.isFinite(x1)) return
    if (!Number.isFinite(y0) || !Number.isFinite(y1)) return
    minX = Math.min(minX, x0)
    maxX = Math.max(maxX, x1)
    minY = Math.min(minY, y0)
    maxY = Math.max(maxY, y1)
    hasBounds = true
  }

  const visitChildren = (children: PrimitiveComponent[]) => {
    for (const child of children) {
      if ((child as any)._isNormalComponent) continue
      if (isPhysicalPcbPrimitive(child)) {
        try {
          const cjBounds = child._getPcbCircuitJsonBounds()
          if (cjBounds.width > 0 || cjBounds.height > 0) {
            includeRect(cjBounds.bounds)
          }
        } catch {
          // Ignore primitives without circuit json bounds implementation
        }
      }
      if (child.children && child.children.length > 0) {
        visitChildren(child.children)
      }
    }
  }
  visitChildren(component.children)

  for (const pad of db.pcb_smtpad.list({ pcb_component_id: pcbComponentId })) {
    const rect = getBoundsOfPcbSmtPadElement(pad)
    if (rect) includeRect(rect)
  }
  for (const hole of db.pcb_plated_hole.list({
    pcb_component_id: pcbComponentId,
  })) {
    const rect = getBoundsOfPcbPlatedHoleElement(hole)
    if (rect) includeRect(rect)
  }
  for (const hole of db.pcb_hole.list({ pcb_component_id: pcbComponentId })) {
    const rect = getBoundsOfPcbHoleElement(hole)
    if (rect) includeRect(rect)
  }

  if (!hasBounds) return
  const width = Math.max(0, maxX - minX)
  const height = Math.max(0, maxY - minY)
  if (width === 0 && height === 0) return

  const center = {
    x: (minX + maxX) / 2,
    y: (minY + maxY) / 2,
  }

  db.pcb_component.update(pcbComponentId, {
    center,
    width,
    height,
  })
}

function collectUnrenderedPcbPrimitives(
  root: PrimitiveComponent,
  out: PrimitiveComponent[] = [],
): PrimitiveComponent[] {
  if (
    root.isPcbPrimitive &&
    !root.renderPhaseStates.PcbPrimitiveRender.initialized
  ) {
    out.push(root)
  }
  for (const child of root.children) {
    collectUnrenderedPcbPrimitives(child, out)
  }
  return out
}

function materializePostRoutingPrimitive(
  board: Board,
  primitiveOrContainer: PrimitiveComponent,
  affectedNormalComponents: Set<NormalComponent>,
): void {
  const { db } = board.root!
  const leaves = collectUnrenderedPcbPrimitives(primitiveOrContainer)

  for (const leaf of leaves) {
    const normalComp = leaf.getParentNormalComponent() as NormalComponent | null
    if (normalComp) {
      affectedNormalComponents.add(normalComp)
    }

    if (!leaf.renderPhaseStates.PortMatching.initialized) {
      leaf.runRenderPhase("PortMatching")
    }

    const matchedPort = (leaf as any).matchedPort as Port | null | undefined
    if (matchedPort) {
      if (!matchedPort.pcb_port_id && matchedPort.source_port_id) {
        const existingPcbPort = db.pcb_port
          .list({ source_port_id: matchedPort.source_port_id })
          .find((p) => Boolean(p.pcb_component_id))
        if (existingPcbPort) {
          matchedPort.pcb_port_id = existingPcbPort.pcb_port_id
        }
      }
      if (!matchedPort.pcb_port_id) {
        matchedPort.updatePcbPortRender?.()
      } else {
        const pcbPort = db.pcb_port.get(matchedPort.pcb_port_id)
        const newLayers = (leaf as any).getAvailablePcbLayers?.() as
          | string[]
          | undefined
        if (pcbPort && newLayers && newLayers.length > 0) {
          const mergedLayers = Array.from(
            new Set([...(pcbPort.layers ?? []), ...newLayers]),
          )
          if (mergedLayers.length !== (pcbPort.layers?.length ?? 0)) {
            db.pcb_port.update(pcbPort.pcb_port_id, {
              layers: mergedLayers as any,
            })
          }
        }
      }
    }

    const beforeElements = new Set<AnyCircuitElement>(db.toArray())

    leaf.runRenderPhase("PcbPrimitiveRender")
    leaf.runRenderPhase("PcbPortAttachment")

    const addedElements = db.toArray().filter((elm) => !beforeElements.has(elm))

    if (normalComp?.pcb_component_id && addedElements.length > 0) {
      const pcbComponent = db.pcb_component.get(normalComp.pcb_component_id)
      if (pcbComponent) {
        const preLayoutOrigin = normalComp._getGlobalPcbPositionBeforeLayout()
        const postLayoutOrigin =
          pcbComponent.footprint_origin ?? preLayoutOrigin
        const preLayoutTransform =
          normalComp._computePcbGlobalTransformBeforeLayout()
        const preLayoutRotation = normalizeDegrees(
          (decomposeTSR(preLayoutTransform).rotation.angle * 180) / Math.PI,
        )
        const postLayoutRotation = normalizeDegrees(
          pcbComponent.rotation ?? preLayoutRotation,
        )
        const deltaRotationDeg = normalizeDegrees(
          postLayoutRotation - preLayoutRotation,
        )
        const dx = postLayoutOrigin.x - preLayoutOrigin.x
        const dy = postLayoutOrigin.y - preLayoutOrigin.y
        if (
          Math.abs(dx) > 1e-6 ||
          Math.abs(dy) > 1e-6 ||
          (Math.abs(deltaRotationDeg) > 1e-6 &&
            Math.abs(deltaRotationDeg - 360) > 1e-6)
        ) {
          const layoutDeltaMatrix = compose(
            translate(postLayoutOrigin.x, postLayoutOrigin.y),
            rotate((deltaRotationDeg * Math.PI) / 180),
            translate(-preLayoutOrigin.x, -preLayoutOrigin.y),
          )
          transformPCBElements(addedElements as any, layoutDeltaMatrix)
        }
      }
    }
  }
}

function attachMissingPcbPortsForDirectDbPads(
  board: Board,
  affectedNormalComponents: Set<NormalComponent>,
): void {
  const { db } = board.root!
  const normalComponentsByPcbId = new Map<string, NormalComponent>()
  for (const desc of board.getDescendants()) {
    if ((desc as any)._isNormalComponent && desc.pcb_component_id) {
      normalComponentsByPcbId.set(
        desc.pcb_component_id,
        desc as NormalComponent,
      )
    }
  }

  for (const pad of db.pcb_smtpad.list()) {
    if (pad.pcb_port_id || !pad.pcb_component_id) continue
    const normalComp = normalComponentsByPcbId.get(pad.pcb_component_id)
    if (!normalComp) continue
    affectedNormalComponents.add(normalComp)
    const hints = pad.port_hints ?? []
    if (hints.length === 0) continue
    const parentPorts = normalComp.selectAll("port") as Port[]
    const matchedPort = selectPortForPcbPrimitive(
      parentPorts,
      normalComp,
      hints,
    )
    if (matchedPort?.pcb_port_id) {
      db.pcb_smtpad.update(pad.pcb_smtpad_id, {
        pcb_port_id: matchedPort.pcb_port_id,
      })
    }
  }

  for (const hole of db.pcb_plated_hole.list()) {
    if (hole.pcb_port_id || !hole.pcb_component_id) continue
    const normalComp = normalComponentsByPcbId.get(hole.pcb_component_id)
    if (!normalComp) continue
    affectedNormalComponents.add(normalComp)
    const hints = hole.port_hints ?? []
    if (hints.length === 0) continue
    const parentPorts = normalComp.selectAll("port") as Port[]
    const matchedPort = selectPortForPcbPrimitive(
      parentPorts,
      normalComp,
      hints,
    )
    if (matchedPort?.pcb_port_id) {
      db.pcb_plated_hole.update(hole.pcb_plated_hole_id, {
        pcb_port_id: matchedPort.pcb_port_id,
      })
    }
  }
}

function finalizePostRoutingChanges(
  board: Board,
  returnedElements: unknown,
  affectedNormalComponents: Set<NormalComponent>,
): void {
  const { db } = board.root!

  if (Array.isArray(returnedElements) && returnedElements.length > 0) {
    const existingSet = new Set<AnyCircuitElement>(db.toArray())
    const toInsert = returnedElements.filter((elm) => !existingSet.has(elm))
    if (toInsert.length > 0) {
      db.insertAll(toInsert)
    }
  }

  // Materialize any primitives added directly via chip.add(...) or footprint.add(...)
  for (const descendant of board.getDescendants()) {
    if (
      descendant.isPcbPrimitive &&
      !descendant.renderPhaseStates.PcbPrimitiveRender.initialized
    ) {
      materializePostRoutingPrimitive(
        board,
        descendant,
        affectedNormalComponents,
      )
    }
  }

  attachMissingPcbPortsForDirectDbPads(board, affectedNormalComponents)

  // Also recompute bounds for all normal components on the board in case
  // existing db elements were mutated in place during the hook.
  for (const descendant of board.getDescendants()) {
    if ((descendant as any)._isNormalComponent && descendant.pcb_component_id) {
      recomputePcbComponentBoundsPostRouting(db, descendant as NormalComponent)
    }
  }
  for (const comp of affectedNormalComponents) {
    recomputePcbComponentBoundsPostRouting(db, comp)
  }

  // Re-run silkscreen overlap adjustment if component bounds changed
  for (const descendant of board.getDescendants()) {
    if ((descendant as any)._isNormalComponent && descendant.pcb_component_id) {
      NormalComponent_doInitialSilkscreenOverlapAdjustment(
        descendant as NormalComponent,
      )
    }
  }

  // Reset DRC completion state and mark downstream phases dirty so copper pours
  // and DRC re-evaluate with the post-routing copper changes.
  board._drcChecksComplete = false
  board._markDirty("PcbCopperPourRender")
}

function resolveTargetComponent(
  board: Board,
  target: PostRoutingPrimitiveTarget,
): PrimitiveComponent {
  if (typeof target !== "string") {
    return target
  }
  let found = board.selectOne(target)
  if (!found && !target.startsWith(".")) {
    found = board.selectOne(`.${target}`)
  }
  if (!found) {
    throw new Error(
      `Could not find target component for selector "${target}" in post-routing hook`,
    )
  }
  return found
}

function collectPostRoutingHooks(board: Board): PostRoutingHookFn[] {
  const hooks = new Set<PostRoutingHookFn>()

  const addIfFn = (maybeFn: unknown) => {
    if (typeof maybeFn === "function") {
      hooks.add(maybeFn as PostRoutingHookFn)
    }
  }

  addIfFn((board.props as any)?.onPostRouting)
  addIfFn((board.props as any)?.postRoutingHook)
  addIfFn((board._parsedProps as any)?.onPostRouting)
  addIfFn((board._parsedProps as any)?.postRoutingHook)

  for (const descendant of board.getDescendants()) {
    if (descendant.isGroup) {
      addIfFn((descendant.props as any)?.onPostRouting)
      addIfFn((descendant.props as any)?.postRoutingHook)
      addIfFn((descendant._parsedProps as any)?.onPostRouting)
      addIfFn((descendant._parsedProps as any)?.postRoutingHook)
    }
  }

  const rootCircuit = board.root
  if (rootCircuit) {
    for (const hook of rootCircuit._postRoutingHooks ?? []) {
      addIfFn(hook)
    }
    addIfFn((rootCircuit.platform as any)?.onPostRouting)
    addIfFn((rootCircuit.platform as any)?.postRoutingHook)
  }

  return Array.from(hooks)
}

export function Board_doInitialPcbPostRoutingHook(board: Board): void {
  if (board.root?.pcbDisabled) return
  if (
    (board as any)._shouldRouteAsync?.() &&
    (board as any)._hasTracesToRoute?.() &&
    !(board as any)._hasStartedAsyncAutorouting &&
    !(board as any)._areChildSubcircuitsRouted?.()
  ) {
    return
  }

  const hooks = collectPostRoutingHooks(board)
  if (hooks.length === 0) return

  if (board._hasExecutedPostRoutingHooks) return
  board._hasExecutedPostRoutingHooks = true

  const circuit = board.root!
  const { db } = circuit
  const affectedNormalComponents = new Set<NormalComponent>()

  const ctx: PostRoutingHookContext = {
    board,
    circuit,
    db,
    get circuitJson() {
      return db.toArray()
    },
    get pcbBoard() {
      return board.pcb_board_id
        ? (db.pcb_board.get(board.pcb_board_id) ?? undefined)
        : db.pcb_board.list()[0]
    },
    get pcbTraces() {
      return db.pcb_trace.list()
    },
    get pcbVias() {
      return db.pcb_via.list()
    },
    get pcbSmtPads() {
      return db.pcb_smtpad.list()
    },
    get pcbPlatedHoles() {
      return db.pcb_plated_hole.list()
    },
    get pcbHoles() {
      return db.pcb_hole.list()
    },
    get pcbPorts() {
      return db.pcb_port.list()
    },
    get pcbSilkscreenTexts() {
      return db.pcb_silkscreen_text.list()
    },
    selectOne: (selector, opts) =>
      board.selectOne(selector, opts as any) as any,
    selectAll: (selector) => board.selectAll(selector) as any,
    addFootprintPrimitive: (target, primitiveOrElement) => {
      const targetComp = resolveTargetComponent(board, target)
      const normalComp = (
        (targetComp as any)._isNormalComponent
          ? targetComp
          : targetComp.getParentNormalComponent()
      ) as NormalComponent | null
      const footprintContainer =
        targetComp.componentName === "Footprint"
          ? targetComp
          : (normalComp?.children.find(
              (c) => c.componentName === "Footprint",
            ) ??
            normalComp ??
            targetComp)

      const items = Array.isArray(primitiveOrElement)
        ? primitiveOrElement
        : [primitiveOrElement]
      const addedInstances: PrimitiveComponent[] = []

      for (const item of items) {
        const instance = isValidElement(item)
          ? createInstanceFromReactElement(item)
          : (item as PrimitiveComponent)
        footprintContainer.add(instance)
        materializePostRoutingPrimitive(
          board,
          instance,
          affectedNormalComponents,
        )
        addedInstances.push(instance)
      }

      if (normalComp) {
        recomputePcbComponentBoundsPostRouting(db, normalComp)
      }

      return addedInstances
    },
  }

  let chainPromise: Promise<void> | null = null

  for (let i = 0; i < hooks.length; i++) {
    const hook = hooks[i]!
    if (chainPromise) {
      chainPromise = chainPromise
        .then(() => hook(ctx))
        .then((res) => {
          finalizePostRoutingChanges(board, res, affectedNormalComponents)
        })
      continue
    }

    const result = hook(ctx)
    if (
      result instanceof Promise ||
      (result && typeof (result as any).then === "function")
    ) {
      chainPromise = Promise.resolve(result).then((res) => {
        finalizePostRoutingChanges(board, res, affectedNormalComponents)
      })
    } else {
      finalizePostRoutingChanges(board, result, affectedNormalComponents)
    }
  }

  if (chainPromise) {
    board._queueAsyncEffect("pcb-post-routing-hook", async () => {
      await chainPromise
    })
  }
}
