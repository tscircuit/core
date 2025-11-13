import { preprocessSelector } from "lib/components/base-components/PrimitiveComponent/preprocessSelector"
import { test, expect } from "bun:test"

const mockComponent = { componentName: "MockComponent" } as any

test("preprocessSelector - plus sign in net name throws", () => {
  expect(() => preprocessSelector("net.VCC+", mockComponent)).toThrow(
    'Net names cannot contain "+" or "-" (component "MockComponent" received "VCC+" via "net.VCC+"). Try using underscores instead, e.g. VCC_P',
  )
})
