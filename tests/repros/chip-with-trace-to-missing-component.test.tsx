import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { sel, RootCircuit } from "tscircuit"
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

const ExampleCircuit = () => (
  <board width="25.4mm" height="12.7mm" routingDisabled>
    <group>
      <capacitor
        name="C6"
        schOrientation="vertical"
        footprint="0402"
        capacitance="2.2uF"
        schX={-4}
      />
      <capacitor
        name="C1"
        schOrientation="vertical"
        footprint="0402"
        capacitance="2.2uF"
        schX={-3.2}
      />
      <capacitor
        name="C2"
        schOrientation="vertical"
        footprint="0402"
        capacitance="2.2uF"
        schX={-2.4}
      />
      <capacitor
        name="C5"
        schOrientation="vertical"
        footprint="0402"
        capacitance="1uF"
        schX={2}
      />
      <SOIC
        name="U1"
        connections={{
          VIN: ["C6.1", "C1.1", "C2.1", "net.VSYS"],
          GND: ["C6.2", "C1.2", "C2.2", "net.GND"],
          EN: "U1.1",
          VOUT: ["net.V3_3", "C5.1"],
        }}
      />
      <trace from="C4.2" to="net.GND" />
      <trace from="C5.2" to="net.GND" />
    </group>
  </board>
)

test("chip with trace to missing component", () => {
  const { circuit } = getTestFixture()

  circuit.add(<ExampleCircuit />)

  circuit.render()

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
