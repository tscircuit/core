import { modelFor } from "./jlc-adapters"
import React from "react"
import { IC, R, C, Diode, pcbPlacement, Title, Note, Wire, pins } from "./parts"
import inductor from "../library/footprints/L_PWR.json"
function Buck({
  i,
  x,
  y,
  rail,
}: {
  i: number
  x: number
  y: number
  rail: string
}) {
  const n = (s: string) => `${rail}_${s}`,
    p = (a: number, b: number, c: number, d: number) => ({
      pcbX: x + a,
      pcbY: y + b,
      schX: c,
      schY: d,
    })
  return (
    <schematicsheet
      name={`rail_${rail}`}
      displayName={`02 / ${rail} regulator`}
    >
      <Title
        text={`${rail} — INDEPENDENT 5.1 V / 5 A BUCK RAIL`}
        x={0}
        y={13}
      />
      <IC
        name={`U${i}`}
        mpn="TPS54560BDDAR"
        pinNames={pins.TPS54560BDDA}
        connections={{
          1: n("BOOT"),
          2: "VIN20",
          3: n("EN"),
          4: n("RT"),
          5: n("FB"),
          6: n("COMP"),
          7: "GND",
          8: n("SW"),
          9: "GND",
        }}
        {...p(0, 0, 0, 3)}
        width={5}
      />
      <C
        name={`C${i}01`}
        value="100nF"
        a={n("BOOT")}
        b={n("SW")}
        {...p(0, 5, 9, 8)}
      />
      <inductor
        name={`L${i}`}
        inductance="10uH"
        {...modelFor("SRP1038A-100M")}
        {...p(10, 0, 11, 2)}
        {...pcbPlacement(`L${i}`)}
        schX={11 * 0.38}
        schY={2 * 0.45}
      />
      <Wire from={`L${i}.pin1`} to={n("SW")} width={2} />
      <Wire from={`L${i}.pin2`} to={rail} width={2} />
      <Diode
        name={`D${i}`}
        mpn="B560C-13-F"
        a="GND"
        k={n("SW")}
        footprint="smc"
        {...p(4, -7, 8, -4)}
      />
      <R
        name={`R${i}01`}
        value="53.6k"
        a={rail}
        b={n("FB")}
        {...p(4, 7, 20, 7)}
      />
      <R name={`R${i}02`} value="10k" a={n("FB")} b="GND" {...p(8, 7, 20, 3)} />
      <R
        name={`R${i}03`}
        value="200k"
        a={n("RT")}
        b="GND"
        {...p(-4, 5, -12, 6)}
      />
      <C
        name={`C${i}02`}
        value="3.3nF"
        a={n("COMP")}
        b={n("RC")}
        {...p(-4, -5, -12, 2)}
      />
      <R
        name={`R${i}04`}
        value="29.4k"
        a={n("RC")}
        b="GND"
        {...p(-4, -7, -12, -2)}
      />
      <C name={`C${i}03`} value="33pF" a={n("COMP")} {...p(-4, -9, -12, -6)} />
      <R
        name={`R${i}05`}
        value="100k"
        a="VIN20"
        b={n("EN")}
        {...p(-4, 2, 0, -7)}
      />
      <R
        name={`R${i}06`}
        value="10k"
        a={n("EN")}
        b="GND"
        {...p(-4, 0, 9, -9)}
      />
      <C
        name={`C${i}04`}
        value="10uF"
        a="VIN20"
        footprint="1206"
        {...p(-6, 9, -12, 10)}
      />
      <C name={`C${i}05`} value="100nF" a="VIN20" {...p(-7, 5, 0, 10)} />
      {[0, 1].map((k) => (
        <C
          key={k}
          name={`C${i}0${k + 6}`}
          value="47uF"
          a={rail}
          footprint="1210"
          {...p(10 + k * 5, -8, 20, -3 - 4 * k)}
        />
      ))}
      <Note
        text="5.088 V nominal. Loop components are reference starting values; verify stability with selected inductors/capacitors and actual load before release."
        schX={4}
        schY={-14}
        fontSize={0.6}
      />
    </schematicsheet>
  )
}
export function SystemRails() {
  return (
    <>
      <Buck i={10} x={-45} y={32} rail="MPU5V" />
      <Buck i={11} x={-45} y={7} rail="USB5V" />
      <schematicsheet name="logic_rail" displayName="03 / 3.3 V control rail">
        <Title text="03 — 3.3 V ALWAYS-ON CONTROL (AFTER 20 V CONTRACT)" />
        <IC
          name="U12"
          mpn="AP2112K-3.3TRG1"
          pinNames={pins["AP2112K-3.3"]}
          connections={{ 1: "USB5V", 2: "GND", 3: "USB5V", 5: "SYS3V3" }}
          noConnect={["4"]}
          pcbX={46}
          pcbY={15}
          schX={0}
          schY={3}
          width={4}
        />
        <C
          name="C1200"
          value="4.7uF"
          a="USB5V"
          pcbX={43}
          pcbY={15}
          schX={-9}
          schY={3}
        />
        <C
          name="C1201"
          value="4.7uF"
          a="SYS3V3"
          pcbX={49}
          pcbY={15}
          schX={9}
          schY={3}
        />
        <R
          name="R1200"
          value="4.7k"
          a="SYS3V3"
          b="I2C_SCL"
          pcbX={43}
          pcbY={12}
          schX={-8}
          schY={-4}
        />
        <R
          name="R1201"
          value="4.7k"
          a="SYS3V3"
          b="I2C_SDA"
          pcbX={47}
          pcbY={12}
          schX={8}
          schY={-4}
        />
      </schematicsheet>
    </>
  )
}
