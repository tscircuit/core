import { PT4115 } from "./pt4115"

export default () => (
  <board
    width="56mm"
    height="32mm"
    layers={2}
    routingDisabled
    schematicDisabled
    minTraceWidth="0.15mm"
  >
    <net name="VIN_24V" isPowerNet nominalTraceWidth="0.85mm" />
    <net name="LED_700MA" isPowerNet nominalTraceWidth="0.8mm" />
    <net name="SW_NODE" isPowerNet nominalTraceWidth="0.85mm" />
    <net name="GND" isGroundNet nominalTraceWidth="0.85mm" />

    <pinheader
      name="J1"
      pinCount={2}
      pitch="5.08mm"
      footprint="pinrow2_p5.08mm_id1.3mm_od2.5mm"
      pcbX={-23}
      pcbY={0}
    />
    <pinheader
      name="J2"
      pinCount={2}
      pitch="5.08mm"
      footprint="pinrow2_p5.08mm_id1.3mm_od2.5mm"
      pcbX={23}
      pcbY={0}
    />
    <pinheader
      name="J3"
      pinCount={2}
      pitch="2.54mm"
      footprint="pinrow2"
      pcbX={-18}
      pcbY={-11}
    />
    <PT4115 name="U1" pcbX={-5} pcbY={0} pcbRotation={90} />
    <resistor
      name="R1"
      resistance="0.143ohm"
      footprint="1206"
      pcbX={11}
      pcbY={7}
    />
    <inductor
      name="L1"
      inductance="68uH"
      footprint="1210"
      pcbX={11}
      pcbY={-7}
    />
    <diode name="D1" footprint="sod123" pcbX={0} pcbY={8} pcbRotation={90} />
    <capacitor
      name="C1"
      capacitance="100uF"
      footprint="1206"
      pcbX={-14}
      pcbY={7}
    />
    <capacitor
      name="C2"
      capacitance="100nF"
      footprint="0603"
      pcbX={-12}
      pcbY={-7}
    />
    <resistor name="R2" resistance="10k" footprint="0603" pcbX={2} pcbY={-11} />

    <trace from=".J1 > .pin1" to="net.VIN_24V" thickness="0.85mm" />
    <trace from=".U1 > .VIN" to="net.VIN_24V" thickness="0.85mm" />
    <trace from=".C1 > .pin1" to="net.VIN_24V" thickness="0.85mm" />
    <trace from=".C2 > .pin1" to="net.VIN_24V" thickness="0.85mm" />
    <trace from=".R1 > .pin1" to="net.VIN_24V" thickness="0.85mm" />
    <trace from=".D1 > .pin2" to="net.VIN_24V" thickness="0.85mm" />

    <trace from=".R1 > .pin2" to="net.LED_700MA" thickness="0.8mm" />
    <trace from=".U1 > .CSN" to="net.LED_700MA" thickness="0.8mm" />
    <trace from=".J2 > .pin1" to="net.LED_700MA" thickness="0.8mm" />
    <trace from=".J2 > .pin2" to=".L1 > .pin1" thickness="0.8mm" />

    <trace from=".L1 > .pin2" to="net.SW_NODE" thickness="0.85mm" />
    <trace from=".U1 > .SW" to="net.SW_NODE" thickness="0.85mm" />
    <trace from=".D1 > .pin1" to="net.SW_NODE" thickness="0.85mm" />

    <trace from=".J3 > .pin1" to=".U1 > .DIM" thickness="0.15mm" />
    <trace from=".R2 > .pin1" to=".U1 > .DIM" thickness="0.15mm" />
    <trace from=".R2 > .pin2" to="net.VIN_24V" thickness="0.25mm" />
    {[
      ".J1 > .pin2",
      ".J3 > .pin2",
      ".U1 > .GND",
      ".C1 > .pin2",
      ".C2 > .pin2",
    ].map((from) => (
      <trace key={from} from={from} to="net.GND" thickness="0.85mm" />
    ))}
  </board>
)
