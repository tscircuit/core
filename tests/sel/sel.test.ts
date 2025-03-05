import { sel } from "../../lib/sel"
import { expect, test } from "bun:test"

// Mock component class
class A555Timer {
  static pinLabels = {
    VCC: "VCC",
    DISCH: "DISCH",
    THRES: "THRES",
    CTRL: "CTRL",
    GND: "GND",
    TRIG: "TRIG",
    OUT: "OUT",
    RESET: "RESET",
  } as const
}

test("sel function pattern works with component types", () => {
  const result = sel(A555Timer).U1.VCC
  expect(result).toBe(".U1 > .VCC")
})

test("sel function pattern prevents access to non-existent pins", () => {
  // @ts-expect-error - DOES_NOT_EXIST is not a valid pin
  sel(A555Timer).U1.DOES_NOT_EXIST
})
