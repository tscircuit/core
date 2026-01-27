import SVGPathCommander, {
  type PathSegment,
  type PathArray,
} from "svg-path-commander"

interface Point {
  x: number
  y: number
}

/**
 * Sample points along a single curve segment
 */
function sampleCurveSegment(
  segmentPath: string,
  samplesPerUnit: number,
): Point[] {
  const commander = new SVGPathCommander(segmentPath)
  const length = commander.getTotalLength()
  const numSamples = Math.max(2, Math.ceil(length * samplesPerUnit))

  const points: Point[] = []
  // Start from 1 to skip the start point (already added by previous segment)
  for (let i = 1; i <= numSamples; i++) {
    const t = (i / numSamples) * length
    const point = commander.getPointAtLength(t)
    points.push({ x: point.x, y: point.y })
  }
  return points
}

/**
 * Converts an SVG path string to an array of point arrays.
 * Each subpath (starting with 'M') becomes a separate array of points.
 * Straight line segments use exact endpoints, curves are sampled.
 *
 * @param svgPath - The SVG path string (e.g., "M 0 0 L 10 10 M 20 20 L 30 30")
 * @param samplesPerUnit - Number of samples per unit length for curves (default: 10)
 * @returns Array of point arrays, one for each subpath
 */
export function svgPathToPoints(
  svgPath: string,
  samplesPerUnit = 10,
): Point[][] {
  // Normalize to absolute coordinates
  const pathCommander = new SVGPathCommander(svgPath)
  pathCommander.toAbsolute()
  const segments = pathCommander.segments

  const result: Point[][] = []
  let currentPoints: Point[] = []
  let currentX = 0
  let currentY = 0
  let subpathStartX = 0
  let subpathStartY = 0

  for (const segment of segments) {
    const cmd = segment[0]

    switch (cmd) {
      case "M": {
        // Move to - starts a new subpath
        if (currentPoints.length > 0) {
          result.push(currentPoints)
        }
        currentX = segment[1]
        currentY = segment[2]
        subpathStartX = currentX
        subpathStartY = currentY
        currentPoints = [{ x: currentX, y: currentY }]
        break
      }

      case "L": {
        // Line to - just add the endpoint
        currentX = segment[1]
        currentY = segment[2]
        currentPoints.push({ x: currentX, y: currentY })
        break
      }

      case "H": {
        // Horizontal line - add endpoint
        currentX = segment[1]
        currentPoints.push({ x: currentX, y: currentY })
        break
      }

      case "V": {
        // Vertical line - add endpoint
        currentY = segment[1]
        currentPoints.push({ x: currentX, y: currentY })
        break
      }

      case "Z": {
        // Close path - line back to subpath start
        if (currentX !== subpathStartX || currentY !== subpathStartY) {
          currentPoints.push({ x: subpathStartX, y: subpathStartY })
        }
        currentX = subpathStartX
        currentY = subpathStartY
        break
      }

      case "C": {
        // Cubic bezier - sample the curve
        const endX = segment[5]
        const endY = segment[6]
        const segmentPath = `M ${currentX} ${currentY} C ${segment[1]} ${segment[2]} ${segment[3]} ${segment[4]} ${endX} ${endY}`
        const sampledPoints = sampleCurveSegment(segmentPath, samplesPerUnit)
        currentPoints.push(...sampledPoints)
        currentX = endX
        currentY = endY
        break
      }

      case "S": {
        // Smooth cubic bezier - sample the curve
        const endX = segment[3]
        const endY = segment[4]
        const segmentPath = `M ${currentX} ${currentY} S ${segment[1]} ${segment[2]} ${endX} ${endY}`
        const sampledPoints = sampleCurveSegment(segmentPath, samplesPerUnit)
        currentPoints.push(...sampledPoints)
        currentX = endX
        currentY = endY
        break
      }

      case "Q": {
        // Quadratic bezier - sample the curve
        const endX = segment[3]
        const endY = segment[4]
        const segmentPath = `M ${currentX} ${currentY} Q ${segment[1]} ${segment[2]} ${endX} ${endY}`
        const sampledPoints = sampleCurveSegment(segmentPath, samplesPerUnit)
        currentPoints.push(...sampledPoints)
        currentX = endX
        currentY = endY
        break
      }

      case "T": {
        // Smooth quadratic bezier - sample the curve
        const endX = segment[1]
        const endY = segment[2]
        const segmentPath = `M ${currentX} ${currentY} T ${endX} ${endY}`
        const sampledPoints = sampleCurveSegment(segmentPath, samplesPerUnit)
        currentPoints.push(...sampledPoints)
        currentX = endX
        currentY = endY
        break
      }

      case "A": {
        // Arc - sample the curve
        const endX = segment[6]
        const endY = segment[7]
        const segmentPath = `M ${currentX} ${currentY} A ${segment[1]} ${segment[2]} ${segment[3]} ${segment[4]} ${segment[5]} ${endX} ${endY}`
        const sampledPoints = sampleCurveSegment(segmentPath, samplesPerUnit)
        currentPoints.push(...sampledPoints)
        currentX = endX
        currentY = endY
        break
      }
    }
  }

  // Don't forget the last subpath
  if (currentPoints.length > 0) {
    result.push(currentPoints)
  }

  // Remove consecutive duplicate points from each subpath
  return result.map((points) => {
    const deduped: Point[] = []
    for (const point of points) {
      if (
        deduped.length === 0 ||
        Math.abs(deduped[deduped.length - 1].x - point.x) > 1e-9 ||
        Math.abs(deduped[deduped.length - 1].y - point.y) > 1e-9
      ) {
        deduped.push(point)
      }
    }
    return deduped
  })
}
