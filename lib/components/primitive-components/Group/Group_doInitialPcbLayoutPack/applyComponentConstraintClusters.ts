import type { Group } from "../Group"
import type { Constraint } from "../../Constraint"
import type { PackInput } from "calculate-packing"
import * as kiwi from "@lume/kiwi"

export type ClusterInfo = {
  componentIds: string[]
  constraints: Constraint[]
  relativeCenters?: Record<string, { x: number; y: number }>
}

type ItemInfo = {
  id: string
  type: "component" | "group"
}

export const applyComponentConstraintClusters = (
  group: Group,
  packInput: PackInput,
): Record<string, ClusterInfo> => {
  const { db } = group.root!

  const constraintContainer =
    group.componentName === "Group" ? group.parent : group

  const constraints =
    constraintContainer?.children?.filter(
      (c): c is Constraint =>
        c.componentName === "Constraint" && c._parsedProps.pcb,
    ) ?? []

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

  const getIdFromSelector = (sel: string): ItemInfo | undefined => {
    const name = sel.startsWith(".") ? sel.slice(1) : sel
    const child = group.children.find((c) => (c as any).name === name)

    if (!child) return undefined

    if ((child as any).pcb_component_id) {
      return {
        id: (child as any).pcb_component_id,
        type: "component",
      }
    }

    if ((child as any).pcb_group_id) {
      return {
        id: (child as any).pcb_group_id,
        type: "group",
      }
    }

    return undefined
  }

  // Build clusters using union-find
  for (const constraint of constraints) {
    const props = constraint._parsedProps as any
    if ("left" in props && "right" in props) {
      const leftResult = getIdFromSelector(props.left)
      const rightResult = getIdFromSelector(props.right)

      if (leftResult && rightResult) {
        const a = leftResult.id
        const b = rightResult.id
        makeSet(a)
        makeSet(b)
        union(a, b)
      }
    } else if ("top" in props && "bottom" in props) {
      const topResult = getIdFromSelector(props.top)
      const bottomResult = getIdFromSelector(props.bottom)
      if (topResult && bottomResult) {
        const a = topResult.id
        const b = bottomResult.id
        makeSet(a)
        makeSet(b)
        union(a, b)
      }
    } else if ("for" in props && Array.isArray(props.for)) {
      const results = props.for
        .map((s: string) => getIdFromSelector(s))
        .filter((r: ItemInfo | undefined): r is ItemInfo => !!r)
      const ids = results.map((r: ItemInfo) => r.id)
      for (const id of ids) makeSet(id)
      for (let i = 1; i < ids.length; i++) union(ids[0], ids[i])
    }
  }

  // Group components by cluster
  for (const id of Object.keys(parent)) {
    const rootId = find(id)
    if (!clusterByRoot.has(rootId))
      clusterByRoot.set(rootId, { componentIds: [], constraints: [] })
    clusterByRoot.get(rootId)!.componentIds.push(id)
  }

  // Assign constraints to clusters
  for (const constraint of constraints) {
    const props = constraint._parsedProps as any
    let result: ItemInfo | undefined
    if ("left" in props) result = getIdFromSelector(props.left)
    else if ("top" in props) result = getIdFromSelector(props.top)
    else if ("for" in props) result = getIdFromSelector(props.for[0])
    if (!result) continue
    const root = find(result.id)
    clusterByRoot.get(root)?.constraints.push(constraint)
  }

  const clusterMap: Record<string, ClusterInfo> = {}

  const itemInfoById: Record<
    string,
    { type: "component" | "group"; data: any }
  > = {}

  // Add components
  for (const comp of packInput.components) {
    itemInfoById[comp.componentId] = {
      type: "component",
      data: comp,
    }
  }

  // Add groups (pcb_group entries)
  for (const sg of db.source_group.list()) {
    const pcbGroup = db.pcb_group.getWhere({
      source_group_id: sg.source_group_id,
    })
    if (!pcbGroup) continue

    const componentIdsp = db.pcb_component
      .list()
      .filter((c: any) => c.pcb_group_id === pcbGroup.pcb_group_id)
      .map((c: any) => c.pcb_component_id)

    itemInfoById[pcbGroup.pcb_group_id] = {
      type: "group",
      data: {
        pcb_group_id: pcbGroup.pcb_group_id,
        center: pcbGroup.center || { x: 0, y: 0 },
        width: pcbGroup.width,
        height: pcbGroup.height,
        componentIdsp,
      },
    }
  }

  for (const [rootId, info] of clusterByRoot.entries()) {
    const hasGroupItems = info.componentIds.some(
      (id) => itemInfoById[id]?.type === "group",
    )

    if (info.componentIds.length <= 1 && !hasGroupItems) {
      continue
    }

    const solver = new kiwi.Solver()
    const kVars: Record<string, kiwi.Variable> = {}
    const getVar = (id: string, axis: "x" | "y") => {
      const key = `${id}_${axis}`
      if (!kVars[key]) kVars[key] = new kiwi.Variable(key)
      return kVars[key]
    }

    // Apply constraints
    for (const constraint of info.constraints) {
      const props = constraint._parsedProps as any
      if ("xDist" in props) {
        const leftResult = getIdFromSelector(props.left)
        const rightResult = getIdFromSelector(props.right)
        if (leftResult && rightResult) {
          const left = leftResult.id
          const right = rightResult.id
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
        const topResult = getIdFromSelector(props.top)
        const bottomResult = getIdFromSelector(props.bottom)
        if (topResult && bottomResult) {
          const top = topResult.id
          const bottom = bottomResult.id
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
        const results = props.for
          .map((s: string) => getIdFromSelector(s))
          .filter((r: ItemInfo | undefined): r is ItemInfo => !!r)
        const ids = results.map((r: ItemInfo) => r.id)
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
        const results = props.for
          .map((s: string) => getIdFromSelector(s))
          .filter((r: ItemInfo | undefined): r is ItemInfo => !!r)
        const ids = results.map((r: ItemInfo) => r.id)
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
    // NEW: Apply centerX/centerY if specified
    const firstConstraint = info.constraints[0]
    if (firstConstraint) {
      const props = firstConstraint._parsedProps as any
      if ("centerX" in props || "centerY" in props) {
        const ids = info.componentIds
        const currentCenter = {
          x: ids.reduce((sum, id) => sum + positions[id].x, 0) / ids.length,
          y: ids.reduce((sum, id) => sum + positions[id].y, 0) / ids.length,
        }

        const targetCenter = {
          x: props.centerX ?? currentCenter.x,
          y: props.centerY ?? currentCenter.y,
        }

        const offset = {
          x: targetCenter.x - currentCenter.x,
          y: targetCenter.y - currentCenter.y,
        }

        for (const id of ids) {
          positions[id].x += offset.x
          positions[id].y += offset.y
        }
      }
    }

    // Update pcb_group centers after solving
    for (const id of info.componentIds) {
      const item = itemInfoById[id]

      if (item?.type === "group") {
        const groupId = item.data.pcb_group_id

        const oldCenter = { ...item.data.center }
        const newCenter = positions[id]

        const dx = newCenter.x - oldCenter.x
        const dy = newCenter.y - oldCenter.y

        // update group
        db.pcb_group.update(groupId, { center: newCenter })
        item.data.center = newCenter

        // shift child pcb_components
        const comps = db.pcb_component
          .list()
          .filter((c) => c.pcb_group_id === groupId)

        for (const c of comps) {
          db.pcb_component.update(c.pcb_component_id, {
            center: {
              x: c.center.x + dx,
              y: c.center.y + dy,
            },
          })
        }
      }
    }

    // Calculate bounds for both components and groups
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity

    for (const id of info.componentIds) {
      const item = itemInfoById[id]
      const pos = positions[id]
      if (!item) continue

      if (item.type === "component") {
        const comp = item.data
        for (const pad of comp.pads) {
          const ax = pos.x + pad.offset.x
          const ay = pos.y + pad.offset.y
          minX = Math.min(minX, ax - pad.size.x / 2)
          maxX = Math.max(maxX, ax + pad.size.x / 2)
          minY = Math.min(minY, ay - pad.size.y / 2)
          maxY = Math.max(maxY, ay + pad.size.y / 2)
        }
      } else if (item.type === "group") {
        const groupId = item.data.pcb_group_id

        const comps = db.pcb_component
          .list()
          .filter((c) => c.pcb_group_id === groupId)

        for (const c of comps) {
          const pads = db.pcb_smtpad
            .list()
            .filter((p) => p.pcb_component_id === c.pcb_component_id)

          for (const p of pads) {
            // FIXED: Pad coordinates are already absolute after component shift
            if ("x" in p && "y" in p) {
              const px = p.x
              const py = p.y

              minX = Math.min(minX, px)
              maxX = Math.max(maxX, px)
              minY = Math.min(minY, py)
              maxY = Math.max(maxY, py)
            } else if ("points" in p) {
              for (const pt of p.points) {
                minX = Math.min(minX, pt.x)
                maxX = Math.max(maxX, pt.x)
                minY = Math.min(minY, pt.y)
                maxY = Math.max(maxY, pt.y)
              }
            }
          }
        }
      }
    }

    const clusterCenter = { x: (minX + maxX) / 2, y: (minY + maxY) / 2 }

    // Merge pads from both components and groups
    const mergedPads: (typeof packInput.components)[number]["pads"] = []
    const relCenters: Record<string, { x: number; y: number }> = {}

    for (const id of info.componentIds) {
      const item = itemInfoById[id]
      const pos = positions[id]
      if (!item) continue

      relCenters[id] = {
        x: pos.x - clusterCenter.x,
        y: pos.y - clusterCenter.y,
      }

      if (item.type === "component") {
        const comp = item.data
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
      } else if (item?.type === "group") {
        const groupId = item.data.pcb_group_id
        // FIXED: Process only THIS group's components
        const comps = db.pcb_component
          .list()
          .filter((c) => c.pcb_group_id === groupId)

        for (const c of comps) {
          const smtpads = db.pcb_smtpad
            .list()
            .filter((p) => p.pcb_component_id === c.pcb_component_id)

          const pads = convertSmtPadsToGenericPads(smtpads)

          for (const p of pads) {
            // FIXED: Pad coordinates are absolute, just subtract cluster center
            mergedPads.push({
              padId: p.pcb_pad_id,
              networkId: p.network_id,
              type: p.shape,
              size: { x: p.width, y: p.height },
              offset: {
                x: p.x - clusterCenter.x,
                y: p.y - clusterCenter.y,
              },
            })
          }
        }
      }
    }

    // Remove clustered items from pack input
    packInput.components = packInput.components.filter(
      (c) => !info.componentIds.includes(c.componentId),
    )

    // Add merged cluster as single component (only if there are pads)
    if (mergedPads.length > 0) {
      packInput.components.push({
        componentId: info.componentIds[0],
        pads: mergedPads,
        availableRotationDegrees: [0],
      })
    }

    info.relativeCenters = relCenters
    clusterMap[info.componentIds[0]] = info
  }

  return clusterMap
}

const convertSmtPadsToGenericPads = (smtpads: any[]) => {
  const pads: any[] = []

  for (const p of smtpads) {
    if (Array.isArray(p.points)) {
      const xs = p.points.map((pt: { x: number; y: number }) => pt.x)
      const ys = p.points.map((pt: { x: number; y: number }) => pt.y)

      pads.push({
        pcb_pad_id: p.pcb_smtpad_id,
        network_id: p.pcb_port_id,
        shape: p.shape,
        x: (Math.min(...xs) + Math.max(...xs)) / 2,
        y: (Math.min(...ys) + Math.max(...ys)) / 2,
        width: Math.max(...xs) - Math.min(...xs),
        height: Math.max(...ys) - Math.min(...ys),
      })
      continue
    }

    if (p.shape === "circle" && p.radius !== undefined) {
      const diameter = p.radius * 2
      pads.push({
        pcb_pad_id: p.pcb_smtpad_id,
        network_id: p.pcb_port_id,
        shape: p.shape,
        x: p.x,
        y: p.y,
        width: diameter,
        height: diameter,
      })
      continue
    }

    pads.push({
      pcb_pad_id: p.pcb_smtpad_id,
      network_id: p.pcb_port_id,
      shape: p.shape,
      x: p.x,
      y: p.y,
      width: p.width ?? 0,
      height: p.height ?? 0,
    })
  }

  return pads
}
