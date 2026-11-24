import React from "react"
import { IC, R, C, Title, Note, UsbC, ESD, pins } from "./parts"
export function DataPort({
  channel,
  x,
  y,
  camera = false,
}: {
  channel: number
  x: number
  y: number
  camera?: boolean
}) {
  const b = 500 + channel * 10
  const prefix = camera ? "CAM" : `M${channel}`
  const n = (s: string) => `USB${channel}_${s}`
  const p = (dx: number, dy: number, sx: number, sy: number) => ({
    pcbX: x + dx,
    pcbY: y + dy,
    schX: sx,
    schY: sy,
  })
  const dir = y < 0 ? 1 : -1
  return (
    <schematicsheet
      name={`data${channel}`}
      displayName={`${camera ? "USB CAMERA" : `M${channel} DATA`} / Type-C host`}
    >
      <Title
        text={`${camera ? "USB CAMERA" : `M${channel} DATA`} — USB2.0 DFP / 5 V ONLY / ATTACH-CONTROLLED VBUS`}
        x={0}
        y={14}
      />
      <UsbC
        name={camera ? "J3" : `J${channel + 7}`}
        label={camera ? "USB CAMERA" : `M${channel} DATA`}
        vbus={n("VBUS")}
        cc1={n("CC1")}
        cc2={n("CC2")}
        dp={`${prefix}_USB_DP`}
        dm={`${prefix}_USB_DM`}
        {...p(0, 0, 18, 2)}
        pcbRotation={y < 0 ? 0 : 180}
      />
      <IC
        name={`U${b}`}
        mpn="TPS25810RVCR"
        pinNames={pins.TPS25810RVC}
        connections={{
          1: n("OC_N"),
          2: "USB5V",
          3: "USB5V",
          4: "USB5V",
          5: "SYS3V3",
          6: n("EN"),
          7: "GND",
          8: "GND",
          9: n("REF_RTN"),
          10: n("REF"),
          11: n("CC1"),
          12: "GND",
          13: n("CC2"),
          14: n("VBUS"),
          15: n("VBUS"),
          21: "GND",
        }}
        noConnect={["16", "17", "18", "19", "20"]}
        {...p(0, 13 * dir, 0, 3)}
        width={6}
      />
      <ESD
        lowVoltage
        name={`D${b}`}
        cc1={n("CC1")}
        cc2={n("CC2")}
        {...p(-4, 8 * dir, 7, -8)}
      />
      <IC
        name={`D${b + 1}`}
        mpn="USBLC6-2SC6"
        pinNames={{
          1: "DM_IN",
          2: "GND",
          3: "DP_IN",
          4: "DP_OUT",
          5: "VBUS",
          6: "DM_OUT",
        }}
        connections={{
          1: `${prefix}_USB_DM`,
          2: "GND",
          3: `${prefix}_USB_DP`,
          4: `${prefix}_USB_DP`,
          5: n("VBUS"),
          6: `${prefix}_USB_DM`,
        }}
        {...p(3, 7 * dir, 20, -9)}
        width={4}
      />
      <R
        name={`R${b}`}
        value="100k"
        a={n("REF")}
        b={n("REF_RTN")}
        {...p(-4, 13 * dir, -14, 9)}
      />
      <R
        name={`R${b + 1}`}
        value="10k"
        a="SYS3V3"
        b={n("OC_N")}
        {...p(-4, 16 * dir, -14, 5)}
      />
      <C name={`C${b}`} value="100nF" a="USB5V" {...p(4, 12 * dir, -14, 1)} />
      <C
        name={`C${b + 1}`}
        value="1uF"
        a="USB5V"
        {...p(4, 15 * dir, -14, -3)}
      />
      <C
        name={`C${b + 2}`}
        value="100uF"
        a={n("VBUS")}
        footprint="1210"
        {...p(0, 21 * dir, -14, -7)}
      />
      <C
        name={`C${b + 3}`}
        value="100nF"
        a="SYS3V3"
        {...p(4, 17 * dir, -14, -11)}
      />
      <Note
        text="TPS25810: 100k connects REF to REF_RTN; REF_RTN stays isolated from GND (TI layout guidelines)."
        schX={0}
        schY={-20}
        fontSize={0.6}
      />
      <Note
        text="USBLC6-2: pins 1/6 and 3/4 are joined internally (ST DS4260). Companion leads need no separate PCB branch."
        schX={0}
        schY={-18}
      />
      <Note
        text="Default USB current advertisement. Budget 500 mA after enumeration; motor module must not backfeed its separate DATA VBUS. No PD motor voltage reaches this connector."
        schX={0}
        schY={-16}
        fontSize={0.6}
      />
    </schematicsheet>
  )
}
export function MotorDataPorts() {
  return (
    <>
      {[28, 44, 60, 76].map((x, i) => (
        <DataPort key={i} channel={i + 1} x={x} y={-45} />
      ))}
      <DataPort channel={5} x={-26} y={45} camera />
    </>
  )
}
