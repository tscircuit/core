import { sel } from "lib/sel"
import { test, expect } from "bun:test"

test("sel1 - sel.R1.pos = .R1 > .pos", () => {
  expect(sel.R1.pos).toBe(".R1 > .pos")
})

test("sel1 - sel.U1.VCC = .U1 > .VCC", () => {
  expect(sel.U1.VCC).toBe(".U1 > .VCC")
})

test("sel1 - invalid refdes", () => {
  // @ts-expect-error
  const someval = sel.ASDF1.pin1
})

test("sel1 - invalid net", () => {
  // @ts-expect-error
  const someval = sel.net.ASDF1
})

test("sel1 - invalid pin number", () => {
  // @ts-expect-error
  const someval = sel.R1.pin3
})

test("sel1 - sel.net.VCC = net.VCC", () => {
  expect(sel.net.VCC).toBe("net.VCC")
})

test("sel1 - sel.net.VIN = net.VIN", () => {
  expect(sel.net.VIN).toBe("net.VIN")
})

test("sel1 - sel.net.EN = net.EN", () => {
  expect(sel.net.EN).toBe("net.EN")
})

test("sel1 - sel.net.SHLD = net.SHLD", () => {
  expect(sel.net.SHLD).toBe("net.SHLD")
})

test("sel1 - sel.U1.SHLD = .U1 > .SHLD", () => {
  expect(sel.U1.SHLD).toBe(".U1 > .SHLD")
})

test("sel1 - sel.CN1.pin1 = .CN1 > .pin1", () => {
  expect(sel.CN1.pin1).toBe(".CN1 > .pin1")
})

test("sel1 - sel.CN20.pin10 = .CN20 > .pin10", () => {
  expect(sel.CN20.pin10).toBe(".CN20 > .pin10")
})

test("sel1 - sel.F1.pin2 = .F1 > .pin2", () => {
  expect(sel.F1.pin2).toBe(".F1 > .pin2")
})
test("sel1 - sel.SW1.pin3 = .SW1 > .pin3", () => {
  expect(sel.SW1.pin3).toBe(".SW1 > .pin3")
})
test("sel1 - sel.SW1.pin4 = .SW1 > .pin4", () => {
  expect(sel.SW1.pin4).toBe(".SW1 > .pin4")
})

test("sel1 - invalid CN pin number", () => {
  // @ts-expect-error
  const someval = sel.CN1.pin101
})

test("sel1 - sel.subcircuit.S1.U1.pin1 = subcircuit.S1 > .pin1", () => {
  expect(sel.subcircuit.S1.U1.pin1).toBe("subcircuit.S1 > .U1 > .pin1")
})

test("sel1 - sel.net.INT = net.INT", () => {
  expect(sel.net.INT).toBe("net.INT")
})

test("sel1 - sel.U1.INT = .U1 > .INT", () => {
  expect(sel.U1.INT).toBe(".U1 > .INT")
})

test("sel1 - sel.net.N_INT = net.N_INT", () => {
  expect(sel.net.N_INT).toBe("net.N_INT")
})

test("sel1 - sel.U1.N_INT = .U1 > .N_INT", () => {
  expect(sel.U1.N_INT).toBe(".U1 > .N_INT")
})

test("sel1 - sel.net.N_CS = net.N_CS", () => {
  expect(sel.net.N_CS).toBe("net.N_CS")
})

test("sel1 - sel.U1.N_CS = .U1 > .N_CS", () => {
  expect(sel.U1.N_CS).toBe(".U1 > .N_CS")
})

test("sel1 - sel.TP1.pin1 = .TP1 > .pin1", () => {
  expect(sel.TP1.pin1).toBe(".TP1 > .pin1")
})
