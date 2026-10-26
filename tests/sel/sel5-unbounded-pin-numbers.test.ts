import { test, expect } from "bun:test"
import { sel } from "lib/sel"

// RP2350 exposes GPIO0..GPIO47, ESP32-P4 has 55 pins, and BGA parts have
// A1..A100+ rows, so the numeric pin-name families cannot stop at 40.
test("sel5 - numeric pin names are not capped at 40", () => {
  expect(sel.U1.GPIO47).toBe(".U1 > .GPIO47")
  expect(sel.U1.GP47).toBe(".U1 > .GP47")
  expect(sel.U1.D41).toBe(".U1 > .D41")
  expect(sel.U1.A55).toBe(".U1 > .A55")
  expect(sel.U1.B96).toBe(".U1 > .B96")
  expect(sel.U1.pin101).toBe(".U1 > .pin101")
})

test("sel5 - numeric net names are not capped at 40", () => {
  expect(sel.net.GPIO48).toBe("net.GPIO48")
  expect(sel.net.GPIO120).toBe("net.GPIO120")
})

test("sel5 - non-numeric suffixes are still rejected", () => {
  // @ts-expect-error - GPIOfour is not a pin name
  sel.U1.GPIOfour
  // @ts-expect-error - GPIO4x is not a number
  sel.U1.GPIO4x
})
