import { preprocessSelector } from "lib/components/base-components/PrimitiveComponent/preprocessSelector"
import { test, expect } from "bun:test"

test("preprocessSelector - plus sign in net name throws", () => {
  expect(() => preprocessSelector("net.VCC+")).toThrow(
    'Net names cannot contain "+" or "-", try using underscores instead, e.g. VCC_P',
  )
})
