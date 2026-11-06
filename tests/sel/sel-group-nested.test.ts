import { sel } from "lib/sel/sel"
import { test, expect } from "bun:test"

test("sel.group.G1.R1.pin1 constructs nested group pin selector", () => {
  expect(String(sel.group.G1.R1.pin1)).toBe("group.G1 > .R1 > .pin1")
})

test("sel.group.G1.R1.pin2 constructs nested group pin selector for pin2", () => {
  expect(String(sel.group.G2.R2.pin2)).toBe("group.G2 > .R2 > .pin2")
})

test("sel.subcircuit nested selector still works", () => {
  expect(String(sel.subcircuit.S1.U1.pin1)).toBe(
    "subcircuit.S1 > .U1 > .pin1",
  )
})

test("plain component selector unchanged", () => {
  expect(String(sel.R1.pin1)).toBe(".R1 > .pin1")
  expect(String(sel.U1.pin1)).toBe(".U1 > .pin1")
})
