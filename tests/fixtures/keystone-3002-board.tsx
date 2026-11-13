import { readFileSync } from "node:fs"
import type { ChipProps } from "@tscircuit/props"
import { KicadFootprintToCircuitJsonConverter } from "kicad-to-circuit-json"
import { Fragment } from "react"

export const keystone3002FootprintName =
  "Battery/BatteryHolder_Keystone_3002_1x2032"

export function getKeystone3002Footprint() {
  const converter = new KicadFootprintToCircuitJsonConverter()
  // Keep the complete upstream footprint, including its outline and repeated
  // pad numbers: https://gitlab.com/kicad/libraries/kicad-footprints/-/blob/master/Battery.pretty/BatteryHolder_Keystone_3002_1x2032.kicad_mod
  converter.addFile(
    "BatteryHolder_Keystone_3002_1x2032.kicad_mod",
    readFileSync(
      new URL(
        "./assets/kicad/BatteryHolder_Keystone_3002_1x2032.kicad_mod",
        import.meta.url,
      ),
      "utf8",
    ),
  )
  converter.runUntilFinished()
  return converter.getOutput()
}

export const keystone3002Connections = [
  [".BT1 > .POS", ".R1 > .pin1"],
  [".BT1 > .pin1_internal_1", ".R2 > .pin1"],
  [".BT1 > .pin1", ".J1 > .pin1"],
  [".BT1 > .NEG", ".R1 > .pin2"],
  [".BT1 > .pin2", ".R2 > .pin2"],
  [".BT1 > .NEG", ".J1 > .pin2"],
  [".J1 > .pin1", ".C1 > .pin1"],
  [".J1 > .pin2", ".C1 > .pin2"],
] as const

export const Keystone3002Board = ({
  footprint = `kicad:${keystone3002FootprintName}`,
}: { footprint?: ChipProps["footprint"] }) => (
  <board width="40mm" height="40mm">
    <chip
      name="BT1"
      footprint={footprint}
      pinLabels={{ pin1: ["POS"], pin2: ["NEG"] }}
    />
    <resistor
      name="R1"
      resistance="10k"
      footprint="0603"
      pcbX={12}
      pcbY={-12}
    />
    <resistor
      name="R2"
      resistance="10k"
      footprint="0603"
      pcbX={-12}
      pcbY={-12}
    />
    <capacitor
      name="C1"
      capacitance="100nF"
      footprint="0603"
      pcbX={-7}
      pcbY={14}
      pcbRotation={90}
    />
    <pinheader name="J1" pinCount={2} pcbX={7} pcbY={14} pcbRotation={90} />
    {/* The output bypass is already routed; the battery feed and loads must
        be completed by the autorouter once every holder contact has a port. */}
    {keystone3002Connections.map(([from, to], connectionIndex) => (
      <Fragment key={`${from}:${to}`}>
        <trace
          name={`CONNECTION_${connectionIndex + 1}`}
          from={from}
          to={to}
          pcbStraightLine={connectionIndex >= 6}
        />
      </Fragment>
    ))}
    <silkscreentext text="KEYSTONE 3002 / CR2032" pcbY={18} fontSize={1} />
    <silkscreentext text="3V OUT" pcbX={7} pcbY={11.5} fontSize={0.8} />
    <silkscreentext text="+" pcbX={12.8} pcbY={4.3} fontSize={1.3} />
    <silkscreentext text="+" pcbX={-12.8} pcbY={4.3} fontSize={1.3} />
    <silkscreentext
      text="TWO CONTACTS / ONE POSITIVE TERMINAL"
      pcbY={-17.5}
      fontSize={0.75}
    />
  </board>
)
