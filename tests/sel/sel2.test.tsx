import { sel } from "lib/sel"
import { test, expect } from "bun:test"
import type {
  ChipProps,
  PinLabelsProp,
  PinLabelFromPinLabelMap,
  ChipConnections,
  ChipPinLabels,
} from "@tscircuit/props"

const pinLabels = {
  pin1: "CUSTOM_DATA_1",
  pin2: "CUSTOM_DATA_2",
  pin3: "VCC",
  pin4: "GND",
} as const

const MyChip = (props: ChipProps<typeof pinLabels>) => (
  <chip {...props} pinLabels={pinLabels} />
)

test("sel2 - sel.U1(MyChip).CUSTOM_DATA_1 = .U1 > .CUSTOM_DATA_1", () => {
  expect(sel.U1(MyChip).CUSTOM_DATA_1).toBe(".U1 > .CUSTOM_DATA_1")

  // @ts-expect-error
  expect(sel.U1(MyChip).DOES_NOT_EXIST).toBe(".U1 > .DOES_NOT_EXIST")
})

test("sel2 - selU2.CUSTOM_DATA_1 = .U2 > .CUSTOM_DATA_1", () => {
  const U2 = (
    <MyChip
      name="U2"
      connections={{
        CUSTOM_DATA_1: sel.U1.A0,
      }}
    />
  )
  const selU2 = sel.U2(MyChip)

  expect(selU2.CUSTOM_DATA_1).toBe(".U2 > .CUSTOM_DATA_1")
})

test("sel2 - selU2.CUSTOM_DATA_1 = .U2 > .CUSTOM_DATA_1", () => {
  expect(sel.U2<"custompin1" | "custompin2">().custompin1.toString()).toBe(
    ".U2 > .custompin1",
  )

  // @ts-expect-error
  sel.U2<"custompin1" | "custompin2">().doesnotexist

  expect(sel.J1<"custompin1">().custompin1.toString()).toBe(".J1 > .custompin1")
})

test(`sel2 - ChipProps<"custompin1" | "custompin2">`, () => {
  const MyChip2 = (props: ChipProps<"custompin1" | "custompin2">) => (
    <chip {...props} pinLabels={pinLabels} />
  )

  const chip = <MyChip2 name="U1" />

  expect(sel.U1(MyChip2).custompin1.toString()).toBe(".U1 > .custompin1")
})
test("sel2 - sel.J1(MyChip).CUSTOM_DATA_1 = .J1 > .CUSTOM_DATA_1", () => {
  expect(sel.J1(MyChip).CUSTOM_DATA_1).toBe(".J1 > .CUSTOM_DATA_1")

  // @ts-expect-error
  expect(sel.J1(MyChip).DOES_NOT_EXIST).toBe(".J1 > .DOES_NOT_EXIST")
})
test("sel2 - selJ2.CUSTOM_DATA_1 = .J2 > .CUSTOM_DATA_1", () => {
  const J2 = (
    <MyChip
      name="J2"
      connections={{
        CUSTOM_DATA_1: sel.U1.A0,
      }}
    />
  )
  const selJ2 = sel.J2(MyChip)

  expect(selJ2.CUSTOM_DATA_1).toBe(".J2 > .CUSTOM_DATA_1")
})

test('sel2 - sel.J1<"custompin1">().custompin1 = .J1 > .custompin1', () => {
  expect(sel.J1<"custompin1">().custompin1.toString()).toBe(".J1 > .custompin1")

  // @ts-expect-error
  sel.J1<"custompin1">().doesnotexist
})
