import type { Group } from "./Group"
import type { Constraint } from "../Constraint"
import * as kiwi from "@lume/kiwi"
import {
  transformPCBElements,
} from "@tscircuit/circuit-json-util"
import { translate } from "transformation-matrix"

/**
 * Applies constraint-based positioning to child components/groups when the
 * parent group uses relative layout mode (no explicit pack/grid/flex).
 *
 * This enables syntax like:
 *   <constraint pcb xDist="20mm" left=".group1" right=".group2" centerToCenter />
 *
 * It resolves constraint equations with a kiwi solver and then translates
 * the affected components to their solved positions.
 */
export const Group_doInitialPcbLayoutRelativeConstraints = (group: Group) => {
  const { db } = group.root!

  const constraints = group.children.filter(
    (c): c is Constraint =>
      c.componentName === "Constraint" && c._parsedProps.pcb,
  )

  if (constraints.length === 0) return

  // Helper: resolve a selector like ".R1" or ".group1" to a child component
  const resolveSelector = (
    selector: string,
  ): { component: (typeof group.children)[number]; id: string } | null => {
    const name = selector.startsWith(".") ? selector.slice(1) : selector
    const child = group.children.find((c) => (c as any).name === name)
    if (!child) return null
    const id =
      child.pcb_component_id ??
      (child as Group).pcb_group_id ??
      undefined
    if (!id) return null
    return { component: child, id }
  }

  // Helper: get the current center position of a component or group
  const getCenter = (
    child: (typeof group.children)[number],
  ): { x: number; y: number } => {
    if (child.pcb_component_id) {
      const pcbComp = db.pcb_component.get(child.pcb_component_id)
      if (pcbComp) return pcbComp.center
    }
    if ((child as Group).pcb_group_id) {
      const pcbGroup = db.pcb_group.get((child as Group).pcb_group_id!)
      if (pcbGroup?.center) return pcbGroup.center
    }
    return child._getGlobalPcbPositionBeforeLayout()
  }

  // Helper: get the bounds of a component or group for edge-to-edge
  const getBounds = (
    child: (typeof group.children)[number],
  ): { minX: number; maxX: number; minY: number; maxY: number } | null => {
    const compId = child.pcb_component_id
    if (compId) {
      const pads = db.pcb_smtpad
        .list()
        .filter((p) => p.pcb_component_id === compId)
      if (pads.length > 0) {
        let minX = Infinity
        let maxX = -Infinity
        let minY = Infinity
        let maxY = -Infinity
        for (const pad of pads) {
          const px = (pad as any).x ?? 0
          const py = (pad as any).y ?? 0
          const pw =
            "width" in pad ? (pad.width as number) : "radius" in pad ? (pad.radius as number) * 2 : 0
          const ph =
            "height" in pad ? (pad.height as number) : "radius" in pad ? (pad.radius as number) * 2 : 0
          minX = Math.min(minX, px - pw / 2)
          maxX = Math.max(maxX, px + pw / 2)
          minY = Math.min(minY, py - ph / 2)
          maxY = Math.max(maxY, py + ph / 2)
        }
        return { minX, maxX, minY, maxY }
      }
    }
    // For groups, compute bounds from the pcb_group record
    const groupChild = child as Group
    if (groupChild.pcb_group_id) {
      const groupData = db.pcb_group.get(groupChild.pcb_group_id)
      if (groupData?.center && groupData.width && groupData.height) {
        return {
          minX: groupData.center.x - groupData.width / 2,
          maxX: groupData.center.x + groupData.width / 2,
          minY: groupData.center.y - groupData.height / 2,
          maxY: groupData.center.y + groupData.height / 2,
        }
      }
    }
    return null
  }

  // Collect all constrained component IDs and build union-find
  const parent: Record<string, string> = {}
  const find = (x: string): string => {
    if (parent[x] !== x) parent[x] = find(parent[x])
    return parent[x]
  }
  const union = (a: string, b: string) => {
    const ra = find(a)
    const rb = find(b)
    if (ra !== rb) parent[rb] = ra
  }
  const makeSet = (x: string) => {
    if (!(x in parent)) parent[x] = x
  }

  // Map from id to component reference
  const idToChild = new Map<
    string,
    (typeof group.children)[number]
  >()

  for (const constraint of constraints) {
    const props = constraint._parsedProps as any

    const selectors: string[] = []
    if ("left" in props) selectors.push(props.left)
    if ("right" in props) selectors.push(props.right)
    if ("top" in props) selectors.push(props.top)
    if ("bottom" in props) selectors.push(props.bottom)
    if ("for" in props && Array.isArray(props.for)) selectors.push(...props.for)

    const ids: string[] = []
    for (const sel of selectors) {
      const resolved = resolveSelector(sel)
      if (resolved) {
        makeSet(resolved.id)
        idToChild.set(resolved.id, resolved.component)
        ids.push(resolved.id)
      }
    }

    for (let i = 1; i < ids.length; i++) {
      union(ids[0], ids[i])
    }
  }

  // Group constraints by cluster root
  const clusterConstraints = new Map<string, Constraint[]>()
  const clusterIds = new Map<string, Set<string>>()

  for (const id of Object.keys(parent)) {
    const root = find(id)
    if (!clusterIds.has(root)) clusterIds.set(root, new Set())
    clusterIds.get(root)!.add(id)
  }

  for (const constraint of constraints) {
    const props = constraint._parsedProps as any
    let firstId: string | undefined
    if ("left" in props) firstId = resolveSelector(props.left)?.id
    else if ("top" in props) firstId = resolveSelector(props.top)?.id
    else if ("for" in props) firstId = resolveSelector(props.for[0])?.id
    if (!firstId) continue
    const root = find(firstId)
    if (!clusterConstraints.has(root))
      clusterConstraints.set(root, [])
    clusterConstraints.get(root)!.push(constraint)
  }

  // For each cluster, solve constraints and apply offsets
  for (const [rootId, ids] of clusterIds.entries()) {
    const clusterConstrs = clusterConstraints.get(rootId) ?? []
    if (clusterConstrs.length === 0) continue

    const idArray = Array.from(ids)
    const solver = new kiwi.Solver()
    const kVars: Record<string, kiwi.Variable> = {}
    const getVar = (id: string, axis: "x" | "y") => {
      const key = `${id}_${axis}`
      if (!kVars[key]) kVars[key] = new kiwi.Variable(key)
      return kVars[key]
    }

    // Record original positions so we can compute the delta
    const originalPositions = new Map<string, { x: number; y: number }>()
    for (const id of idArray) {
      const child = idToChild.get(id)!
      originalPositions.set(id, getCenter(child))
    }

    // Anchor the first component at its current position (strong but not required)
    const anchorId = idArray[0]
    const anchorPos = originalPositions.get(anchorId)!
    solver.addConstraint(
      new kiwi.Constraint(
        getVar(anchorId, "x"),
        kiwi.Operator.Eq,
        anchorPos.x,
        kiwi.Strength.strong,
      ),
    )
    solver.addConstraint(
      new kiwi.Constraint(
        getVar(anchorId, "y"),
        kiwi.Operator.Eq,
        anchorPos.y,
        kiwi.Strength.strong,
      ),
    )

    // For non-anchor components, weakly prefer their current position
    for (const id of idArray) {
      if (id === anchorId) continue
      const pos = originalPositions.get(id)!
      solver.addConstraint(
        new kiwi.Constraint(
          getVar(id, "x"),
          kiwi.Operator.Eq,
          pos.x,
          kiwi.Strength.weak,
        ),
      )
      solver.addConstraint(
        new kiwi.Constraint(
          getVar(id, "y"),
          kiwi.Operator.Eq,
          pos.y,
          kiwi.Strength.weak,
        ),
      )
    }

    // Add actual constraint equations
    for (const constraint of clusterConstrs) {
      const props = constraint._parsedProps as any

      if ("xDist" in props && "left" in props && "right" in props) {
        const leftRes = resolveSelector(props.left)
        const rightRes = resolveSelector(props.right)
        if (!leftRes || !rightRes) continue

        const dist = props.xDist as number

        if (props.edgeToEdge) {
          // edge-to-edge: right.minX - left.maxX = dist
          // We approximate by using center + half-width offsets
          const leftBounds = getBounds(leftRes.component)
          const rightBounds = getBounds(rightRes.component)
          const leftCenter = originalPositions.get(leftRes.id)!
          const rightCenter = originalPositions.get(rightRes.id)!

          const leftHalfWidth = leftBounds
            ? leftBounds.maxX - leftCenter.x
            : 0
          const rightHalfWidth = rightBounds
            ? rightCenter.x - rightBounds.minX
            : 0

          // rightVar - leftVar = dist + leftHalfWidth + rightHalfWidth
          solver.addConstraint(
            new kiwi.Constraint(
              new kiwi.Expression(
                getVar(rightRes.id, "x"),
                [-1, getVar(leftRes.id, "x")],
              ),
              kiwi.Operator.Eq,
              dist + leftHalfWidth + rightHalfWidth,
              kiwi.Strength.required,
            ),
          )
        } else {
          // centerToCenter (default): rightX - leftX = dist
          solver.addConstraint(
            new kiwi.Constraint(
              new kiwi.Expression(
                getVar(rightRes.id, "x"),
                [-1, getVar(leftRes.id, "x")],
              ),
              kiwi.Operator.Eq,
              dist,
              kiwi.Strength.required,
            ),
          )
        }
      }

      if ("yDist" in props && "top" in props && "bottom" in props) {
        const topRes = resolveSelector(props.top)
        const bottomRes = resolveSelector(props.bottom)
        if (!topRes || !bottomRes) continue

        const dist = props.yDist as number

        if (props.edgeToEdge) {
          const topBounds = getBounds(topRes.component)
          const bottomBounds = getBounds(bottomRes.component)
          const topCenter = originalPositions.get(topRes.id)!
          const bottomCenter = originalPositions.get(bottomRes.id)!

          // In PCB coordinates, Y increases downward, but "top" typically
          // means smaller Y. We compute: bottomVar - topVar = dist + offsets
          const topHalfHeight = topBounds
            ? topBounds.maxY - topCenter.y
            : 0
          const bottomHalfHeight = bottomBounds
            ? bottomCenter.y - bottomBounds.minY
            : 0

          solver.addConstraint(
            new kiwi.Constraint(
              new kiwi.Expression(
                getVar(bottomRes.id, "y"),
                [-1, getVar(topRes.id, "y")],
              ),
              kiwi.Operator.Eq,
              dist + topHalfHeight + bottomHalfHeight,
              kiwi.Strength.required,
            ),
          )
        } else {
          solver.addConstraint(
            new kiwi.Constraint(
              new kiwi.Expression(
                getVar(bottomRes.id, "y"),
                [-1, getVar(topRes.id, "y")],
              ),
              kiwi.Operator.Eq,
              dist,
              kiwi.Strength.required,
            ),
          )
        }
      }

      if ("sameX" in props && Array.isArray(props.for)) {
        const resolvedIds = props.for
          .map((s: string) => resolveSelector(s)?.id)
          .filter((id: string | undefined): id is string => !!id)
        if (resolvedIds.length > 1) {
          for (let i = 1; i < resolvedIds.length; i++) {
            solver.addConstraint(
              new kiwi.Constraint(
                new kiwi.Expression(
                  getVar(resolvedIds[i], "x"),
                  [-1, getVar(resolvedIds[0], "x")],
                ),
                kiwi.Operator.Eq,
                0,
                kiwi.Strength.required,
              ),
            )
          }
        }
      }

      if ("sameY" in props && Array.isArray(props.for)) {
        const resolvedIds = props.for
          .map((s: string) => resolveSelector(s)?.id)
          .filter((id: string | undefined): id is string => !!id)
        if (resolvedIds.length > 1) {
          for (let i = 1; i < resolvedIds.length; i++) {
            solver.addConstraint(
              new kiwi.Constraint(
                new kiwi.Expression(
                  getVar(resolvedIds[i], "y"),
                  [-1, getVar(resolvedIds[0], "y")],
                ),
                kiwi.Operator.Eq,
                0,
                kiwi.Strength.required,
              ),
            )
          }
        }
      }
    }

    solver.updateVariables()

    // Apply solved positions by translating components
    for (const id of idArray) {
      const child = idToChild.get(id)!
      const originalPos = originalPositions.get(id)!
      const solvedX = getVar(id, "x").value()
      const solvedY = getVar(id, "y").value()

      const dx = solvedX - originalPos.x
      const dy = solvedY - originalPos.y

      if (Math.abs(dx) < 1e-9 && Math.abs(dy) < 1e-9) continue

      const translationMatrix = translate(dx, dy)

      if (child.pcb_component_id) {
        // Translate the component and all related PCB elements
        const related = db
          .toArray()
          .filter(
            (elm) =>
              "pcb_component_id" in elm &&
              elm.pcb_component_id === child.pcb_component_id,
          )
        transformPCBElements(related as any, translationMatrix)
      } else if ((child as Group).pcb_group_id) {
        // For groups, translate all child pcb components recursively
        const grp = child as Group
        const pcbGroupData = db.pcb_group.get(grp.pcb_group_id!)
        if (pcbGroupData?.center) {
          db.pcb_group.update(grp.pcb_group_id!, {
            center: {
              x: pcbGroupData.center.x + dx,
              y: pcbGroupData.center.y + dy,
            },
          })
        }
        // Translate all pcb components belonging to this group
        const groupComponentIds = new Set<string>()
        const collectComponentIds = (component: typeof child) => {
          if (component.pcb_component_id) {
            groupComponentIds.add(component.pcb_component_id)
          }
          for (const c of component.children) {
            collectComponentIds(c)
          }
        }
        collectComponentIds(grp)

        for (const compId of groupComponentIds) {
          const related = db
            .toArray()
            .filter(
              (elm) =>
                "pcb_component_id" in elm &&
                elm.pcb_component_id === compId,
            )
          transformPCBElements(related as any, translationMatrix)
        }
      }
    }
  }
}
