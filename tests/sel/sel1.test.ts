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

test("sel1 - sel.net.TXLED = net.TXLED", () => {
  expect(sel.net.TXLED).toBe("net.TXLED")
})

test("sel1 - sel.net.RXLED = net.RXLED", () => {
  expect(sel.net.RXLED).toBe("net.RXLED")
})

test("sel1 - sel.net.CTS = net.CTS", () => {
  expect(sel.net.CTS).toBe("net.CTS")
})

test("sel1 - sel.net.SLEEP = net.SLEEP", () => {
  expect(sel.net.SLEEP).toBe("net.SLEEP")
})

test("sel1 - sel.net.TXDEN = net.TXDEN", () => {
  expect(sel.net.TXDEN).toBe("net.TXDEN")
})

test("sel1 - sel.net.PWREN = net.PWREN", () => {
  expect(sel.net.PWREN).toBe("net.PWREN")
})

test("sel1 - sel.net.TXD = net.TXD", () => {
  expect(sel.net.TXD).toBe("net.TXD")
})

test("sel1 - sel.net.DTR = net.DTR", () => {
  expect(sel.net.DTR).toBe("net.DTR")
})

test("sel1 - sel.net.RTS = net.RTS", () => {
  expect(sel.net.RTS).toBe("net.RTS")
})

test("sel1 - sel.net.VCCIO = net.VCCIO", () => {
  expect(sel.net.VCCIO).toBe("net.VCCIO")
})

test("sel1 - sel.net.RXD = net.RXD", () => {
  expect(sel.net.RXD).toBe("net.RXD")
})

test("sel1 - sel.net.RI = net.RI", () => {
  expect(sel.net.RI).toBe("net.RI")
})

test("sel1 - sel.net.DSR = net.DSR", () => {
  expect(sel.net.DSR).toBe("net.DSR")
})

test("sel1 - sel.net.DCD = net.DCD", () => {
  expect(sel.net.DCD).toBe("net.DCD")
})
