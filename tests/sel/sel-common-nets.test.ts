import { sel } from "lib/sel"
import { test, expect } from "bun:test"

test("sel.net.VBUS = net.VBUS", () => {
  expect(sel.net.VBUS).toBe("net.VBUS")
})

test("sel.net.SWCLK = net.SWCLK", () => {
  expect(sel.net.SWCLK).toBe("net.SWCLK")
})

test("sel.net.USB_DM = net.USB_DM", () => {
  expect(sel.net.USB_DM).toBe("net.USB_DM")
})

test("sel.net.USB_DP = net.USB_DP", () => {
  expect(sel.net.USB_DP).toBe("net.USB_DP")
})

test("sel.net.QSPI_SS = net.QSPI_SS", () => {
  expect(sel.net.QSPI_SS).toBe("net.QSPI_SS")
})

test("sel.net.XIN = net.XIN", () => {
  expect(sel.net.XIN).toBe("net.XIN")
})

test("sel.net.XOUT = net.XOUT", () => {
  expect(sel.net.XOUT).toBe("net.XOUT")
})

test("sel.net.RUN = net.RUN", () => {
  expect(sel.net.RUN).toBe("net.RUN")
})

test("sel.net.SWD = net.SWD", () => {
  expect(sel.net.SWD).toBe("net.SWD")
})

test("sel.net.GPIO0 = net.GPIO0", () => {
  expect(sel.net.GPIO0).toBe("net.GPIO0")
})

test("sel.net.GPIO28 = net.GPIO28", () => {
  expect(sel.net.GPIO28).toBe("net.GPIO28")
})
