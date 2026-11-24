import { resistorModel, capacitorModel } from "./jlc-passives"
import { modelFor } from "./jlc-adapters"
import React from "react"
import placement from "./placement.json"
import schPlacement from "./schematic-placement.json"
export const schOverride = (name: string) =>
  (schPlacement as Record<string, any>)[name] ?? {}
export const pcbPlacement = (name: string) =>
  (placement as Record<string, Partial<Pos>>)[name] ?? {}
import mappings from "../library/symbol-mappings.json"
export type Pos = {
  pcbX: number
  pcbY: number
  schX: number
  schY: number
  pcbRotation?: number
  layer?: "top" | "bottom"
}
export const pins = Object.fromEntries(
  Object.entries(mappings).map(([k, v]) => [k, v.pins]),
) as Record<string, Record<string, string>>
export const net = (n: string) => `net.${n}`
const DDR_BYTE_LANE_NET = /^DDR_(DQ\d+|DQM\d|DQS\d[PN])$/
export function Wire({
  from,
  to,
  width = 0.2,
}: {
  from: string
  to: string
  width?: number
}) {
  return (
    <trace from={from} to={net(to)} thickness={width} schDisplayLabel={to} />
  )
}
// Pin number is the electrical identity. Labels are never used to guess pad mapping.
export function IC({
  name,
  mpn,
  pinNames,
  connections,
  noConnect = [],
  left,
  right,
  width = 7,
  height,
  ...pos
}: Pos & {
  name: string
  mpn: string
  pinNames: Record<string, string>
  connections: Record<string, string>
  noConnect?: string[]
  left?: string[]
  right?: string[]
  width?: number
  height?: number
}) {
  const imported = modelFor(mpn)
  // ST DS4260 Rev 7, p.1 functional diagram: I/O1 pins 1/6 and I/O2
  // pins 3/4 are internally joined. https://www.st.com/resource/en/datasheet/usblc6-2.pdf
  const internallyConnectedPins =
    mpn === "USBLC6-2SC6"
      ? [
          ["pin1", "pin6"],
          ["pin3", "pin4"],
        ]
      : undefined
  // Attach each protected data net once; the companion lead is joined inside
  // the silicon. Two separate PCB branches would create an unwanted USB loop.
  const externalConnections =
    mpn === "USBLC6-2SC6"
      ? Object.fromEntries(
          Object.entries(connections).filter(([p]) => p !== "4" && p !== "6"),
        )
      : connections
  const labels = Object.fromEntries(
    Object.entries(pinNames).map(([p, s]) => [`pin${p}`, [s || `P${p}`]]),
  )
  const used = Object.keys(pinNames)
  const lp = left ?? used.slice(0, Math.ceil(used.length / 2))
  const rp = right ?? used.filter((p) => !lp.includes(p))
  return (
    <>
      <chip
        name={name}
        manufacturerPartNumber={mpn}
        {...pos}
        {...pcbPlacement(name)}
        schX={pos.schX * 0.38}
        schY={pos.schY * 0.45}
        {...schOverride(name)}
        schPinArrangement={{
          leftSide: {
            pins: lp.map((p) => `pin${p}`),
            direction: "top-to-bottom",
          },
          rightSide: {
            pins: rp.map((p) => `pin${p}`),
            direction: "top-to-bottom",
          },
        }}
        {...imported}
        symbol={undefined}
        cadModel={imported?.cadModel}
        pinLabels={labels}
        internallyConnectedPins={internallyConnectedPins}
        pinAttributes={Object.fromEntries(
          Object.entries(externalConnections).map(([p, n]) => [
            `pin${p}`,
            {
              mustBeConnected: true,
              ...(n === "GND" ? { requiresGround: true } : {}),
              ...(/^(VIN|VDD|VCC|VREF|IN[12]?$|AUX$)/.test(pinNames[p] ?? "")
                ? { requiresPower: true }
                : {}),
            },
          ]),
        )}
        noConnect={noConnect.map((p) => `pin${p}`)}
      />
      {Object.entries(externalConnections).map(([p, n]) => (
        <Wire
          key={p}
          from={`${name}.pin${p}`}
          to={n}
          // DDR byte-lane nets must match the 0.15 mm bus width; a wider pin
          // trace widens the whole net and disables native bus-lane routing.
          width={DDR_BYTE_LANE_NET.test(n) ? 0.15 : undefined}
        />
      ))}{" "}
    </>
  )
}
export function R({
  name,
  value,
  a,
  b,
  footprint = "0603",
  ...p
}: Pos & {
  name: string
  value: string
  a: string
  b: string
  footprint?: string
}) {
  return (
    <>
      <resistor
        {...resistorModel(value, footprint)}
        name={name}
        resistance={value}
        schRotation={
          a === "GND"
            ? 90
            : b === "GND" ||
                /^(VIN20|SYS3V3|MPU5V|USB5V|.*_REG|.*_VBUS)$/.test(a)
              ? -90
              : 0
        }
        {...p}
        {...pcbPlacement(name)}
        schX={p.schX * 0.38}
        schY={p.schY * 0.45}
        {...schOverride(name)}
      />
      <Wire from={`${name}.pin1`} to={a} />
      <Wire from={`${name}.pin2`} to={b} />
    </>
  )
}
export function C({
  name,
  value,
  a,
  b = "GND",
  footprint = "0603",
  ...p
}: Pos & {
  name: string
  value: string
  a: string
  b?: string
  footprint?: string
}) {
  return (
    <>
      <capacitor
        {...capacitorModel(value, a)}
        name={name}
        capacitance={value}
        schOrientation="vertical"
        {...p}
        {...pcbPlacement(name)}
        schX={p.schX * 0.38}
        schY={p.schY * 0.45}
        {...schOverride(name)}
      />
      <Wire from={`${name}.pin1`} to={a} />
      <Wire from={`${name}.pin2`} to={b} />
    </>
  )
}
export function Diode({
  name,
  mpn = "BAT46W-7-F",
  a,
  k,
  footprint = "sod123",
  ...p
}: Pos & {
  name: string
  mpn?: string
  a: string
  k: string
  footprint?: string
}) {
  return (
    <>
      <diode
        pinLabels={{ pin1: ["cathode", "K"], pin2: ["anode", "A"] }}
        name={name}
        manufacturerPartNumber={mpn}
        footprint={footprint}
        {...modelFor(mpn)}
        {...p}
        {...pcbPlacement(name)}
        schX={p.schX * 0.38}
        schY={p.schY * 0.45}
        {...schOverride(name)}
      />
      <Wire from={`${name}.anode`} to={a} />
      <Wire from={`${name}.cathode`} to={k} />
    </>
  )
}
export function NMOS({
  name,
  g,
  d,
  s,
  ...p
}: Pos & { name: string; g: string; d: string; s: string }) {
  return (
    <IC
      name={name}
      mpn="SIR870DP-T1-GE3"
      pinNames={{
        1: "S1",
        2: "S2",
        3: "S3",
        4: "G",
        5: "D1",
        6: "D2",
        7: "D3",
        8: "D4",
        9: "DRAIN_EP",
      }}
      connections={{ 1: s, 2: s, 3: s, 4: g, 5: d, 6: d, 7: d, 8: d, 9: d }}
      {...p}
      width={3.7}
    />
  )
}
export function SmallNMOS({
  name,
  g,
  d,
  s,
  ...p
}: Pos & { name: string; g: string; d: string; s: string }) {
  return (
    <IC
      name={name}
      mpn="2N7002,215"
      pinNames={{ 1: "G", 2: "S", 3: "D" }}
      connections={{ 1: g, 2: s, 3: d }}
      {...p}
      width={3}
    />
  )
}
export function Title({
  text,
  x = 0,
  y = 14,
}: {
  text: string
  x?: number
  y?: number
}) {
  return (
    <schematictext
      text={text}
      schX={x * 0.38}
      schY={y * 0.45}
      fontSize={0.42}
    />
  )
}
export function UsbC({
  name,
  label,
  vbus,
  cc1,
  cc2,
  dp,
  dm,
  ...p
}: Pos & {
  name: string
  label: string
  vbus: string
  cc1: string
  cc2: string
  dp?: string
  dm?: string
}) {
  p = { ...p, ...pcbPlacement(name) }
  const physical = {
    1: "S1",
    2: "S2",
    3: "S3",
    4: "S4",
    5: "A12",
    6: "B1",
    7: "A9",
    8: "B4",
    9: "B5",
    10: "A8",
    11: "B6",
    12: "A7",
    13: "A6",
    14: "B7",
    15: "A5",
    16: "B8",
    17: "B9",
    18: "A4",
    19: "B12",
    20: "A1",
  }
  const con: Record<string, string> = {
    A1: "GND",
    A4: vbus,
    A5: cc1,
    A9: vbus,
    A12: "GND",
    B1: "GND",
    B4: vbus,
    B5: cc2,
    B9: vbus,
    B12: "GND",
    S1: "GND",
    S2: "GND",
    S3: "GND",
    S4: "GND",
  }
  if (dp && dm) Object.assign(con, { A6: dp, B6: dp, A7: dm, B7: dm })
  const imported = modelFor("USB4105-GF-A")
  return (
    <>
      <connector
        {...imported}
        symbol={undefined}
        name={name}
        pinLabels={Object.fromEntries(
          Object.entries(physical).map(([n, a]) => [`pin${n}`, [a]]),
        )}
        insertionDirection="from_bottom"
        {...p}
        schX={p.schX * 0.38}
        schY={p.schY * 0.45}
        {...schOverride(name)}
        noConnect={Object.entries(physical)
          .filter(([n, a]) => !con[a])
          .map(([n]) => `pin${n}`)}
      />
      {Object.entries(con).map(([n, v]) => (
        <Wire key={n} from={`${name}.${n}`} to={v} />
      ))}
      <silkscreentext
        text={`${name} ${label}`}
        pcbX={p.pcbX}
        pcbY={p.pcbY + (p.pcbY < 0 ? 7 : -7)}
        fontSize={1}
      />
    </>
  )
}
export function ESD({
  name,
  cc1,
  cc2,
  lowVoltage = false,
  ...p
}: Pos & { name: string; cc1: string; cc2: string; lowVoltage?: boolean }) {
  return (
    <IC
      name={name}
      mpn={lowVoltage ? "ESDA6V1L" : "ESDA25L"}
      pinNames={{ 1: "IO1", 2: "IO2", 3: "GND" }}
      connections={{ 1: cc1, 2: cc2, 3: "GND" }}
      width={3}
      {...p}
    />
  )
}
export const efusePins = {
  1: "EN_UVLO",
  2: "OVLO",
  3: "AUXOFF",
  4: "FAULT_N",
  5: "IN",
  6: "OUT",
  7: "DVDT",
  8: "GND",
  9: "ILM",
  10: "ITIMER",
}

export function Note({
  schX,
  schY,
  text,
}: {
  schX: number
  schY: number
  text: string
  fontSize?: number
}) {
  return (
    <schematictext
      text={text}
      schX={schX * 0.38}
      schY={schY * 0.45}
      fontSize={0.3}
    />
  )
}
