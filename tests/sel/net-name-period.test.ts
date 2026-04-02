import { preprocessSelector } from "lib/components/base-components/PrimitiveComponent/preprocessSelector"
import { test, expect } from "bun:test"

test("preprocessSelector - dot after net prefix throws", () => {
  expect(() => preprocessSelector("net.VCC.extra")).toThrow(
    'Net names cannot contain a period. Use "sel.net.V3_3" for common nets or \'sel.net<"CUSTOM_NET">().CUSTOM_NET\' for custom nets.',
  )
})
