import { test, expect } from "bun:test"
import type { ChipProps } from "@tscircuit/props"
import { sel } from "lib/sel"

// A chip whose pin labels are known, so `sel.U501(MyRegulator).VIN` can be
// checked against the chip's real pin names instead of falling back to never.
const regulatorPinLabels = {
  pin1: "VIN",
  pin2: "GND",
  pin3: "VOUT",
} as const

const MyRegulator = (props: ChipProps<typeof regulatorPinLabels>) => null

test("sel4 - designators above 40 exist", () => {
  // boards that number by block (U100, U200, U500) or just keep counting
  expect(sel.U41.VIN).toBe(".U41 > .VIN")
  expect(sel.U501.VIN).toBe(".U501 > .VIN")
  expect(sel.U999.pin1).toBe(".U999 > .pin1")
  expect(sel.R535.pos).toBe(".R535 > .pos")
  expect(sel.C403.anode).toBe(".C403 > .anode")
  expect(sel.Q120.gate).toBe(".Q120 > .gate")
  expect(sel.TP77.pin1).toBe(".TP77 > .pin1")
})

test("sel4 - chip-typed sel works above 40", () => {
  const vin = sel.U501(MyRegulator).VIN
  expect(vin).toBe(".U501 > .VIN")

  // pin names are checked against the chip's pin labels
  // @ts-expect-error - MyRegulator has no NOT_A_PIN
  sel.U501(MyRegulator).NOT_A_PIN

  // and still checked below 40, the covered case
  // @ts-expect-error - MyRegulator has no NOT_A_PIN
  sel.U6(MyRegulator).NOT_A_PIN
})

test("sel4 - unknown prefixes and pins are still rejected", () => {
  // @ts-expect-error - ZZ is not a refdes prefix
  sel.ZZ100.pin1

  // @ts-expect-error - a resistor has no pin3
  sel.R535.pin3

  // @ts-expect-error - a transistor has no pin1
  sel.Q500.pin1
})

test("sel4 - sel<Pin>(refdes) still works", () => {
  expect(sel<"VIN">("U501").VIN).toBe(".U501 > .VIN")
})
