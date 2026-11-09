import { expect, test } from "bun:test"
import { Polygon } from "@flatten-js/core"
import { hasConductivePolygonContact } from "lib/utils/copper-pour-connectivity/has-conductive-polygon-contact"

test("pour contact requires overlap or a shared edge, including containment and crossing", () => {
  const square = new Polygon([
    [0, 0],
    [2, 0],
    [2, 2],
    [0, 2],
  ])
  const cases: Array<[Array<[number, number]>, boolean]> = [
    [
      [
        [2, 2],
        [3, 2],
        [3, 3],
        [2, 3],
      ],
      false,
    ],
    [
      [
        [0, 2],
        [1, 3],
        [2, 2],
        [2, 4],
        [0, 4],
      ],
      false,
    ],
    [
      [
        [2, 0],
        [3, 0],
        [3, 2],
        [2, 2],
      ],
      true,
    ],
    [
      [
        [1, 1],
        [3, 1],
        [3, 3],
        [1, 3],
      ],
      true,
    ],
    [
      [
        [0.5, 0.5],
        [1.5, 0.5],
        [1.5, 1.5],
        [0.5, 1.5],
      ],
      true,
    ],
    [
      [
        [-1, 0.9],
        [3, 0.9],
        [3, 1.1],
        [-1, 1.1],
      ],
      true,
    ],
  ]
  for (const [vertices, expected] of cases) {
    const other = new Polygon(vertices)
    expect(hasConductivePolygonContact(square, other, 1e-7)).toBe(expected)
    expect(hasConductivePolygonContact(other, square, 1e-7)).toBe(expected)
  }
})
