import type { ReactNode } from "react"
import { NRF52810_QFAA_R } from "../../../repro-nrf52810-without-copper-pours/imports/NRF52810_QFAA_R"

/** PCB positions are points in right-handed board space: +X right, +Y up, in mm. */
export default function TrackerBoard({
  name,
  width,
  height,
  mcuX,
  mcuY,
  rotation = 0,
  children,
}: {
  name: string
  width: number
  height: number
  mcuX: number
  mcuY: number
  rotation?: number
  children?: ReactNode
}) {
  return (
    <board
      name={name}
      width={width}
      height={height}
      layers={2}
      schematicDisabled
      automaticPoursEnabled
      enableViaStitching
      autorouterVersion="beta_pipeline9"
      autorouter={{ preset: "auto_local", traceClearance: 0.15 }}
    >
      <net name="VCC" isPowerNet />
      <net name="GND" isGroundNet />
      <NRF52810_QFAA_R
        name="U1"
        pcbX={mcuX}
        pcbY={mcuY}
        pcbRotation={rotation}
        cadModel={undefined}
      />
      {["VDD1", "VDD2", "VDD3"].map((pin) => (
        <trace key={pin} from={`.U1 > .${pin}`} to="net.VCC" />
      ))}
      {["VSS1", "VSS2", "EP"].map((pin) => (
        <trace key={pin} from={`.U1 > .${pin}`} to="net.GND" />
      ))}
      {["DEC1", "DEC2", "DEC3", "DEC4"].map((pin, i) => (
        <capacitor
          key={pin}
          name={`C${i + 1}`}
          capacitance={i === 3 ? "1uF" : "100nF"}
          footprint="0603"
          pcbX={mcuX - 6 + i * 4}
          pcbY={mcuY + 6}
          connections={{ pin1: `.U1 > .${pin}`, pin2: "net.GND" }}
        />
      ))}
      <capacitor
        name="C5"
        capacitance="4.7uF"
        footprint="0603"
        pcbX={mcuX - 6}
        pcbY={mcuY - 5}
        connections={{ pin1: "net.VCC", pin2: "net.GND" }}
      />
      <capacitor
        name="C6"
        capacitance="100nF"
        footprint="0603"
        pcbX={mcuX + 6}
        pcbY={mcuY - 5}
        connections={{ pin1: "net.VCC", pin2: "net.GND" }}
      />
      <silkscreentext
        text={`${name}: implicit pours + stitching`}
        pcbX={0}
        pcbY={height / 2 - 1}
        fontSize={0.65}
      />
      {children}
    </board>
  )
}
