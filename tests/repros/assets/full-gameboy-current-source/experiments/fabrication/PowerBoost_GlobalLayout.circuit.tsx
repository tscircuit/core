// Local all-global-routing experiment. Component children match @tscircuit/common 0.0.56.
// Only the routing container changes; values, placements, and trace intent are retained.
import type { SubcircuitProps } from "@tscircuit/props"
import { A_0603WAF1003T5E } from "./global-power-imports/A_0603WAF1003T5E"
import { A_0603WAF9532T5E } from "./global-power-imports/A_0603WAF9532T5E"
import { AO3401A } from "./global-power-imports/AO3401A"
import { CL10A106KP8NNNC } from "./global-power-imports/CL10A106KP8NNNC"
import { CL10A226MQ8NRNC } from "./global-power-imports/CL10A226MQ8NRNC"
import { FRC0603F1302TS } from "./global-power-imports/FRC0603F1302TS"
import { MMBT3904_RANGE_100_300_ } from "./global-power-imports/MMBT3904_RANGE_100_300_"
import { MT3608 } from "./global-power-imports/MT3608"
import { S2B_PH_K_S_LF__SN_ } from "./global-power-imports/S2B_PH_K_S_LF__SN_"
import { SMMS0630_220M } from "./global-power-imports/SMMS0630_220M"
import { SS34 } from "./global-power-imports/SS34"

const batteryTraceProps = { thickness: "0.3mm" } as const
const powerTraceProps = { thickness: "0.4mm" } as const
const gndLabel = { displayName: "GND", schDisplayLabel: "GND" } as const
const vbusLabel = { displayName: "VBUS", schDisplayLabel: "VBUS" } as const
const vsysLabel = { displayName: "VSYS", schDisplayLabel: "VSYS" } as const

const schSections = {
  batteryInput: "battery-input",
  boostConverter: "boost-converter",
  usbShutdown: "usb-shutdown",
} as const

export type PowerBoostMT3608Props = Omit<SubcircuitProps, "children"> & {
  placements?: Partial<
    Record<
      | "R_BOOST_EN_PULLUP"
      | "R_BAT_GATE_PULLUP"
      | "D_BAT_BOOST"
      | "C_BAT_OUT"
      | "C_BAT_OUT_BULK"
      | "R_BOOST_TOP"
      | "R_BOOST_BOT"
      | "R_USB_BOOST_OFF"
      | "Q_USB_BOOST_OFF"
      | "R_USB_BOOST_OFF_PULLDOWN",
      { pcbX: number; pcbY: number; pcbRotation: number }
    >
  >
}

/**
 * Battery-powered 5 V boost supply extracted from abse/gameboy.
 *
 * VBUS disables the MT3608 while USB power is present. VSYS is the boosted
 * output and GND is the common return. Use exposedNets to expose the selected
 * power domains to the parent circuit. Connect an external switch between
 * BAT_POS and BAT_SWITCHED, or connect both nets for always-on operation.
 */
