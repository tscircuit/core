import { sel } from "lib/sel"
import { test, expect } from "bun:test"
import type { ChipProps } from "@tscircuit/props"

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
  expect(sel.U1(MyChip).DOES_NOT_EXIST).toBe(".U1 > .CUSTOM_DATA_1")
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
