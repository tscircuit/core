import TrackerBoard from "./components/tracker-board"

export default function CompactBeacon() {
  return (
    <TrackerBoard
      name="compact-beacon"
      width={28}
      height={28}
      mcuX={0}
      mcuY={1}
    >
      <pinheader
        name="J1"
        pinCount={2}
        pitch="2.54mm"
        pcbX={-9}
        pcbY={-7}
        connections={{ pin1: "net.VCC", pin2: "net.GND" }}
      />
      <pinheader
        name="J2"
        pinCount={4}
        pitch="2.54mm"
        pcbX={7}
        pcbY={-9}
        connections={{
          pin1: "net.VCC",
          pin2: "net.GND",
          pin3: ".U1 > .SWDIO",
          pin4: ".U1 > .SWDCLK",
        }}
      />
      <resistor
        name="R1"
        resistance="1k"
        footprint="0603"
        pcbX={-8}
        pcbY={1}
        connections={{ pin1: ".U1 > .P0_06", pin2: ".LED1 > .anode" }}
      />
      <led
        name="LED1"
        color="green"
        footprint="0603"
        pcbX={-10}
        pcbY={5}
        connections={{ cathode: "net.GND" }}
      />
      <resistor
        name="R2"
        resistance="10k"
        footprint="0603"
        pcbX={8}
        pcbY={2}
        connections={{ pin1: "net.VCC", pin2: ".U1 > .nRESET" }}
      />
      <testpoint
        name="TP1"
        pcbX={10}
        pcbY={6}
        connections={{ pin1: ".U1 > .nRESET" }}
      />
    </TrackerBoard>
  )
}
