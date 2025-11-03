import Flatten from "@flatten-js/core"

export const circleToPolygon = (circle: Flatten.Circle, numSegments = 32) => {
  const points: Flatten.Point[] = []
  for (let i = 0; i < numSegments; i++) {
    const angle = (i / numSegments) * 2 * Math.PI
    points.push(
      new Flatten.Point(
        circle.center.x + circle.r * Math.cos(angle),
        circle.center.y + circle.r * Math.sin(angle),
      ),
    )
  }
  return new Flatten.Polygon(points)
}
