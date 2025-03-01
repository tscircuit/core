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

test("sel object pattern still works", () => {
  const result = sel.U1.pin1
  expect(result).toBe(".U1 > .pin1")
})

test("sel net pattern still works", () => {
  const result = sel.net.GND
  expect(result).toBe("net.GND")
})

test("sel subcircuit pattern still works", () => {
  const result = sel.subcircuit.S1.U1.pin1
  expect(result).toBe("subcircuit.S1 > .U1 > .pin1")
})

test("sel function pattern only works with valid U numbers", () => {
  const result = sel(A555Timer).U1.VCC
  expect(result).toBe(".U1 > .VCC")

  // @ts-expect-error - Invalid U number
  const invalidResult = sel(A555Timer).U999
  expect(invalidResult).toBeUndefined()
})
