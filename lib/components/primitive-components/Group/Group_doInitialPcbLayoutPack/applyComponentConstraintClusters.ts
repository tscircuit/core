import type { Group } from "../Group"
import type { Constraint } from "../../Constraint"
import type { PackInput } from "calculate-packing"
import * as kiwi from "@lume/kiwi"

export type ClusterInfo = {
  componentIds: string[]
  constraints: Constraint[]
  relativeCenters?: Record<string, { x: number; y: number }>
  /** When centerX/centerY is set, the cluster has an absolute position.
   *  Each axis is undefined when not specified by the constraint. */
  absoluteCenter?: { x: number | undefined; y: number | undefined }
}

export const applyComponentConstraintClusters = (
  group: Group,
  packInput: PackInput,
): Record<string, ClusterInfo> => {
  const constraints = group.children.filter(
    (c): c is Constraint =>
      c.componentName === "Constraint" && c._parsedProps.pcb,
  )

  const clusterByRoot = new Map<string, ClusterInfo>()
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

  /**
   * Resolve a selector like ".R1", ".group1", "R1", "group1" to a pack
   * component ID. Supports both individual components (pcb_component_id)
   * and groups (source_group_id used as componentId in pack).
   */
  const getIdFromSelector = (sel: string): string | undefined => {
    // Strip leading dot and any edge specifier
    const parts = sel.split(" ")
    const namePart = parts[0]
    const name = namePart.startsWith(".") ? namePart.slice(1) : namePart

    // First try to find a component child by name
    const child = group.children.find((c) => (c as any).name === name)
    if (child?.pcb_component_id) {
      return child.pcb_component_id
    }

    // Then try to find a group child by name (for group constraints)
    const groupChild = group.children.find(
      (c) =>
        c.componentName === "Group" && (c as any).name === name,
    ) as Group | undefined
    if (groupChild?.source_group_id) {
      // Groups use source_group_id as their componentId in pack input
      return groupChild.source_group_id
    }

    return undefined
  }

  for (const constraint of constraints) {
    const props = constraint._parsedProps as any
    if ("left" in props && "right" in props) {
      const a = getIdFromSelector(props.left)
      const b = getIdFromSelector(props.right)
      if (a && b) {
        makeSet(a)
        makeSet(b)
        union(a, b)
      }
    } else if ("top" in props && "bottom" in props) {
      const a = getIdFromSelector(props.top)
      const b = getIdFromSelector(props.bottom)
      if (a && b) {
        makeSet(a)
        makeSet(b)
        union(a, b)
      }
    } else if ("for" in props && Array.isArray(props.for)) {
      const ids = props.for
        .map((s: string) => getIdFromSelector(s))
        .filter((s: string | undefined): s is string => !!s)
      for (const id of ids) makeSet(id)
      for (let i = 1; i < ids.length; i++) union(ids[0], ids[i])
    }
  }

  for (const id of Object.keys(parent)) {
    const rootId = find(id)
    if (!clusterByRoot.has(rootId))
      clusterByRoot.set(rootId, { componentIds: [], constraints: [] })
    clusterByRoot.get(rootId)!.componentIds.push(id)
  }

  for (const constraint of constraints) {
    const props = constraint._parsedProps as any
    let compId: string | undefined
    if ("left" in props) compId = getIdFromSelector(props.left)
    else if ("top" in props) compId = getIdFromSelector(props.top)
    else if ("for" in props) compId = getIdFromSelector(props.for[0])
    if (!compId) continue
    const root = find(compId)
    clusterByRoot.get(root)?.constraints.push(constraint)
  }

  const clusterMap: Record<string, ClusterInfo> = {}
  const packCompById = Object.fromEntries(
    packInput.components.map((c) => [c.componentId, c]),
  ) as Record<string, (typeof packInput.components)[number]>

  for (const [rootId, info] of clusterByRoot.entries()) {
    if (info.componentIds.length <= 1) continue

    const solver = new kiwi.Solver()
    const kVars: Record<string, kiwi.Variable> = {}
    const getVar = (id: string, axis: "x" | "y") => {
      const key = `${id}_${axis}`
      if (!kVars[key]) kVars[key] = new kiwi.Variable(key)
      return kVars[key]
    }
    const anchor = info.componentIds[0]
    solver.addConstraint(
      new kiwi.Constraint(
        getVar(anchor, "x"),
        kiwi.Operator.Eq,
        0,
        kiwi.Strength.required,
      ),
    )
    solver.addConstraint(
      new kiwi.Constraint(
        getVar(anchor, "y"),
        kiwi.Operator.Eq,
        0,
        kiwi.Strength.required,
      ),
    )

    // Track centerX/centerY from constraints
    let hasCenterX = false
    let hasCenterY = false
    let constraintCenterX = 0
    let constraintCenterY = 0

    for (const constraint of info.constraints) {
      const props = constraint._parsedProps as any

      // Capture centerX/centerY if provided
      if ("centerX" in props && props.centerX !== undefined) {
        hasCenterX = true
        constraintCenterX = props.centerX
      }
      if ("centerY" in props && props.centerY !== undefined) {
        hasCenterY = true
        constraintCenterY = props.centerY
      }

      if ("xDist" in props) {
        const left = getIdFromSelector(props.left)
        const right = getIdFromSelector(props.right)
        if (left && right) {
          solver.addConstraint(
            new kiwi.Constraint(
              new kiwi.Expression(getVar(right, "x"), [-1, getVar(left, "x")]),
              kiwi.Operator.Eq,
              props.xDist,
              kiwi.Strength.required,
            ),
          )
        }
      } else if ("yDist" in props) {
        const top = getIdFromSelector(props.top)
        const bottom = getIdFromSelector(props.bottom)
        if (top && bottom) {
          solver.addConstraint(
            new kiwi.Constraint(
              new kiwi.Expression(getVar(top, "y"), [-1, getVar(bottom, "y")]),
              kiwi.Operator.Eq,
              props.yDist,
              kiwi.Strength.required,
            ),
          )
        }
      } else if ("sameX" in props && Array.isArray(props.for)) {
        const ids = props.for
          .map((s: string) => getIdFromSelector(s))
          .filter((s: string | undefined): s is string => !!s)
        if (ids.length > 1) {
          const base = getVar(ids[0], "x")
          for (let i = 1; i < ids.length; i++) {
            solver.addConstraint(
              new kiwi.Constraint(
                new kiwi.Expression(getVar(ids[i], "x"), [-1, base]),
                kiwi.Operator.Eq,
                0,
                kiwi.Strength.required,
              ),
            )
          }
        }
      } else if ("sameY" in props && Array.isArray(props.for)) {
        const ids = props.for
          .map((s: string) => getIdFromSelector(s))
          .filter((s: string | undefined): s is string => !!s)
        if (ids.length > 1) {
          const base = getVar(ids[0], "y")
          for (let i = 1; i < ids.length; i++) {
            solver.addConstraint(
              new kiwi.Constraint(
                new kiwi.Expression(getVar(ids[i], "y"), [-1, base]),
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

    const positions: Record<string, { x: number; y: number }> = {}
    for (const id of info.componentIds) {
      positions[id] = {
        x: getVar(id, "x").value(),
        y: getVar(id, "y").value(),
      }
    }

    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity
    for (const id of info.componentIds) {
      const comp = packCompById[id]
      const pos = positions[id]
      if (!comp) continue
      for (const pad of comp.pads) {
        const ax = pos.x + pad.offset.x
        const ay = pos.y + pad.offset.y
        minX = Math.min(minX, ax - pad.size.x / 2)
        maxX = Math.max(maxX, ax + pad.size.x / 2)
        minY = Math.min(minY, ay - pad.size.y / 2)
        maxY = Math.max(maxY, ay + pad.size.y / 2)
      }
    }
    const clusterCenter = { x: (minX + maxX) / 2, y: (minY + maxY) / 2 }

    const mergedPads: (typeof packInput.components)[number]["pads"] = []
    const relCenters: Record<string, { x: number; y: number }> = {}
    for (const id of info.componentIds) {
      const comp = packCompById[id]
      const pos = positions[id]
      if (!comp) continue
      relCenters[id] = {
        x: pos.x - clusterCenter.x,
        y: pos.y - clusterCenter.y,
      }
      for (const pad of comp.pads) {
        mergedPads.push({
          padId: pad.padId,
          networkId: pad.networkId,
          type: pad.type,
          size: pad.size,
          offset: {
            x: pos.x + pad.offset.x - clusterCenter.x,
            y: pos.y + pad.offset.y - clusterCenter.y,
          },
        })
      }
    }

    packInput.components = packInput.components.filter(
      (c) => !info.componentIds.includes(c.componentId),
    )
    packInput.components.push({
      componentId: info.componentIds[0],
      pads: mergedPads,
      availableRotationDegrees: [0],
    })

    info.relativeCenters = relCenters

    // If centerX/centerY was specified, store per-axis absolute position.
    // Unspecified axes remain undefined so the packer's value is preserved.
    if (hasCenterX || hasCenterY) {
      info.absoluteCenter = {
        x: hasCenterX ? constraintCenterX : undefined,
        y: hasCenterY ? constraintCenterY : undefined,
      }
    }

    clusterMap[info.componentIds[0]] = info
  }

  return clusterMap
}
