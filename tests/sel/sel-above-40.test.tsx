import { sel } from "lib/sel"
import { test, expect } from "bun:test"
import type { ChipProps } from "@tscircuit/props"

const pinLabels = {
  pin1: "VIN",
  pin2: "VOUT",
  pin3: "GND",
} as const

const MyChip = (props: ChipProps<typeof pinLabels>) => (
  <chip {...props} pinLabels={pinLabels} />
)

test("sel supports designators above 40 for typed chips and conventional pins", () => {
  // Chip typed with component function
  expect(sel.U501(MyChip).VIN).toBe(".U501 > .VIN")
  expect(sel.U501(MyChip).VOUT).toBe(".U501 > .VOUT")
  expect(sel.U501(MyChip).GND).toBe(".U501 > .GND")

  // @ts-expect-error invalid pin on typed chip
  expect(sel.U501(MyChip).DOES_NOT_EXIST).toBe(".U501 > .DOES_NOT_EXIST")

  // Conventional dot access on chips
  expect(sel.U501.VIN).toBe(".U501 > .VIN")
  expect(sel.U501.pin1).toBe(".U501 > .pin1")

  // Resistors above 40
  expect(sel.R535.pin1).toBe(".R535 > .pin1")
  expect(sel.R535.pin2).toBe(".R535 > .pin2")

  // Capacitors above 40
  expect(sel.C403.anode).toBe(".C403 > .anode")
  expect(sel.C403.cathode).toBe(".C403 > .cathode")

  // Diodes above 40
  expect(sel.D101.anode).toBe(".D101 > .anode")

  // Transistors above 40
  expect(sel.Q201.gate).toBe(".Q201 > .gate")

  // Jumpers above 40
  expect(sel.J102.pin1).toBe(".J102 > .pin1")

  // Switches above 40
  expect(sel.SW101.pin1).toBe(".SW101 > .pin1")

  // Test points above 40
  expect(sel.TP105.pin1).toBe(".TP105 > .pin1")

  // Common nets above 40
  expect(sel.net.GPIO50).toBe("net.GPIO50")
})

