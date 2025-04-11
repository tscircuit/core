import { test, expect } from "bun:test"
import type { Connections, Selectors } from "@tscircuit/props"
import { sel } from "lib/sel"

// Define a simple module that uses the `connections` prop
const MyModuleWithConnections = (props: {
  name: string
  connections: {
    GND: string
    VCC?: string
  }
}) => {
  // This component doesn't need to render anything for sel tests
  // sel works purely on the type level and proxy structure
  return null
}

// Define a simple module that uses the `selectors` prop
const MyModuleWithSelectors = (props: {
  name: string
  selectors: {
    U1: { GND: string; VCC?: string }
    R1: { pin1: string; pin2: string }
  }
}) => {
  // This component doesn't need to render anything for sel tests
  return null
}

test("sel3 - sel with connections prop", () => {
  const selM1 = sel.M1(MyModuleWithConnections)

  expect(selM1.GND).toBe(".M1 > .GND")
  expect(selM1.VCC).toBe(".M1 > .VCC")

  // @ts-expect-error - Should error for non-existent connection keys
  const invalidConnection = selM1.INVALID_KEY
})

test("sel3 - sel with selectors prop", () => {
  const selM2 = sel.M2(MyModuleWithSelectors)

  expect(selM2.U1.GND).toBe(".M2 > .U1 > .GND")
  expect(selM2.U1.VCC).toBe(".M2 > .U1 > .VCC")
  expect(selM2.R1.pin1).toBe(".M2 > .R1 > .pin1")
  expect(selM2.R1.pin2).toBe(".M2 > .R1 > .pin2")

  // @ts-expect-error - Should error for non-existent selector keys
  const invalidSelector = selM2.U2

  // @ts-expect-error - Should error for non-existent connection keys within a selector
  const invalidConnectionInSelector = selM2.U1.INVALID_KEY
})
