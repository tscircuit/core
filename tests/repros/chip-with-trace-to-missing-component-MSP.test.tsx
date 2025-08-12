import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import type { ChipProps } from "@tscircuit/props"

const soicPinLabels = {
  pin1: ["VIN"],
  pin2: ["GND"],
  pin3: ["EN"],
  pin4: ["VOUT"],
  pin5: ["GP1"],
  pin6: ["GP2"],
  pin7: ["GP3"],
  pin8: ["GP4"],
} as const

const SOIC = (props: ChipProps<typeof soicPinLabels>) => {
  return (
    <chip
      pinLabels={soicPinLabels}
      supplierPartNumbers={{
        jlcpcb: ["C82342"],
      }}
      manufacturerPartNumber="RT9013-33GB"
      {...props}
    />
  )
}

// MSP-optimized version: Creates tree-like routing instead of star pattern
const ExampleCircuitMSP = () => (
  <board width="25.4mm" height="12.7mm" routingDisabled>
    <group>
      <capacitor
        name="C6"
        schOrientation="vertical"
        footprint="0402"
        capacitance="2.2uF"
        schX={-4}
        schY={-0.5}
      />
      <capacitor
        name="C1"
        schOrientation="vertical"
        footprint="0402"
        capacitance="2.2uF"
        schX={-3.2}
        schY={-0.5}
      />
      <capacitor
        name="C2"
        schOrientation="vertical"
        footprint="0402"
        capacitance="2.2uF"
        schX={-2.4}
        schY={-0.5}
      />
      <capacitor
        name="C5"
        schOrientation="vertical"
        footprint="0402"
        capacitance="1uF"
        schX={2}
        schY={-0.5}
      />
      {/* MSP-optimized chip connections: Connect to net.VSYS for power distribution */}
      <SOIC
        name="U1"
        schX={0}
        schY={-0.5}
        connections={{
          VIN: ["net.VSYS"], // Connect to power net
          GND: ["net.GND"], // Connect to ground net
          EN: "U1.1",
          VOUT: ["net.V3_3", "C5.1"],
        }}
      />
      {/* MSP-optimized traces: Create tree structure C6 -> C1 -> C2 -> U1.VIN */}
      <trace from="C6.1" to="C1.1" />
      <trace from="C1.1" to="C2.1" />
      <trace from="C2.1" to="U1.VIN" />

      {/* Similarly for GND connections: C6 -> C1 -> C2 -> U1.GND */}
      <trace from="C6.2" to="C1.2" />
      <trace from="C1.2" to="C2.2" />
      <trace from="C2.2" to="U1.GND" />

      {/* Other traces remain the same */}
      <trace from="C4.2" to="net.GND" />
      <trace from="C5.2" to="net.GND" />
    </group>
  </board>
)

test("chip with MSP-optimized trace routing", () => {
  const { circuit } = getTestFixture()

  circuit.add(<ExampleCircuitMSP />)

  circuit.render()

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
