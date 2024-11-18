import { describe, expect, test } from "bun:test"
import { getRelativeDirection } from "lib/utils/get-relative-direction"

describe("getRelativeDirection", () => {
  test("returns correct direction based on largest distance", () => {
    expect(getRelativeDirection({ x: 0, y: 0 }, { x: 5, y: 1 })).toBe("right")
    expect(getRelativeDirection({ x: 0, y: 0 }, { x: -5, y: 1 })).toBe("left")
    expect(getRelativeDirection({ x: 0, y: 0 }, { x: 1, y: 5 })).toBe("up")
    expect(getRelativeDirection({ x: 0, y: 0 }, { x: 1, y: -5 })).toBe("down")
  })

  test("handles equal distances by using horizontal priority", () => {
    expect(getRelativeDirection({ x: 0, y: 0 }, { x: 5, y: 5 })).toBe("right")
    expect(getRelativeDirection({ x: 0, y: 0 }, { x: -5, y: -5 })).toBe("left")
    expect(getRelativeDirection({ x: 0, y: 0 }, { x: -5, y: 5 })).toBe("left")
    expect(getRelativeDirection({ x: 0, y: 0 }, { x: 5, y: -5 })).toBe("right")
  })

  test("handles zero distances", () => {
    expect(getRelativeDirection({ x: 0, y: 0 }, { x: 0, y: 0 })).toBe("right")
    expect(getRelativeDirection({ x: 10, y: 10 }, { x: 10, y: 10 })).toBe("right")
  })

  test("works with arbitrary coordinates", () => {
    expect(getRelativeDirection({ x: 10, y: 10 }, { x: 15, y: 11 })).toBe("right")
    expect(getRelativeDirection({ x: -5, y: 3 }, { x: -10, y: 4 })).toBe("left")
    expect(getRelativeDirection({ x: 2, y: -4 }, { x: 3, y: 1 })).toBe("up")
    expect(getRelativeDirection({ x: 8, y: 6 }, { x: 9, y: 1 })).toBe("down")
  })

  test("handles decimal coordinates", () => {
    expect(getRelativeDirection({ x: 0.5, y: 0.5 }, { x: 1.5, y: 0.7 })).toBe("right")
    expect(getRelativeDirection({ x: 1.1, y: 1.1 }, { x: 1.2, y: 2.1 })).toBe("up")
  })

  test("handles negative decimal coordinates", () => {
    expect(getRelativeDirection({ x: -0.5, y: -0.5 }, { x: -1.5, y: -0.6 })).toBe("left")
    expect(getRelativeDirection({ x: -1.1, y: -1.1 }, { x: -1.0, y: -2.1 })).toBe("down")
  })
})