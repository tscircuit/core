import { RT9013_33GB } from "../imports/RT9013_33GB"
import type { GroupProps } from "@tscircuit/props"

export const VoltageRegulator = (groupProps: GroupProps) => (
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
