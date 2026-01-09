import type { PcbTrace } from "circuit-json"
import type { CircuitJsonUtilObjects } from "@tscircuit/circuit-json-util"

interface JumperPadInfo {
  pcb_port_id: string
  x: number
  y: number
  minX: number
  maxX: number
  minY: number
  maxY: number
}

/**
 * Get all jumper pad positions and bounds from the database.
 * These are pads belonging to autoplaced jumper components.
 */
function getJumperPadInfos(db: CircuitJsonUtilObjects): JumperPadInfo[] {
  const padInfos: JumperPadInfo[] = []
  const pcbSmtpads = db.pcb_smtpad.list()

  const jumperSmtpads = pcbSmtpads.filter((pad) => {
    const component = db.pcb_component.get(pad.pcb_component_id!)
    if (!component) return false
    const sourceComponent = db.source_component.get(
      component.source_component_id!,
    )
    return sourceComponent?.name?.startsWith("__autoplaced_jumper")
  })

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
): string | undefined {
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
        const newStartPoint = { ...point }
        delete (newStartPoint as any).end_pcb_port_id
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
 * Process trace segments to add port IDs for jumper pad connections.
 * This handles two cases:
 * 1. Segment endpoints that are exactly at jumper pad positions
 * 2. Intermediate points that pass through jumper pad bounds (splits the trace)
 *
 * @param segments - Array of trace route segments to process
 * @param db - Database for looking up jumper pad information
 * @returns Processed segments with port IDs added and splits performed
 */
export function addPortIdsToTracesAtJumperPads(
  segments: Array<PcbTrace["route"]>,
  db: CircuitJsonUtilObjects,
): Array<PcbTrace["route"]> {
  const padInfos = getJumperPadInfos(db)
  if (padInfos.length === 0) return segments

  const result: Array<PcbTrace["route"]> = []

  for (const segment of segments) {
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
