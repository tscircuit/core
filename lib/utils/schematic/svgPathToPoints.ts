import SVGPathCommander from "svg-path-commander"

interface Point {
  x: number
  y: number
}

/**
 * Converts an SVG path string to an array of point arrays.
 * Each subpath (starting with 'M') becomes a separate array of points.
 *
 * @param svgPath - The SVG path string (e.g., "M 0 0 L 10 10 M 20 20 L 30 30")
 * @param samplesPerUnit - Number of samples per unit length (default: 10)
 * @returns Array of point arrays, one for each subpath
 */
export function svgPathToPoints(
  svgPath: string,
  samplesPerUnit = 10,
): Point[][] {
  const pathCommander = new SVGPathCommander(svgPath)
  const segments = pathCommander.segments

  // Split the segments into subpaths (each starting with M)
  const subpaths: (typeof segments)[] = []
  let currentSubpath: typeof segments = [] as unknown as typeof segments

  for (const segment of segments) {
    if (segment[0] === "M" || segment[0] === "m") {
      if (currentSubpath.length > 0) {
        subpaths.push(currentSubpath)
      }
      currentSubpath = [segment] as unknown as typeof segments
    } else {
      ;(currentSubpath as unknown as (typeof segment)[]).push(segment)
    }
  }

  if (currentSubpath.length > 0) {
    subpaths.push(currentSubpath)
  }

  // Convert each subpath to points
  const result: Point[][] = []

  for (const subpathSegments of subpaths) {
    // Create a new path commander from the subpath segments
    const subpathString = SVGPathCommander.pathToString(subpathSegments)
    const subpathCommander = new SVGPathCommander(subpathString)

    const totalLength = subpathCommander.getTotalLength()
    const numSamples = Math.max(2, Math.ceil(totalLength * samplesPerUnit))

    const points: Point[] = []

    for (let i = 0; i <= numSamples; i++) {
      const length = (i / numSamples) * totalLength
      const point = subpathCommander.getPointAtLength(length)
      points.push({ x: point.x, y: point.y })
    }

    // Remove consecutive duplicate points
    const dedupedPoints: Point[] = []
    for (const point of points) {
      if (
        dedupedPoints.length === 0 ||
        dedupedPoints[dedupedPoints.length - 1].x !== point.x ||
        dedupedPoints[dedupedPoints.length - 1].y !== point.y
      ) {
        dedupedPoints.push(point)
      }
    }

    if (dedupedPoints.length > 0) {
      result.push(dedupedPoints)
    }
  }

  return result
}
