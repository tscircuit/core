import { sel } from "lib/sel"
import { test, expect } from "bun:test"
import type { Connections, Selectors } from "@tscircuit/props"

// Define a simple module that uses the `connections` prop
const MyModuleWithConnections = (props: {
  name: string
  connections: Connections<"GND" | "VCC">
}) => {
  // This component doesn't need to render anything for sel tests
  // sel works purely on the type level and proxy structure
  return null
}

// Define a simple module that uses the `selectors` prop
const MyModuleWithSelectors = (props: {
  name: string
  selectors: Selectors & {
    U1: Connections<"GND" | "VCC">
    R1: Connections<"pin1" | "pin2">
  }
}) => {
  // This component doesn't need to render anything for sel tests
  return null
}

test("sel3 - sel with connections prop", () => {
  // Simulate how sel would resolve paths if MyModuleWithConnections internally connected:
  // capacitor C1 anode -> props.connections.GND
  // capacitor C1 cathode -> props.connections.VCC
  // For the purpose of this test, we assume sel knows this internal mapping.
  // In a real scenario, this mapping is derived during rendering/analysis.
  // The key point is testing the proxy structure generation.

  // Normally, sel resolution requires the component definition or an instance.
  // We pass the component function to provide type information.
  const selM1 = sel.M1(MyModuleWithConnections)

  // Although the component returns null, sel generates the expected proxy structure.
  // The actual resolution to internal paths like ".M1 > .C1 > .anode"
  // would happen in a full circuit context, but the proxy access pattern is correct.
  expect(selM1.GND).toBe(".M1 > .GND")
  expect(selM1.VCC).toBe(".M1 > .VCC")

  // @ts-expect-error - Should error for non-existent connection keys
  const invalidConnection = selM1.INVALID_KEY
})

test("sel3 - sel with selectors prop", () => {
  // Simulate how sel would resolve paths if MyModuleWithSelectors internally connected:
  // capacitor C1 anode -> props.selectors.U1.GND
  // capacitor C1 cathode -> props.selectors.U1.VCC
  // resistor R1 pin1 -> props.selectors.R1.pin1
  // resistor R1 pin2 -> props.selectors.R1.pin2
  // We pass the component function to provide type information.
  const selM2 = sel.M2(MyModuleWithSelectors)

  // Accessing connections via the selectors structure
  expect(selM2.U1.GND).toBe(".M2 > .U1 > .GND")
  expect(selM2.U1.VCC).toBe(".M2 > .U1 > .VCC")
  expect(selM2.R1.pin1).toBe(".M2 > .R1 > .pin1")
  expect(selM2.R1.pin2).toBe(".M2 > .R1 > .pin2")

  // @ts-expect-error - Should error for non-existent selector keys
  const invalidSelector = selM2.U2

  // @ts-expect-error - Should error for non-existent connection keys within a selector
  const invalidConnectionInSelector = selM2.U1.INVALID_KEY
})
