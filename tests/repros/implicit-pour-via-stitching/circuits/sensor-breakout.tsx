import TrackerBoard from "./components/tracker-board"

export default function SensorBreakout() {
  return (
    <TrackerBoard
      name="sensor-breakout"
      width={30}
      height={46}
      mcuX={0}
      mcuY={-9}
      rotation={180}
    >
      <pinheader
        name="J1"
        pinCount={2}
        pitch="2.54mm"
        pcbX={-10}
        pcbY={-18}
        connections={{ pin1: "net.VCC", pin2: "net.GND" }}
      />
      <pinheader
        name="J2"
        pinCount={4}
        pitch="2.54mm"
        pcbX={-7}
        pcbY={18}
        connections={{
          pin1: "net.VCC",
          pin2: "net.GND",
          pin3: "net.SDA",
          pin4: "net.SCL",
        }}
      />
      <pinheader
        name="J3"
        pinCount={4}
        pitch="2.54mm"
        pcbX={7}
        pcbY={18}
        connections={{
          pin1: "net.VCC",
          pin2: "net.GND",
          pin3: "net.SDA",
          pin4: "net.SCL",
        }}
      />
      <trace from=".U1 > .P0_06" to="net.SDA" />
      <trace from=".U1 > .P0_07" to="net.SCL" />
      <resistor
        name="R1"
        resistance="4.7k"
        footprint="0603"
        pcbX={-5}
        pcbY={5}
        connections={{ pin1: "net.VCC", pin2: "net.SDA" }}
      />
      <resistor
        name="R2"
        resistance="4.7k"
        footprint="0603"
        pcbX={5}
        pcbY={9}
        connections={{ pin1: "net.VCC", pin2: "net.SCL" }}
      />
      <capacitor
        name="C7"
        capacitance="1uF"
        footprint="0603"
        pcbX={-7}
        pcbY={12}
        connections={{ pin1: "net.VCC", pin2: "net.GND" }}
      />
      <capacitor
        name="C8"
        capacitance="1uF"
        footprint="0603"
        pcbX={7}
        pcbY={12}
        connections={{ pin1: "net.VCC", pin2: "net.GND" }}
      />
    </TrackerBoard>
  )
}
