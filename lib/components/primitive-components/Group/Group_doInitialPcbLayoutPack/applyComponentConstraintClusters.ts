import type { Group } from "../Group"
import type { Constraint } from "../../Constraint"
import type { PackInput } from "calculate-packing"
import * as kiwi from "@lume/kiwi"

export type ClusterInfo = {
  componentIds: string[]
  constraints: Constraint[]
  relativeCenters?: Record<string, { x: number; y: number }>
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

  const getIdFromSelector = (sel: string): string | undefined => {
    const name = sel.startsWith(".") ? sel.slice(1) : sel
    const child = group.children.find((c) => (c as any).name === name)
    return child?.pcb_component_id ?? undefined
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

    // Check if any constraint specifies centerX or centerY
    const hasCenterX = info.constraints.some((c) => "centerX" in c._parsedProps)
    const hasCenterY = info.constraints.some((c) => "centerY" in c._parsedProps)

    // Only anchor to (0,0) if centerX/centerY are not specified
    if (!hasCenterX) {
      solver.addConstraint(
        new kiwi.Constraint(
          getVar(anchor, "x"),
          kiwi.Operator.Eq,
          0,
          kiwi.Strength.required,
        ),
      )
    }
    if (!hasCenterY) {
      solver.addConstraint(
        new kiwi.Constraint(
          getVar(anchor, "y"),
          kiwi.Operator.Eq,
          0,
          kiwi.Strength.required,
        ),
      )
    }

    for (const constraint of info.constraints) {
      const props = constraint._parsedProps as any
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
          // If centerX is specified, constrain the midpoint between left and right
          if ("centerX" in props) {
            solver.addConstraint(
              new kiwi.Constraint(
                new kiwi.Expression(
                  [0.5, getVar(left, "x")],
                  [0.5, getVar(right, "x")],
                ),
                kiwi.Operator.Eq,
                props.centerX,
                kiwi.Strength.required,
              ),
            )
          }
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
          // If centerY is specified, constrain the midpoint between top and bottom
          if ("centerY" in props) {
            solver.addConstraint(
              new kiwi.Constraint(
                new kiwi.Expression(
                  [0.5, getVar(top, "y")],
                  [0.5, getVar(bottom, "y")],
                ),
                kiwi.Operator.Eq,
                props.centerY,
                kiwi.Strength.required,
              ),
            )
          }
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
    clusterMap[info.componentIds[0]] = info
  }

  return clusterMap
}
