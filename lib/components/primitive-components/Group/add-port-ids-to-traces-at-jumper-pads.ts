import type { CircuitJsonUtilObjects } from "@tscircuit/circuit-json-util"
import type { PcbPort, PcbTrace } from "circuit-json"

type PcbPortId = PcbPort["pcb_port_id"]

interface JumperPadInfo {
  pcb_port_id: PcbPortId
  x: number
  y: number
  minX: number
  maxX: number
  minY: number
  maxY: number
}

/**
 * Get the pad positions and bounds for the exact PCB ports materialized by
 * this Group's current autoplaced-jumper output.
 */
function getJumperPadInfos(
  db: CircuitJsonUtilObjects,
  autoplacedJumperPcbPortIds: ReadonlySet<PcbPortId>,
): JumperPadInfo[] {
  const padInfos: JumperPadInfo[] = []
  const jumperSmtpads = db.pcb_smtpad
    .list()
    .filter(
      (pad) =>
        pad.pcb_port_id && autoplacedJumperPcbPortIds.has(pad.pcb_port_id),
    )

  for (const smtpad of jumperSmtpads) {
    // Skip polygon shapes which don't have x/y
    if (smtpad.shape === "polygon") continue
    if (!smtpad.pcb_port_id) continue

    if (smtpad.shape === "rect" || smtpad.shape === "rotated_rect") {
      const halfWidth = (smtpad as any).width / 2
      const halfHeight = (smtpad as any).height / 2
      padInfos.push({
        pcb_port_id: smtpad.pcb_port_id,
        x: smtpad.x,
        y: smtpad.y,
        minX: smtpad.x - halfWidth,
        maxX: smtpad.x + halfWidth,
        minY: smtpad.y - halfHeight,
        maxY: smtpad.y + halfHeight,
      })
    } else if (smtpad.shape === "circle") {
      const radius = (smtpad as any).radius
      padInfos.push({
        pcb_port_id: smtpad.pcb_port_id,
        x: smtpad.x,
        y: smtpad.y,
        minX: smtpad.x - radius,
        maxX: smtpad.x + radius,
        minY: smtpad.y - radius,
        maxY: smtpad.y + radius,
      })
    }
  }

  return padInfos
}

/**
 * Find a jumper port at an exact position (within tolerance).
 */
function findJumperPortAtPosition(
  padInfos: JumperPadInfo[],
  x: number,
  y: number,
  tolerance = 0.01,
): PcbPortId | undefined {
  for (const pad of padInfos) {
    if (Math.abs(pad.x - x) < tolerance && Math.abs(pad.y - y) < tolerance) {
      return pad.pcb_port_id
    }
  }
  return undefined
}

/**
 * Find a jumper port that contains a given point within its bounds.
 */
function findJumperPortContainingPoint(
  padInfos: JumperPadInfo[],
  x: number,
  y: number,
): JumperPadInfo | undefined {
  for (const pad of padInfos) {
    if (x >= pad.minX && x <= pad.maxX && y >= pad.minY && y <= pad.maxY) {
      return pad
    }
  }
  return undefined
}

/**
 * Split a route at points where it passes through jumper pads.
 * This ensures that traces physically passing through pads are properly
 * connected in the connectivity map via start/end_pcb_port_id.
 */
function splitRouteAtJumperPads(
  route: PcbTrace["route"],
  padInfos: JumperPadInfo[],
): Array<PcbTrace["route"]> {
  if (route.length === 0 || padInfos.length === 0) return [route]

  const segments: Array<PcbTrace["route"]> = []
  let currentSegment: PcbTrace["route"] = []

  for (let i = 0; i < route.length; i++) {
    const point = route[i]
    currentSegment.push(point)

    // Check if this point is within a jumper pad (but not the first or last point)
    if (point.route_type === "wire" && i > 0 && i < route.length - 1) {
      const padInfo = findJumperPortContainingPoint(padInfos, point.x, point.y)
      if (padInfo) {
        // End current segment at this point with end_pcb_port_id
        if (!point.end_pcb_port_id) {
          point.end_pcb_port_id = padInfo.pcb_port_id
        }
        segments.push(currentSegment)

        // Start new segment from this point with start_pcb_port_id
        const { end_pcb_port_id: _endPcbPortId, ...newStartPoint } = point
        if (!newStartPoint.start_pcb_port_id) {
          newStartPoint.start_pcb_port_id = padInfo.pcb_port_id
        }
        currentSegment = [newStartPoint]
      }
    }
  }

  // Add the final segment
  if (currentSegment.length > 0) {
    segments.push(currentSegment)
  }

  return segments
}

/**
 * Clone wire points and remove PCB-port foreign keys that no longer resolve
 * before adding jumper metadata. Via objects are kept by identity because
 * later autorouting materialization associates them with their owning phase
 * section.
 */
function cloneWirePointsAndRemoveDanglingPcbPortIds(
  segments: Array<PcbTrace["route"]>,
  db: CircuitJsonUtilObjects,
): Array<PcbTrace["route"]> {
  return segments.map((segment) =>
    segment.map((point) => {
      if (point.route_type !== "wire") return point

      const { start_pcb_port_id, end_pcb_port_id, ...wirePoint } = point
      return {
        ...wirePoint,
        ...(start_pcb_port_id && db.pcb_port.get(start_pcb_port_id)
          ? { start_pcb_port_id }
          : {}),
        ...(end_pcb_port_id && db.pcb_port.get(end_pcb_port_id)
          ? { end_pcb_port_id }
          : {}),
      }
    }),
  )
}

/**
 * Process trace segments to add port IDs for jumper pad connections.
 * This handles two cases:
 * 1. Segment endpoints that are exactly at jumper pad positions
 * 2. Intermediate points that pass through jumper pad bounds (splits the trace)
 *
 * @param segments - Array of trace route segments to process
 * @param db - Database for looking up jumper pad information
 * @param autoplacedJumperPcbPortIds - Exact current Group-owned jumper ports
 * @returns Processed segments with port IDs added and splits performed
 */
export function addPortIdsToTracesAtJumperPads(
  segments: Array<PcbTrace["route"]>,
  db: CircuitJsonUtilObjects,
  autoplacedJumperPcbPortIds: ReadonlySet<PcbPortId>,
): Array<PcbTrace["route"]> {
  const cleanSegments = cloneWirePointsAndRemoveDanglingPcbPortIds(segments, db)
  const padInfos = getJumperPadInfos(db, autoplacedJumperPcbPortIds)
  if (padInfos.length === 0) return cleanSegments

  const result: Array<PcbTrace["route"]> = []

  for (const segment of cleanSegments) {
    // First, split at any intermediate points within jumper pad bounds
    const subSegments = splitRouteAtJumperPads(segment, padInfos)

    // Then, add port IDs to segment endpoints that are at jumper pad positions
    for (const subSegment of subSegments) {
      if (subSegment.length > 0) {
        const firstPoint = subSegment[0]
        const lastPoint = subSegment[subSegment.length - 1]

        if (firstPoint.route_type === "wire" && !firstPoint.start_pcb_port_id) {
          const portId = findJumperPortAtPosition(
            padInfos,
            firstPoint.x,
            firstPoint.y,
          )
          if (portId) {
            firstPoint.start_pcb_port_id = portId
          }
        }

        if (lastPoint.route_type === "wire" && !lastPoint.end_pcb_port_id) {
          const portId = findJumperPortAtPosition(
            padInfos,
            lastPoint.x,
            lastPoint.y,
          )
          if (portId) {
            lastPoint.end_pcb_port_id = portId
          }
        }

        result.push(subSegment)
      }
    }
  }

  return result
}
