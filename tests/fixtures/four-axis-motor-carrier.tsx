import { Fragment } from "react"
const axisRows = [18, 6, -6, -18]

export function FourAxisMotorCarrier() {
  return (
    <board width={92} height={60} layers={4} minTraceWidth={0.2}>
      <pinheader
        name="CTRL"
        pinCount={12}
        footprint="pinrow12"
        pcbX={-33}
        pcbRotation={90}
      />
      <pinheader
        name="POWER"
        pinCount={2}
        footprint="pinrow2"
        pcbX={-37}
        pcbY={24}
      />
      <net name="VMOT" isPowerNet nominalTraceWidth="0.8mm" />
      <net name="GND" isGroundNet nominalTraceWidth="0.6mm" />
      <net name="SDA" />
      <net name="SCL" />
      <net name="VLOGIC" isPowerNet />
      <trace from="POWER.pin1" to="net.VMOT" />
      <trace from="POWER.pin2" to="net.GND" />
      <trace from="CTRL.pin9" to="net.SDA" />
      <trace from="CTRL.pin10" to="net.SCL" />
      <trace from="CTRL.pin11" to="net.VLOGIC" />
      <trace from="CTRL.pin12" to="net.GND" />
      {axisRows.map((y, i) => {
        const axis = i + 1
        return (
          <Fragment key={axis}>
            <pinheader
              name={`J${axis}A`}
              pinCount={8}
              footprint="pinrow8"
              pcbX={-11}
              pcbY={y + 3.81}
            />
            <pinheader
              name={`J${axis}B`}
              pinCount={8}
              footprint="pinrow8"
              pcbX={-11}
              pcbY={y - 3.81}
            />
            <pinheader
              name={`M${axis}`}
              pinCount={4}
              footprint="pinrow4"
              pcbX={22}
              pcbY={y}
            />
            <pinheader
              name={`E${axis}`}
              pinCount={4}
              footprint="pinrow4"
              pcbX={36}
              pcbY={y}
            />
            <capacitor
              name={`C${axis}`}
              capacitance="100uF"
              footprint="1206"
              pcbX={5}
              pcbY={y + 3}
            />
            <trace from={`CTRL.pin${2 * i + 1}`} to={`J${axis}A.pin7`} />
            <trace from={`CTRL.pin${2 * i + 2}`} to={`J${axis}A.pin8`} />
            <trace from={`J${axis}B.pin1`} to="net.VMOT" />
            <trace from={`J${axis}B.pin2`} to="net.GND" />
            <trace from={`J${axis}B.pin7`} to="net.VLOGIC" />
            <trace from={`J${axis}B.pin8`} to="net.GND" />
            <trace from={`J${axis}B.pin3`} to={`M${axis}.pin1`} />
            <trace from={`J${axis}B.pin4`} to={`M${axis}.pin2`} />
            <trace from={`J${axis}B.pin5`} to={`M${axis}.pin3`} />
            <trace from={`J${axis}B.pin6`} to={`M${axis}.pin4`} />
            <trace from={`E${axis}.pin1`} to="net.VLOGIC" />
            <trace from={`E${axis}.pin2`} to="net.GND" />
            <trace from={`E${axis}.pin3`} to="net.SDA" />
            <trace from={`E${axis}.pin4`} to="net.SCL" />
            <trace from={`C${axis}.pin1`} to="net.VMOT" />
            <trace from={`C${axis}.pin2`} to="net.GND" />
            <silkscreentext text={`AXIS ${axis}`} pcbX={17} pcbY={y + 3} />
          </Fragment>
        )
      })}
      <hole name="H1" diameter={3.2} pcbX={-42} pcbY={-26} />
      <hole name="H2" diameter={3.2} pcbX={42} pcbY={-26} />
      <hole name="H3" diameter={3.2} pcbX={42} pcbY={26} />
      <hole name="H4" diameter={3.2} pcbX={-42} pcbY={26} />
    </board>
  )
}
