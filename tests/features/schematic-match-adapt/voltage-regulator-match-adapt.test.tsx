import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import type { ChipProps, GroupProps } from "@tscircuit/props"

const pinLabels = {
  pin1: ["VIN"],
  pin2: ["GND"],
  pin3: ["EN"],
  pin4: ["NC"],
  pin5: ["VOUT"],
} as const

const RT9013_33GB = (props: ChipProps<typeof pinLabels>) => {
  return (
    <chip
      pinLabels={pinLabels}
      supplierPartNumbers={{
        jlcpcb: ["C47773"],
      }}
      manufacturerPartNumber="RT9013_33GB"
      {...props}
    />
  )
}

const VoltageRegulator = (groupProps: GroupProps) => (
  <group {...groupProps}>
    <capacitor
      name="C6"
      schOrientation="vertical"
      footprint="0402"
      capacitance="2.2uF"
    />
    <capacitor
      name="C1"
      schOrientation="vertical"
      footprint="0402"
      capacitance="2.2uF"
    />
    <capacitor
      name="C2"
      schOrientation="vertical"
      footprint="0402"
      capacitance="2.2uF"
    />
    <capacitor
      name="C5"
      schOrientation="vertical"
      footprint="0402"
      capacitance="1uF"
    />
    <RT9013_33GB
      name="U1"
      connections={{
        VIN: ["C6.1", "C1.1", "C2.1", "net.VSYS"],
        GND: ["C6.2", "C1.2", "C2.2", "net.GND"],
        EN: "U1.1",
        VOUT: ["net.V3_3", "C5.1"],
      }}
    />
    <trace from="C5.2" to="net.GND" />
  </group>
)

test("voltage-regulator-match-adapt", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="15mm" routingDisabled>
      <VoltageRegulator matchAdapt name="voltage_regulator" />
    </board>,
  )

  circuit.render()

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
