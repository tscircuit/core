import type { AntennaShape } from "@tscircuit/props"

export interface AntennaGeometryPoint {
  x: number
  y: number
}

export interface GeneratedAntennaGeometry {
  traceWidth: number
  route: AntennaGeometryPoint[]
  feedPoint: AntennaGeometryPoint
  feedKeepoutOpeningDirection: "left" | "bottom"
  secondaryPort?: {
    point: AntennaGeometryPoint
    role: "ground" | "feed2"
  }
  groundViaPoint?: AntennaGeometryPoint
}

export interface GeneratedAntennaKeepout {
  center: AntennaGeometryPoint
  width: number
  height: number
}

const GENERATED_ANTENNA_KEEPOUT_CLEARANCE_MM = 1
const GENERATED_ANTENNA_FEED_OPENING_CLEARANCE_MM = 1

/**
 * Returns a copper-free envelope around a generated antenna's complete trace.
 * The envelope is split around a narrow feed corridor so the autorouter can
 * reach the feed while unrelated copper and components stay away from the
 * radiator and the outside edge of its copper.
 */
export const getGeneratedAntennaKeepouts = (
  geometry: GeneratedAntennaGeometry,
): GeneratedAntennaKeepout[] => {
  const xCoordinates = geometry.route.map((point) => point.x)
  const yCoordinates = geometry.route.map((point) => point.y)
  const edgeClearance =
    geometry.traceWidth / 2 + GENERATED_ANTENNA_KEEPOUT_CLEARANCE_MM
  const left = Math.min(...xCoordinates) - edgeClearance
  const right = Math.max(...xCoordinates) + edgeClearance
  const bottom = Math.min(...yCoordinates) - edgeClearance
  const top = Math.max(...yCoordinates) + edgeClearance

  const feedOpeningPoints = [
    geometry.feedPoint,
    ...(geometry.secondaryPort ? [geometry.secondaryPort.point] : []),
  ]
  const openingLeft =
    Math.min(...feedOpeningPoints.map((point) => point.x)) -
    GENERATED_ANTENNA_FEED_OPENING_CLEARANCE_MM
  const openingRight =
    Math.max(...feedOpeningPoints.map((point) => point.x)) +
    GENERATED_ANTENNA_FEED_OPENING_CLEARANCE_MM
  const openingBottom =
    Math.min(...feedOpeningPoints.map((point) => point.y)) -
    GENERATED_ANTENNA_FEED_OPENING_CLEARANCE_MM
  const openingTop =
    Math.max(...feedOpeningPoints.map((point) => point.y)) +
    GENERATED_ANTENNA_FEED_OPENING_CLEARANCE_MM

  const rects: GeneratedAntennaKeepout[] = []
  const addRect = (
    rectLeft: number,
    rectRight: number,
    rectBottom: number,
    rectTop: number,
  ) => {
    if (rectRight <= rectLeft || rectTop <= rectBottom) return
    rects.push({
      center: {
        x: (rectLeft + rectRight) / 2,
        y: (rectBottom + rectTop) / 2,
      },
      width: rectRight - rectLeft,
      height: rectTop - rectBottom,
    })
  }

  if (geometry.feedKeepoutOpeningDirection === "left") {
    addRect(left, right, openingTop, top)
    addRect(left, right, bottom, openingBottom)
    addRect(openingRight, right, openingBottom, openingTop)
  } else {
    addRect(left, openingLeft, bottom, openingTop)
    addRect(openingRight, right, bottom, openingTop)
    addRect(left, right, openingTop, top)
  }

  return rects
}

/**
 * Returns reference PCB antenna centerlines in the component-local PCB frame.
 * This is a right-handed board frame: the primary feed is the point at the
 * origin, +X points right, +Y points toward the top of the board, +Z points
 * above the board, and every value is in mm. Parent placement and rotation
 * transform these points; placing the component on the bottom layer mirrors X
 * and flips copper.
 *
 * These are practical starting geometries, not pre-tuned RF designs. Their
 * topology and envelopes follow common 2.4 GHz reference layouts (about 15x6
 * mm MIFA, 26x8 mm IFA, and 46x9 mm folded dipole). Board stackup, ground-plane
 * edge, enclosure, and matching network still require RF validation and tuning.
 */
export const getGeneratedAntennaGeometry = (
  antennaShape: AntennaShape,
): GeneratedAntennaGeometry => {
  switch (antennaShape) {
    case "2.4ghz_quarter_wave_monopole":
      return {
        traceWidth: 0.6,
        feedPoint: { x: 0, y: 0 },
        feedKeepoutOpeningDirection: "left",
        route: [
          { x: 0, y: 0 },
          { x: 31, y: 0 },
        ],
      }

    case "2.4ghz_meandered_monopole":
      return {
        traceWidth: 0.5,
        feedPoint: { x: 0, y: 0 },
        feedKeepoutOpeningDirection: "bottom",
        route: [
          { x: 0, y: 0 },
          { x: 0, y: 6 },
          { x: 3, y: 6 },
          { x: 3, y: 1.5 },
          { x: 6, y: 1.5 },
          { x: 6, y: 6 },
          { x: 9, y: 6 },
          { x: 9, y: 1.5 },
          { x: 12, y: 1.5 },
          { x: 12, y: 6 },
          { x: 15, y: 6 },
        ],
      }

    case "2.4ghz_inverted_f":
      return {
        traceWidth: 0.8,
        feedPoint: { x: 0, y: 0 },
        feedKeepoutOpeningDirection: "bottom",
        secondaryPort: { point: { x: -4, y: 0 }, role: "ground" },
        groundViaPoint: { x: -4, y: 0 },
        route: [
          { x: -4, y: 0 },
          { x: -4, y: 3 },
          { x: 0, y: 3 },
          { x: 0, y: 0 },
          { x: 0, y: 3 },
          { x: -4, y: 3 },
          { x: -4, y: 8 },
          { x: 22, y: 8 },
        ],
      }

    case "2.4ghz_meandered_inverted_f":
      return {
        traceWidth: 0.5,
        feedPoint: { x: 0, y: 0 },
        feedKeepoutOpeningDirection: "bottom",
        secondaryPort: { point: { x: -1.7, y: 0 }, role: "ground" },
        groundViaPoint: { x: -1.7, y: 0 },
        route: [
          { x: -1.7, y: 0 },
          { x: -1.7, y: 4.9 },
          { x: 0, y: 4.9 },
          { x: 0, y: 0 },
          { x: 0, y: 4.9 },
          { x: -1.7, y: 4.9 },
          { x: 2.3, y: 4.9 },
          { x: 2.3, y: 1.4 },
          { x: 5.3, y: 1.4 },
          { x: 5.3, y: 4.9 },
          { x: 8.3, y: 4.9 },
          { x: 8.3, y: 1.4 },
          { x: 11.3, y: 1.4 },
          { x: 11.3, y: 4.9 },
          { x: 13.3, y: 4.9 },
        ],
      }

    case "2.4ghz_folded_dipole":
      return {
        traceWidth: 0.9,
        feedPoint: { x: 0, y: 0 },
        feedKeepoutOpeningDirection: "bottom",
        secondaryPort: { point: { x: 1.2, y: 0 }, role: "feed2" },
        route: [
          { x: 0, y: 0 },
          { x: -22.4, y: 0 },
          { x: -22.4, y: 9 },
          { x: 23.6, y: 9 },
          { x: 23.6, y: 0 },
          { x: 1.2, y: 0 },
        ],
      }
  }
}
