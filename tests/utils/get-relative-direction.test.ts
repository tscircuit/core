import { describe, expect, test } from "bun:test"
import { getRelativeDirection } from "lib/utils/get-relative-direction"

describe("getRelativeDirection", () => {
  test("returns correct direction based on largest distance", () => {
    // Test horizontal directions
    expect(getRelativeDirection({ x: 0, y: 0 }, { x: 5, y: 1 })).toBe("right")
    expect(getRelativeDirection({ x: 0, y: 0 }, { x: -5, y: 1 })).toBe("left")

    // Test vertical directions
    expect(getRelativeDirection({ x: 0, y: 0 }, { x: 1, y: 5 })).toBe("up")
    expect(getRelativeDirection({ x: 0, y: 0 }, { x: 1, y: -5 })).toBe("down")
  })

  test.skip("handles equal distances by preferring horizontal", () => {
    expect(getRelativeDirection({ x: 0, y: 0 }, { x: 5, y: 5 })).toBe("right")
    expect(getRelativeDirection({ x: 0, y: 0 }, { x: -5, y: -5 })).toBe("left")
  })

  // Note sure what the default behavior should be
  test.skip("handles zero distances", () => {
    expect(getRelativeDirection({ x: 0, y: 0 }, { x: 0, y: 0 })).toBe("right")
  })

  test("works with arbitrary coordinates", () => {
    expect(getRelativeDirection({ x: 10, y: 10 }, { x: 15, y: 11 })).toBe(
      "right",
    )
    expect(getRelativeDirection({ x: -5, y: 3 }, { x: -10, y: 4 })).toBe("left")
    expect(getRelativeDirection({ x: 2, y: -4 }, { x: 3, y: 1 })).toBe("up")
    expect(getRelativeDirection({ x: 8, y: 6 }, { x: 9, y: 1 })).toBe("down")
  })
})
