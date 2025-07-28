import { expect, test } from "bun:test"
import { baseGroupProps, type BaseGroupProps } from "@tscircuit/props"

test("should parse pcb layout props", () => {
  const raw: BaseGroupProps = {
    name: "g",
    pcbGrid: true,
    pcbGridCols: 2,
    pcbGridGap: "1mm",
    pcbFlex: true,
    pcbGap: "2mm",
  }
  const parsed = baseGroupProps.parse(raw)
  expect(parsed.pcbGrid).toBe(true)
  expect(parsed.pcbGridCols).toBe(2)
  expect(parsed.pcbGridGap).toBe("1mm")
  expect(parsed.pcbFlex).toBe(true)
  expect(parsed.pcbGap).toBe("2mm")
})
