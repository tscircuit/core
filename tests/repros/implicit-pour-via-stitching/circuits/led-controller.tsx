import { Fragment } from "react"
import TrackerBoard from "./components/tracker-board"

export default function LedController() {
  return (
    <TrackerBoard
      name="led-controller"
      width={48}
      height={24}
      mcuX={-12}
      mcuY={0}
      rotation={90}
    >
      <pinheader
        name="J1"
        pinCount={2}
        pitch="2.54mm"
        pcbX={-20}
        pcbY={-9}
        connections={{ pin1: "net.VCC", pin2: "net.GND" }}
      />
      {["P0_06", "P0_07", "P0_08", "P0_09", "P0_10", "P0_11"].map((pin, i) => (
        <Fragment key={pin}>
          <resistor
            name={`R${i + 1}`}
            resistance="1k"
            footprint="0603"
            pcbX={1 + i * 3.6}
            pcbY={-2}
            pcbRotation={90}
            connections={{
              pin1: `.U1 > .${pin}`,
              pin2: `.LED${i + 1} > .anode`,
            }}
          />
          <led
            name={`LED${i + 1}`}
            color={i % 2 ? "green" : "red"}
            footprint="0603"
            pcbX={1 + i * 3.6}
            pcbY={6}
            pcbRotation={90}
            connections={{ cathode: "net.GND" }}
          />
        </Fragment>
      ))}
      <capacitor
        name="C7"
        capacitance="10uF"
        footprint="0805"
        pcbX={17}
        pcbY={-7}
        connections={{ pin1: "net.VCC", pin2: "net.GND" }}
      />
    </TrackerBoard>
  )
}
