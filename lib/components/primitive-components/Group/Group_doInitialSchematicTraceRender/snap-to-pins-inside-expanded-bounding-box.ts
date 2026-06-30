import { distSq, type Point } from "@tscircuit/math-utils"
import type { IsolatedCircuit } from "lib/IsolatedCircuit"
import { getSchematicComponentWithTextBounds } from "lib/utils/schematic/getSchematicComponentWithTextBounds"

const MAX_PIN_SNAP_GAP = 1.5
const ALIGN_EPS = 1e-3

const isAxisAlignedWithinSnapGap = (a: Point, b: Point) => {
  if (distSq(a, b) > MAX_PIN_SNAP_GAP ** 2) return false
  return Math.abs(a.x - b.x) <= ALIGN_EPS || Math.abs(a.y - b.y) <= ALIGN_EPS
}

export const getPortIdsInsideExpandedTextBounds = (ctx: IsolatedCircuit) => {
  const { db } = ctx
  const eligiblePortIds = new Set<string>()
  for (const schematicComponent of db.schematic_component.list()) {
    if (!getSchematicComponentWithTextBounds(db, schematicComponent)) {
      continue
    }
    for (const port of db.schematic_port.list({
      schematic_component_id: schematicComponent.schematic_component_id,
    })) {
      eligiblePortIds.add(port.schematic_port_id)
    }
  }
  return eligiblePortIds
}

const getEligiblePortCenters = (
  params: {
    schematicPortIds: string[]
    eligiblePortIds: Set<string>
  },
  ctx: IsolatedCircuit,
) => {
  const { schematicPortIds, eligiblePortIds } = params
  return schematicPortIds
    .filter((id) => eligiblePortIds.has(id))
    .map((id) => ctx.db.schematic_port.get(id)?.center)
    .filter((center): center is Point => Boolean(center))
}

export const snapPointToPinInsideExpandedBoundingBox = (
  params: {
    point: Point
    schematicPortIds: string[]
    eligiblePortIds: Set<string>
  },
  ctx: IsolatedCircuit,
): Point => {
  const centers = getEligiblePortCenters(params, ctx)
  const nearestCenter = centers
    .filter((center) => isAxisAlignedWithinSnapGap(center, params.point))
    .sort((a, b) => distSq(a, params.point) - distSq(b, params.point))[0]

  if (!nearestCenter) return params.point
  return { x: nearestCenter.x, y: nearestCenter.y }
}

export function extendTraceEndpointsToReachPinsInsideExpandedBoundingBox(
  params: {
    points: Point[]
    schematicPortIds: string[]
    eligiblePortIds: Set<string>
  },
  ctx: IsolatedCircuit,
): Point[] {
  const centers = getEligiblePortCenters(params, ctx)
  if (centers.length === 0) return params.points

  const result = params.points.map((p) => ({ x: p.x, y: p.y }))
  const usedCenters = new Set<number>()

  for (let i = 0; i < centers.length; i++) {
    if (result.some((p) => distSq(centers[i]!, p) <= 1e-12)) {
      usedCenters.add(i)
    }
  }

  const endpoints: Array<"start" | "end"> = ["start", "end"]
  const candidates: Array<{
    endpoint: "start" | "end"
    centerIndex: number
    dist: number
  }> = []
  for (const endpoint of endpoints) {
    let endpointPoint = result[result.length - 1]!
    if (endpoint === "start") {
      endpointPoint = result[0]!
    }
    for (let i = 0; i < centers.length; i++) {
      if (usedCenters.has(i)) continue
      const center = centers[i]!
      if (!isAxisAlignedWithinSnapGap(center, endpointPoint)) continue
      candidates.push({
        endpoint,
        centerIndex: i,
        dist: distSq(center, endpointPoint),
      })
    }
  }
  candidates.sort((a, b) => a.dist - b.dist)

  const usedEndpoints = new Set<"start" | "end">()
  for (const { endpoint, centerIndex, dist } of candidates) {
    if (usedEndpoints.has(endpoint) || usedCenters.has(centerIndex)) continue
    usedCenters.add(centerIndex)
    usedEndpoints.add(endpoint)
    if (dist <= 1e-12) continue
    const center = centers[centerIndex]!
    if (endpoint === "start") result.unshift({ x: center.x, y: center.y })
    else result.push({ x: center.x, y: center.y })
  }
  return result
}
