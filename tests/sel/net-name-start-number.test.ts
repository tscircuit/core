import { preprocessSelector } from "lib/components/base-components/PrimitiveComponent/preprocessSelector"
import { test, expect } from "bun:test"

test("preprocessSelector - net name starting with number throws", () => {
  expect(() => preprocessSelector("net.1V")).toThrow(
    'Net name "1V" cannot start with a number, try using a prefix like "VBUS1"',
  )
})
