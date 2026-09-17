import { Fragment } from "react"
import TrackerBoard from "./components/tracker-board"

export default function AnalogInput() {
  return (
    <TrackerBoard
      name="analog-input"
      width={44}
      height={34}
      mcuX={9}
      mcuY={2}
      rotation={270}
    >
      <pinheader
        name="J1"
        pinCount={2}
        pitch="2.54mm"
        pcbX={15}
        pcbY={-12}
        connections={{ pin1: "net.VCC", pin2: "net.GND" }}
      />
      {["AIN0", "AIN1", "AIN2", "AIN3"].map((pin, i) => (
        <Fragment key={pin}>
          <pinheader
            name={`J${i + 2}`}
            pinCount={2}
            pitch="2.54mm"
            pcbX={-18}
            pcbY={11 - i * 7}
            connections={{ pin1: `.R${i + 1} > .pin1`, pin2: "net.GND" }}
          />
          <resistor
            name={`R${i + 1}`}
            resistance="10k"
            footprint="0603"
            pcbX={-11}
            pcbY={11 - i * 7}
            connections={{ pin2: `.U1 > .${pin}` }}
          />
          <capacitor
            name={`C${i + 7}`}
            capacitance="10nF"
            footprint="0603"
            pcbX={-5}
            pcbY={11 - i * 7}
            layer="bottom"
            connections={{ pin1: `.U1 > .${pin}`, pin2: "net.GND" }}
          />
        </Fragment>
      ))}
      <capacitor
        name="C11"
        capacitance="10uF"
        footprint="0805"
        pcbX={3}
        pcbY={-12}
        layer="bottom"
        connections={{ pin1: "net.VCC", pin2: "net.GND" }}
      />
    </TrackerBoard>
  )
}
