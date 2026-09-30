import {
  matchComponentDogboneViaSites,
  type PreparedBus,
} from "@tscircuit/fanout-solver"
import type { FanoutTracePath } from "@tscircuit/props"
import ballMap from "./ball-map.json"

// AM3352 ZCZ top-view ball map: TI SPRS717L, pages 15–17.
// Same 18 x 18, 0.8 mm-pitch footprint used by the AM3352 routing experiment.
// Right-handed board-world points in mm (+X right, +Y up, +Z above).
// U1 is at the origin, unrotated; these are points, not direction vectors.
const rows = "ABCDEFGHJKLMNPRTUV"
export const balls = Object.entries(ballMap).map(([ball, signal]) => ({
  ball,
  signal,
  x: (rows.indexOf(ball[0]!) - 8.5) * 0.8,
  y: (Number(ball.slice(1)) - 9.5) * 0.8,
  kind: signal.startsWith("VSS")
    ? "ground"
    : /^(VDD|CAP_VDD)/.test(signal)
      ? "power"
      : "signal",
}))

export function Am3352DogboneFootprint() {
  return (
    <chip
      name="U1"
      manufacturerPartNumber="AM3352BZCZ100"
      noSchematicRepresentation
      pinLabels={Object.fromEntries(
        balls.map(({ ball }, index) => [`pin${index + 1}`, ball]),
      )}
      footprint={
        <footprint>
          {balls.map(({ ball, x, y }, index) => (
            <smtpad
              portHints={[ball, `pin${index + 1}`]}
              pcbX={x}
              pcbY={y}
              shape="circle"
              radius={0.2}
            />
          ))}
          <silkscreenrect width={15.4} height={15.4} />
          <silkscreencircle pcbX={-7.8} pcbY={-7.8} radius={0.3} />
        </footprint>
      }
    />
  )
}

/** Run the real pad-site matcher on all pads, including every supply/ground ball.
 * No saved route coordinates or boundary routing are used to select via sites.
 * The returned points are fanout-local mm, coincident with board world here. */
export function createAm3352DogbonePaths(): FanoutTracePath[] {
  const obstacles: PreparedBus["componentObstacles"] = balls.map(
    ({ ball, x, y }) => ({
      type: "rect",
      shape: "circle",
      center: { x, y },
      width: 0.4,
      height: 0.4,
      layers: ["top"],
      connectedTo: [ball],
      componentId: "U1",
    }),
  )
  const bus: PreparedBus = {
    busId: "all_pads",
    componentId: "U1",
    direction: "down",
    termination: { type: "boundary" },
    componentObstacles: obstacles,
    componentBounds: { minX: -7, maxX: 7, minY: -7, maxY: 7 },
    // Required preparation metadata only: the matcher never routes to this box.
    sharedBoundary: { minX: -9, maxX: 9, minY: -9, maxY: 9 },
    xCoordinates: Array.from(new Set(balls.map((b) => b.x))).sort(
      (a, b) => a - b,
    ),
    yCoordinates: Array.from(new Set(balls.map((b) => b.y))).sort(
      (a, b) => a - b,
    ),
    pitchX: 0.8,
    pitchY: 0.8,
    connections: balls.map(({ ball, x, y }, connectionIndex) => {
      const sourcePoint = { x, y, layer: "top" }
      return {
        connection: { name: ball, pointsToConnect: [sourcePoint] },
        connectionIndex,
        sourcePointIndex: 0,
        sourcePoint,
        sourceLayer: "top",
        sourceObstacle: obstacles[connectionIndex]!,
        // Not consulted by the matcher; no electrical destination is fabricated.
        targetPoint: sourcePoint,
      }
    }),
  }
  const sites = matchComponentDogboneViaSites([bus], {
    traceWidth: 0.1,
    clearance: 0.1,
    viaDiameter: 0.3,
    viaHoleDiameter: 0.15,
  })
  if (!sites || sites.size !== balls.length) {
    throw new Error("AM3352 dogbone matcher did not escape all 324 balls")
  }
  return balls.map(({ ball, x, y, kind }, index) => {
    const site = sites.get(index)!
    return {
      connection: `U1.${ball}`,
      route: [
        { route_type: "wire", x, y, layer: "top", width: 0.1 },
        { route_type: "wire", ...site, layer: "top", width: 0.1 },
        {
          route_type: "via",
          ...site,
          from_layer: "top",
          to_layer: kind === "ground" ? "inner2" : "inner1",
          via_diameter: 0.3,
          via_hole_diameter: 0.15,
        },
      ],
    }
  })
}
