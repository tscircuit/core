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

test("sel1 - sel.CN1.pin1 = .CN1 > .pin1", () => {
  expect(sel.CN1.pin1).toBe(".CN1 > .pin1")
})

test("sel1 - sel.CN20.pin10 = .CN20 > .pin10", () => {
  expect(sel.CN20.pin10).toBe(".CN20 > .pin10")
})

test("sel1 - invalid CN pin number", () => {
  // @ts-expect-error
  const someval = sel.CN1.pin101
})
