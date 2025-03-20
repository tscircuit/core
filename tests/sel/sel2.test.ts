import { sel } from "lib/sel"
import { test, expect } from "bun:test"
import type { ChipProps } from "@tscircuit/props"

test("sel2 - SelAsStringFn - sel('U1').pin1 = .U1 > .pin1", () => {
  expect(sel("U1").pin1).toBe(".U1 > .pin1")
})

test("sel2 - SelAsStringFn - sel('R1').pin1 = .R1 > .pin1", () => {
  expect(sel("R1").pin1).toBe(".R1 > .pin1")
})

test("sel2 - SelAsStringFn - sel('CN1').pin1 = .CN1 > .pin1", () => {
  expect(sel("CN1").pin1).toBe(".CN1 > .pin1")
})

test("sel2 - SelAsStringFn - sel('Q1').base = .Q1 > .base", () => {
  expect(sel("Q1").base).toBe(".Q1 > .base")
})

test("sel2 - SelAsStringFn - invalid pin name", () => {
  // @ts-expect-error
  const someval = sel("U1").invalidPin
})

// Test SelAsChipFn
interface MyCustomChipProps extends ChipProps<any> {
  pinLabels: {
    customPin1: string
    customPin2: string
    VCC: string
    GND: string
  }
}

const MyChip: MyCustomChipProps = {
  refdes: "U1",
  pinLabels: {
    customPin1: "1",
    customPin2: "2",
    VCC: "3",
    GND: "4"
  }
}

test("sel2 - SelAsChipFn - sel(MyChip).customPin1 = .U1 > .customPin1", () => {
  expect(sel(MyChip).customPin1).toBe(".U1 > .customPin1")
})

test("sel2 - SelAsChipFn - sel(MyChip).VCC = .U1 > .VCC", () => {
  expect(sel(MyChip).VCC).toBe(".U1 > .VCC")
})

test("sel2 - SelAsChipFn - sel(MyChip).GND = .U1 > .GND", () => {
  expect(sel(MyChip).GND).toBe(".U1 > .GND")
})

test("sel2 - SelAsChipFn - invalid pin name", () => {
  // @ts-expect-error
  const someval = sel(MyChip).invalidPin
})

// Test with chip that has no refdes
interface NoRefChipProps extends ChipProps<any> {
  pinLabels: {
    pin1: string
    pin2: string
  }
}

const InvalidChip: Partial<NoRefChipProps> = {
  pinLabels: {
    pin1: "1",
    pin2: "2"
  }
}

test("sel2 - SelAsChipFn - missing refdes should cause error", () => {
  // @ts-expect-error
  const someval = sel(InvalidChip).pin1
})