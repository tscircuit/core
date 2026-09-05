import { UsbFootprint } from "./usb-footprint"

export default function UsbBreakoutBoard() {
  return (
    <board width={24} height={24} autorouter="auto-local">
      <connector
        name="J1"
        standard="usb_c"
        manufacturerPartNumber="TYPE-C-31-M-12"
        footprint={<UsbFootprint />}
        pcbY={8}
        pcbRotation={180}
        pinLabels={{
          pin1: "GND1",
          pin2: "VBUS1",
          pin3: "CC1",
          pin4: "DP1",
          pin5: "DM1",
          pin6: "SBU1",
          pin7: "SBU2",
          pin8: "DM2",
          pin9: "DP2",
          pin10: "CC2",
          pin11: "VBUS2",
          pin12: "GND2",
          pin13: "SHELL1",
          pin14: "SHELL2",
          pin15: "SHELL3",
          pin16: "SHELL4",
        }}
      />
      <pinheader
        name="J2"
        pinCount={4}
        footprint="pinrow4"
        pcbY={-8}
        pinLabels={["VBUS", "DM", "DP", "GND"]}
      />
      <resistor
        name="R1"
        resistance="5.1k"
        footprint="0603"
        pcbX={5}
        pcbY={2}
      />
      <resistor
        name="R2"
        resistance="5.1k"
        footprint="0603"
        pcbX={-5}
        pcbY={2}
      />
      <resistor
        name="R3"
        resistance="22"
        footprint="0603"
        pcbX={1.27}
        pcbY={-1}
        pcbRotation={90}
      />
      <resistor
        name="R4"
        resistance="22"
        footprint="0603"
        pcbX={-1.27}
        pcbY={-1}
        pcbRotation={90}
      />
      <capacitor
        name="C1"
        capacitance="1uF"
        footprint="0603"
        pcbX={-7}
        pcbY={-5}
      />
      {Object.entries({
        GND1: "GND",
        GND2: "GND",
        SHELL1: "GND",
        SHELL2: "GND",
        SHELL3: "GND",
        SHELL4: "GND",
        VBUS1: "VBUS",
        VBUS2: "VBUS",
        DP1: "DP_USB",
        DP2: "DP_USB",
        DM1: "DM_USB",
        DM2: "DM_USB",
        CC1: "CC1",
        CC2: "CC2",
      }).map(([pin, net]) => (
        <trace from={`.J1 > .${pin}`} to={`net.${net}`} />
      ))}
      <trace from=".R1 > .pin1" to="net.CC1" />
      <trace from=".R1 > .pin2" to="net.GND" />
      <trace from=".R2 > .pin1" to="net.CC2" />
      <trace from=".R2 > .pin2" to="net.GND" />
      <trace from=".R3 > .pin2" to="net.DP_USB" />
      <trace from=".R3 > .pin1" to="net.DP" />
      <trace from=".R4 > .pin2" to="net.DM_USB" />
      <trace from=".R4 > .pin1" to="net.DM" />
      <trace from=".J2 > .pin1" to="net.VBUS" />
      <trace from=".J2 > .pin2" to="net.DM" />
      <trace from=".J2 > .pin3" to="net.DP" />
      <trace from=".J2 > .pin4" to="net.GND" />
      <trace from=".C1 > .pin1" to="net.VBUS" />
      <trace from=".C1 > .pin2" to="net.GND" />
      <autoroutingphase
        phaseIndex={0}
        connections={["net.DP", "net.DM"]}
        autorouter="auto-local"
      />
      <autoroutingphase phaseIndex={1} autorouter="auto-local" />
      <differentialpair
        name="USB"
        positiveConnection=".R3 > .pin1"
        negativeConnection=".R4 > .pin1"
        maxLengthSkew={0.1}
      />
      <pcbnotetext text="USB-C DEVICE BREAKOUT" pcbY={-11} fontSize={0.7} />
      <pcbnotetext
        text="CC pull-downs: 5.1k"
        pcbX={0}
        pcbY={3}
        fontSize={0.6}
      />
    </board>
  )
}
