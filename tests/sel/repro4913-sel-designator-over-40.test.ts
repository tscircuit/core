import { expect, test } from "bun:test"
import type { ChipProps } from "@tscircuit/props"
import { sel } from "lib/sel"

const pinLabels = {
  pin1: "VIN",
} as const

const MyChip = (_props: ChipProps<typeof pinLabels>) => null

test("sel supports designators above 40", () => {
  // @ts-expect-error U501 falls back to the generic selector because Nums40 stops at 40.
  expect(sel.U501.VIN).toBe(".U501 > .VIN")

  // @ts-expect-error U501 falls back to the generic selector because Nums40 stops at 40.
  expect(sel.U501(MyChip).VIN).toBe(".U501 > .VIN")
})
