import { expect, test } from "bun:test"
import { point } from "@flatten-js/core"
import { isRouteOutsideBoard } from "lib/utils/is-route-outside-board"
import { getPcbBoardOutlinePolygon } from "lib/utils/get-pcb-board-outline-polygon"

test("trace crossing a concave board notch is outside despite inside endpoints", () => {
  // Board-world points in mm, +X right, +Y up. The U-shaped board has an
  // open notch between x=2..4 above y=2; a straight left-to-right trace
  // between its upper arms crosses empty space.
  const pcbBoard = {
    center: { x: 3, y: 3 },
    width: 6,
    height: 6,
    outline: [
      { x: 0, y: 0 },
      { x: 6, y: 0 },
      { x: 6, y: 6 },
      { x: 4, y: 6 },
      { x: 4, y: 2 },
      { x: 2, y: 2 },
      { x: 2, y: 6 },
      { x: 0, y: 6 },
    ],
  }
  const polygon = getPcbBoardOutlinePolygon(pcbBoard)
  expect(polygon.contains(point(1, 5))).toBe(true)
  expect(polygon.contains(point(5, 5))).toBe(true)
  expect(polygon.contains(point(3, 5))).toBe(false)
  const db = { pcb_board: { get: () => pcbBoard } } as unknown as Parameters<
    typeof isRouteOutsideBoard
  >[0]["db"]
  const wire = (x: number, y: number) => ({
    route_type: "wire" as const,
    x,
    y,
    width: 0.15,
    layer: "top" as const,
  })
  const isOutside = (coordinates: [number, number][]) =>
    isRouteOutsideBoard({
      db,
      pcbBoardId: "board",
      mergedRoute: coordinates.map(([x, y]) => wire(x, y)),
    })

  expect(
    isOutside([
      [1, 5],
      [1, 1],
      [5, 1],
      [5, 5],
    ]),
  ).toBe(false)
  expect(
    isOutside([
      [1, 5],
      [3, 5],
      [5, 5],
    ]),
  ).toBe(true)
  expect(
    isOutside([
      [1, 5],
      [5, 5],
    ]),
  ).toBe(true)
  // The notch floor and outer edges remain legal centerlines.
  expect(
    isOutside([
      [1, 2],
      [5, 2],
    ]),
  ).toBe(false)
  expect(
    isOutside([
      [0, 0],
      [6, 0],
    ]),
  ).toBe(false)
  // A route touching the re-entrant corner without leaving copper is legal.
  expect(
    isOutside([
      [1, 3],
      [3, 1],
    ]),
  ).toBe(false)
  // Coincident wire/via positions and empty routes keep existing behavior.
  expect(
    isOutside([
      [1, 5],
      [1, 5],
      [1, 1],
    ]),
  ).toBe(false)
  expect(isOutside([[1, 5]])).toBe(false)
  expect(isOutside([])).toBe(false)
  expect(isOutside([[3, 5]])).toBe(true)
  // Checking only a segment's midpoint also misses excursions: (3, 1.5)
  // is inside, but this diagonal first cuts the empty side of the notch.
  expect(
    isOutside([
      [1, 3],
      [5, 0],
    ]),
  ).toBe(true)
  const throughPad = (start: [number, number], end: [number, number]) => ({
    route_type: "through_pad" as const,
    pcb_port_id: "port",
    start: { x: start[0], y: start[1] },
    end: { x: end[0], y: end[1] },
    start_layer: "top" as const,
    end_layer: "top" as const,
    width: 0.15,
  })
  expect(
    isRouteOutsideBoard({
      db,
      pcbBoardId: "board",
      mergedRoute: [throughPad([1, 5], [5, 5])],
    }),
  ).toBe(true)
  expect(
    isRouteOutsideBoard({
      db,
      pcbBoardId: "board",
      mergedRoute: [throughPad([1, 1], [5, 1])],
    }),
  ).toBe(false)
  expect(
    isRouteOutsideBoard({
      db,
      pcbBoardId: "board",
      mergedRoute: [
        wire(1, 1),
        {
          route_type: "via",
          x: 1,
          y: 1,
          from_layer: "top",
          to_layer: "bottom",
        },
        { ...wire(5, 1), layer: "bottom" },
      ],
    }),
  ).toBe(false)
})
