import { expect, test } from "bun:test"
import type { ChipProps } from "@tscircuit/props"
import { sel } from "lib/sel"

const CustomChip = (props: ChipProps<"VIN" | "VOUT" | "EN" | "FB">) => null

test("sel supports conventional designators above 40", () => {
  expect(sel.U501.VIN).toBe(".U501 > .VIN")
  expect(sel.R535.pin1).toBe(".R535 > .pin1")
  expect(sel.C403.pos).toBe(".C403 > .pos")
  expect(sel.D100.anode).toBe(".D100 > .anode")
  expect(sel.Q100.gate).toBe(".Q100 > .gate")
  expect(sel.TP50.pin1).toBe(".TP50 > .pin1")
  expect(sel.JP99.pin1).toBe(".JP99 > .pin1")
  expect(sel.F100.pin1).toBe(".F100 > .pin1")
  expect(sel.SW50.pin1).toBe(".SW50 > .pin1")
  expect(sel.net.GPIO50).toBe("net.GPIO50")
})

test("sel supports chip-typed references for designators above 40", () => {
  expect(sel.U501(CustomChip).VIN).toBe(".U501 > .VIN")
  expect(sel.U501(CustomChip).VOUT).toBe(".U501 > .VOUT")
  expect(sel.U501(CustomChip).EN).toBe(".U501 > .EN")
  expect(sel.U501(CustomChip).FB).toBe(".U501 > .FB")
})

test("sel preserves type errors for invalid prefix or non-existent pins", () => {
  // @ts-expect-error - ASDF is not a valid component prefix
  const invalidPrefix = sel.ASDF501.pin1

  // @ts-expect-error - pin3 does not exist on 2-pin resistor
  const invalidResistorPin = sel.R535.pin3
})
