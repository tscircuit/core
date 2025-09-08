import { RP2040 } from "../imports/RP2040"

export const RP2040Circuit = () => (
  <group pcbPack pcbGap={2}>
    <RP2040
      name="U3"
      connections={{
        IOVDD1: ["C12.pin1", "net.V3_3"],
        IOVDD2: ["C14.pin1", "net.V3_3"],
        IOVDD3: ["C8.pin1", "net.V3_3"],
        IOVDD4: ["C13.pin1", "net.V3_3"],
        IOVDD5: ["C15.pin1", "net.V3_3"],
        IOVDD6: ["C19.pin1", "net.V3_3"],

        DVDD1: ["C18.1", "net.V1_1"],
        DVDD2: ["C7.1", "net.V1_1"],

        USB_VDD: "net.USB_VDD",
        USB_DM: "net.USB_N",
        USB_DP: "net.USB_P",

        GND: "net.GND",
      }}
    />
    {/* Decoupling Capacitors for IOVDD */}
    {["C12", "C14", "C8", "C13", "C15", "C19"].map((cName) => (
      <capacitor
        name={cName}
        capacitance="100nF"
        schOrientation="vertical"
        footprint="0603"
        connections={{
          pin2: "net.GND",
        }}
      />
    ))}
    <capacitor
      name="C18"
      capacitance="100nF"
      footprint="0603"
      schOrientation="vertical"
      connections={{
        pin2: "net.GND",
      }}
    />
    <capacitor
      name="C7"
      capacitance="22nF"
      footprint="0603"
      schOrientation="vertical"
      connections={{
        pin2: "net.GND",
      }}
    />
    <capacitor
      name="C9"
      capacitance="2.2uF"
      footprint="0603"
      schOrientation="vertical"
      connections={{ pin1: "net.V1_1", pin2: "net.GND" }}
    />
    <capacitor
      name="C10"
      capacitance="2.2uF"
      footprint="0603"
      schOrientation="vertical"
      connections={{ pin1: "U3.VREG_VIN", pin2: "net.GND" }}
    />
    <capacitor
      name="C11"
      capacitance="2.2uF"
      footprint="0603"
      schOrientation="vertical"
      connections={{ pin1: "U3.ADC_AVDD", pin2: "net.GND" }}
    />
  </group>
)