export const PowerBoost_GlobalLayout = ({
  name = "PowerBoost_GlobalLayout",
  placements,
  ...props
}: PowerBoostMT3608Props) => (
  <group
    subcircuit={false}
    minViaHoleDiameter="0.3mm"
    minViaPadDiameter="0.45mm"
    {...props}
    name={name}
  >
    <net name="GND" isGroundNet />
    <net name="VBUS" isPowerNet />
    <net name="VSYS" isPowerNet />
    <net name="BAT_POS" isPowerNet />
    <net name="BAT_SWITCHED" isPowerNet />

    <schematicsection
      name={schSections.batteryInput}
      displayName="Battery Input and Cutoff"
    />
    <schematicsection
      name={schSections.boostConverter}
      displayName="MT3608 Boost Converter"
    />
    <schematicsection
      name={schSections.usbShutdown}
      displayName="USB Boost Shutdown"
    />

    <S2B_PH_K_S_LF__SN_
      name="J_BAT"
      schSectionName={schSections.batteryInput}
      pcbX={-31.5}
      pcbY={25.25}
      pcbRotation={90}
      schX={-10}
      schY={4}
    />
    <AO3401A
      name="Q_BAT_CUTOFF"
      schSectionName={schSections.batteryInput}
      pcbX={-11.5}
      pcbY={21.25}
      schX={-6}
      schY={4}
    />
    <A_0603WAF1003T5E
      name="R_BAT_GATE_PULLUP"
      schSectionName={schSections.batteryInput}
      pcbX={-11.5}
      pcbY={26.25}
      pcbRotation={90}
      schX={-10}
      schY={0.5}
      {...placements?.R_BAT_GATE_PULLUP}
    />
    <A_0603WAF1003T5E
      name="R_BAT_GATE_BASE"
      schSectionName={schSections.batteryInput}
      pcbX={-14.5}
      pcbY={26.25}
      pcbRotation={90}
      schX={-10.78}
      schY={-3}
    />
    <MMBT3904_RANGE_100_300_
      name="Q_BAT_GATE"
      schSectionName={schSections.batteryInput}
      pcbX={-17.5}
      pcbY={26.25}
      schX={-5.84}
      schY={-3}
    />

    <SMMS0630_220M
      name="L_BAT_BOOST"
      schSectionName={schSections.boostConverter}
      pcbX={-2.5}
      pcbY={21.25}
      schX={-2}
      schY={4}
    />
    <MT3608
      name="U_BAT_BOOST"
      schSectionName={schSections.boostConverter}
      pcbX={6.5}
      pcbY={21.25}
      schX={2}
      schY={4}
    />
    <SS34
      name="D_BAT_BOOST"
      schSectionName={schSections.boostConverter}
      pcbX={15.5}
      pcbY={21.25}
      pcbRotation={180}
      schX={6}
      schY={4}
      {...placements?.D_BAT_BOOST}
    />
    <CL10A106KP8NNNC
      name="C_BAT_IN"
      schSectionName={schSections.boostConverter}
      pcbX={3.5}
      pcbY={26.25}
      pcbRotation={90}
      schX={-2}
      schY={0.5}
    />
    <CL10A106KP8NNNC
      name="C_BAT_IN_BULK"
      schSectionName={schSections.boostConverter}
      pcbX={-2.5}
      pcbY={26.75}
      pcbRotation={90}
      schX={-1.38}
      schY={-3}
    />
    <CL10A226MQ8NRNC
      name="C_BAT_OUT"
      schSectionName={schSections.boostConverter}
      pcbX={20.5}
      pcbY={21.25}
      pcbRotation={90}
      schX={10}
      schY={0.5}
      {...placements?.C_BAT_OUT}
    />
    <CL10A226MQ8NRNC
      name="C_BAT_OUT_BULK"
      schSectionName={schSections.boostConverter}
      pcbX={23.5}
      pcbY={21.25}
      pcbRotation={90}
      schX={10}
      schY={-3}
      {...placements?.C_BAT_OUT_BULK}
    />
    <A_0603WAF9532T5E
      name="R_BOOST_TOP"
      schSectionName={schSections.boostConverter}
      pcbX={11.5}
      pcbY={26.25}
      pcbRotation={90}
      schX={6}
      schY={0.5}
      {...placements?.R_BOOST_TOP}
    />
    <FRC0603F1302TS
      name="R_BOOST_BOT"
      schSectionName={schSections.boostConverter}
      pcbX={8.5}
      pcbY={26.25}
      pcbRotation={90}
      schX={6}
      schY={-3}
      {...placements?.R_BOOST_BOT}
    />
    <A_0603WAF1003T5E
      name="R_BOOST_EN_PULLUP"
      schSectionName={schSections.boostConverter}
      pcbX={16.5}
      pcbY={26.25}
      pcbRotation={90}
      schX={2}
      schY={0.5}
      {...placements?.R_BOOST_EN_PULLUP}
    />

    <A_0603WAF1003T5E
      name="R_USB_BOOST_OFF"
      schSectionName={schSections.usbShutdown}
      pcbX={24.5}
      pcbY={26.25}
      pcbRotation={90}
      schX={-0.86}
      schY={-7}
      {...placements?.R_USB_BOOST_OFF}
    />
    <MMBT3904_RANGE_100_300_
      name="Q_USB_BOOST_OFF"
      schSectionName={schSections.usbShutdown}
      pcbX={28.5}
      pcbY={18.25}
      schX={4.08}
      schY={-7}
      {...placements?.Q_USB_BOOST_OFF}
    />
    <A_0603WAF1003T5E
      name="R_USB_BOOST_OFF_PULLDOWN"
      schSectionName={schSections.usbShutdown}
      pcbX={31.5}
      pcbY={18.25}
      pcbRotation={90}
      schX={8.78}
      schY={-7}
      {...placements?.R_USB_BOOST_OFF_PULLDOWN}
    />

    <trace from=".J_BAT > .pin1" to="net.BAT_POS" {...batteryTraceProps} />
    <trace
      from="net.BAT_SWITCHED"
      to=".Q_BAT_CUTOFF > .source"
      {...powerTraceProps}
    />
    <trace from="net.BAT_SWITCHED" to=".R_BOOST_EN_PULLUP > .pin1" />
    <trace
      from=".R_BOOST_EN_PULLUP > .pin2"
      to=".U_BAT_BOOST > .EN"
      schDisplayLabel="BOOST_EN"
    />
    <trace from=".Q_USB_BOOST_OFF > .pin1" to=".U_BAT_BOOST > .EN" />
    <trace from=".Q_USB_BOOST_OFF > .pin3" to="net.GND" {...gndLabel} />
    <trace from="net.VBUS" to=".R_USB_BOOST_OFF > .pin1" {...vbusLabel} />
    <trace
      from=".R_USB_BOOST_OFF > .pin2"
      to=".Q_USB_BOOST_OFF > .pin2"
      schDisplayLabel="USB_DETECT"
    />
    <trace
      from=".Q_USB_BOOST_OFF > .pin2"
      to=".R_USB_BOOST_OFF_PULLDOWN > .pin1"
    />
    <trace
      from=".R_USB_BOOST_OFF_PULLDOWN > .pin2"
      to="net.GND"
      {...gndLabel}
    />
    <trace
      from=".Q_BAT_CUTOFF > .drain"
      to=".U_BAT_BOOST > .IN"
      {...powerTraceProps}
      schDisplayLabel="BOOST_IN"
    />
    <trace from="net.BAT_SWITCHED" to=".R_BAT_GATE_PULLUP > .pin1" />
    <trace
      from=".R_BAT_GATE_PULLUP > .pin2"
      to=".Q_BAT_CUTOFF > .gate"
      schDisplayLabel="BAT_GATE"
    />
    <trace from=".Q_BAT_GATE > .pin1" to=".Q_BAT_CUTOFF > .gate" />
    <trace from=".Q_BAT_GATE > .pin3" to="net.GND" {...gndLabel} />
    <trace from=".U_BAT_BOOST > .EN" to=".R_BAT_GATE_BASE > .pin1" />
    <trace
      from=".R_BAT_GATE_BASE > .pin2"
      to=".Q_BAT_GATE > .pin2"
      schDisplayLabel="GATE_DRIVE"
    />
    <trace
      from=".Q_BAT_CUTOFF > .drain"
      to=".L_BAT_BOOST > .pin1"
      {...powerTraceProps}
    />
    <trace
      from=".L_BAT_BOOST > .pin2"
      to=".U_BAT_BOOST > .SW"
      {...powerTraceProps}
      schDisplayLabel="SW"
    />
    <trace
      from=".U_BAT_BOOST > .SW"
      to=".D_BAT_BOOST > .anode"
      {...powerTraceProps}
    />
    <trace
      from=".D_BAT_BOOST > .cathode"
      to="net.VSYS"
      {...powerTraceProps}
      {...vsysLabel}
    />
    <trace
      from=".U_BAT_BOOST > .GND"
      to="net.GND"
      {...powerTraceProps}
      {...gndLabel}
    />
    <trace
      from=".C_BAT_IN > .pin1"
      to=".Q_BAT_CUTOFF > .drain"
      {...powerTraceProps}
    />
    <trace
      from=".C_BAT_IN > .pin2"
      to="net.GND"
      {...powerTraceProps}
      {...gndLabel}
    />
    <trace
      from=".C_BAT_IN_BULK > .pin1"
      to=".Q_BAT_CUTOFF > .drain"
      {...powerTraceProps}
    />
    <trace
      from=".C_BAT_IN_BULK > .pin2"
      to="net.GND"
      {...powerTraceProps}
      {...gndLabel}
    />
    <trace
      from=".C_BAT_OUT > .pin1"
      to=".D_BAT_BOOST > .cathode"
      {...powerTraceProps}
    />
    <trace
      from=".C_BAT_OUT > .pin2"
      to="net.GND"
      {...powerTraceProps}
      {...gndLabel}
    />
    <trace
      from=".C_BAT_OUT_BULK > .pin1"
      to=".D_BAT_BOOST > .cathode"
      {...powerTraceProps}
    />
    <trace
      from=".C_BAT_OUT_BULK > .pin2"
      to="net.GND"
      {...powerTraceProps}
      {...gndLabel}
    />
    <trace from=".D_BAT_BOOST > .cathode" to=".R_BOOST_TOP > .pin1" />
    <trace
      from=".R_BOOST_TOP > .pin2"
      to=".U_BAT_BOOST > .FB"
      schDisplayLabel="FB"
    />
    <trace from=".U_BAT_BOOST > .FB" to=".R_BOOST_BOT > .pin1" />
    <trace from=".R_BOOST_BOT > .pin2" to="net.GND" {...gndLabel} />
    <trace from=".J_BAT > .pin2" to="net.GND" {...gndLabel} />
  </group>
)

export default PowerBoost_GlobalLayout
