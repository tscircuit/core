import { describe, expect, test } from "bun:test"
import { underscorifyPortArrangement } from "lib/soup/underscorifyPortArrangement"

describe("underscorifyPortArrangement pin label resolution", () => {
  test("string labels resolve to pin numbers via the label resolver", () => {
    const out = underscorifyPortArrangement(
      {
        leftSide: { pins: ["pin1", "SCL"] },
      } as any,
      (label) => (label === "SCL" ? 5 : label === "pin1" ? 1 : null),
    )
    expect(out?.left_side?.pins).toEqual([1, 5])
  })

  test("numeric pins pass through unchanged", () => {
    const out = underscorifyPortArrangement(
      {
        leftSide: { pins: [1, 2, 3] },
      } as any,
      () => null,
    )
    expect(out?.left_side?.pins).toEqual([1, 2, 3])
  })

  test("unresolvable label falls back to numeric parse", () => {
    const out = underscorifyPortArrangement(
      {
        leftSide: { pins: ["7"] },
      } as any,
      () => null,
    )
    expect(out?.left_side?.pins).toEqual([7])
  })

  test("size-based arrangements are unchanged", () => {
    const out = underscorifyPortArrangement({
      leftPinCount: 8,
      rightPinCount: 8,
    } as any)
    expect(out).toEqual({ left_size: 8, right_size: 8 })
  })
})
