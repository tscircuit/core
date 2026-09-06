import { RP2350A } from "../../imports/RP2350A"
import { W25Q16JVUXIQ } from "../../imports/W25Q16JVUXIQ"
import { ABM8_272_T3 } from "./ABM8_272_T3"
import { SKRPACE010 } from "./imports/SKRPACE010"
import { AOTA_B201610S3R3_101_T } from "../../imports/AOTA_B201610S3R3_101_T"
import { TYPE_C_16PIN_2MD_073_ } from "./TYPE_C_16PIN_2MD_073_"
import { Fragment } from "react"

export type McuPlacement = {
  pcbX?: number
  pcbY?: number
  pcbRotation?: number
  layer?: "top" | "bottom"
}

type MicrocontrollerRP2350Props = {
  name?: string
  subcircuit?: boolean
  clockRoutingPhase?: number
  highSpeedRoutingPhase?: number
  decouplingRoutingPhase?: number
  regulatorRoutingPhase?: number
  supplyRoutingPhase?: number
  spreadPassives?: boolean
  compactCoreIsland?: boolean
  clearUsbEscape?: boolean
  placements?: Partial<Record<string, McuPlacement>>
  pcbX?: string | number
  pcbY?: string | number
  pcbRotation?: string | number
  schX?: string | number
  schY?: string | number
  schRotation?: string | number
}

const gndLabel = { displayName: "GND", schDisplayLabel: "GND" } as const
const v3v3Label = { displayName: "V3V3", schDisplayLabel: "V3V3" } as const
const v1v1Label = { displayName: "V1V1", schDisplayLabel: "V1V1" } as const
const vbusLabel = { displayName: "VBUS", schDisplayLabel: "VBUS" } as const
const denseTraceProps = { thickness: "0.1mm" } as const

const gpioNets = [
  "GPIO0",
  "GPIO1",
  "GPIO2",
  "GPIO3",
  "GPIO4",
  "GPIO5",
  "GPIO6",
  "GPIO7",
  "GPIO8",
  "GPIO9",
  "GPIO10",
  "GPIO11",
  "GPIO12",
  "GPIO13",
  "GPIO14",
  "GPIO15",
  "GPIO16",
  "GPIO17",
  "GPIO18",
  "GPIO19",
  "GPIO20",
  "GPIO21",
  "GPIO22",
  "GPIO23",
  "GPIO24",
  "GPIO25",
  "GPIO26_ADC0",
  "GPIO27_ADC1",
  "GPIO28_ADC2",
  "GPIO29_ADC3",
] as const

const parentRoutedGpios = new Set([
  "GPIO2",
  "GPIO3",
  "GPIO4",
  "GPIO5",
  "GPIO6",
  "GPIO7",
  "GPIO8",
  "GPIO9",
  "GPIO10",
  "GPIO11",
  "GPIO16",
  "GPIO17",
  "GPIO18",
  "GPIO19",
  "GPIO20",
  "GPIO21",
  "GPIO22",
])

const iovddPins = [
  "IOVDD1",
  "IOVDD2",
  "IOVDD3",
  "IOVDD4",
  "IOVDD5",
  "IOVDD6",
] as const
const dvddPins = ["DVDD1", "DVDD2", "DVDD3"] as const

/**
 * Bare RP2350A microcontroller core.
 *
 * The RP2350A symbol and QFN-60 footprint are imported from JLCPCB part
 * C42411118. The regulator, clock and
 * decoupling placement follows Raspberry Pi's
 * RPI-RP2350A-MINIMAL_R4-S1 reference (U1-relative coordinates, Y inverted).
 * The USB-C connector, flash package and board controls remain project parts.
 */
export const Microcontroller_RP2350 = (props: MicrocontrollerRP2350Props) => (
  <group
    name="MICROCONTROLLER_RP2350"
    subcircuit={props.subcircuit ?? true}
    autorouter="auto"
    {...props}
  >
    <net name="GND" />
    <net name="VBUS" />
    <net name="V3V3" routingPhaseIndex={props.supplyRoutingPhase} />
    <net name="V1V1" routingPhaseIndex={props.supplyRoutingPhase} />

    <RP2350A
      name="U1"
      noConnect={gpioNets.filter((gpio) => !parentRoutedGpios.has(gpio))}
      showPinAliases
      schSectionName="rp2350"
      pcbX={0}
      pcbY={0}
      pcbRotation={180}
      schX={0}
      schY={0}
      schWidth={2.8}
      schHeight={6.2}
      {...props.placements?.U1}
    />

    {/* Keep flash beside the QSPI pads; use the reference's 12 MHz oscillator. */}
    <W25Q16JVUXIQ
      name="U2"
      schSectionName="flash"
      pcbX={5.5}
      pcbY={-9.5}
      pcbRotation={180}
      schX={8}
      schY={0}
      schHeight={1}
      {...props.placements?.U2}
    />
    <ABM8_272_T3
      name="U_XTAL"
      schSectionName="clock"
      pcbX={0}
      pcbY={7.9}
      pcbRotation={90}
      schX={-7.6}
      schY={6.2}
      {...props.placements?.U_XTAL}
    />
    <SKRPACE010
      name="U_BOOTSEL"
      schSectionName="controls"
      pcbX={10}
      pcbY={8.5}
      schX={8.5}
      schY={5.2}
    />
    <SKRPACE010
      name="U_RUN"
      schSectionName="controls"
      pcbX={-10}
      pcbY={-2.5}
      schX={-9.05}
      schY={-4.6}
    />

    {/* USB-C receptacle, matching the Pico's USB 2.0 device-side topology. */}
    <TYPE_C_16PIN_2MD_073_
      name="J_USB"
      pinAttributes={{ B8: { doNotConnect: true }, A8: { doNotConnect: true } }}
      schSectionName="usb"
      pcbX={0}
      pcbY={-19}
      schX={11}
      schY={-5.5}
    />

    {/* RP2350 core regulator: follow the Raspberry Pi 3.3 uH / 4.7 uF topology. */}
    <AOTA_B201610S3R3_101_T
      name="U_CORE_INDUCTOR"
      schSectionName="power"
      pcbX={-2.25}
      pcbY={-6.199999999999999}
      pcbRotation={90}
      schX={9.5}
      schY={-4.5}
      {...props.placements?.U_CORE_INDUCTOR}
    />
    <resistor
      name="R_VREG_AVDD"
      resistance="33"
      footprint="res_p0.95mm_pw0.55mm_ph0.55mm"
      supplierPartNumbers={{ jlcpcb: ["C25105"] }}
      schSectionName="power"
      pcbX={-5}
      pcbY={-6}
      pcbRotation={90}
      schX={-6.95}
      schY={-3.4}
      {...props.placements?.R_VREG_AVDD}
    />
    <resistor
      name="R_RUN"
      resistance="10k"
      footprint="0402"
      supplierPartNumbers={{ jlcpcb: ["C25744"] }}
      schSectionName="controls"
      pcbX={-3.5}
      pcbY={6.5}
      pcbRotation={180}
      schX={-5.65}
      schY={-4.6}
      {...props.placements?.R_RUN}
    />
    <resistor
      name="R_BOOT"
      resistance="10k"
      footprint="0402"
      supplierPartNumbers={{ jlcpcb: ["C25744"] }}
      schSectionName="flash"
      pcbX={6}
      pcbY={-6.6}
      pcbRotation={180}
      schX={7.33}
      schY={4.2}
      {...props.placements?.R_BOOT}
    />
    <resistor
      name="R_BOOT_SERIES"
      resistance="1k"
      footprint="0402"
      supplierPartNumbers={{ jlcpcb: ["C11702"] }}
      schSectionName="controls"
      pcbX={8}
      pcbY={-7.4}
      pcbRotation={180}
      schX={11}
      schY={4.2}
      {...props.placements?.R_BOOT_SERIES}
    />
    <resistor
      name="R_XOUT"
      resistance="1k"
      footprint="res_p0.95mm_pw0.55mm_ph0.55mm"
      supplierPartNumbers={{ jlcpcb: ["C11702"] }}
      schSectionName="clock"
      pcbX={0.4}
      pcbY={5.2}
      pcbRotation={90}
      schX={-5}
      schY={6.2}
      {...props.placements?.R_XOUT}
    />
    <resistor
      name="R_CC1"
      resistance="5.1k"
      footprint="0402"
      schSectionName="usb"
      pcbX={-3.5}
      pcbY={-13.8}
      schX={7.2}
      schY={-5.2}
      {...props.placements?.R_CC1}
    />
    <resistor
      name="R_CC2"
      resistance="5.1k"
      footprint="0402"
      schSectionName="usb"
      pcbX={3.5}
      pcbY={-13.8}
      schX={7.2}
      schY={-6.2}
      {...props.placements?.R_CC2}
    />
    <resistor
      name="R_USB_DM"
      resistance="27"
      footprint="res_p0.95mm_pw0.55mm_ph0.55mm"
      supplierPartNumbers={{ jlcpcb: ["C25100"] }}
      schSectionName="usb"
      pcbX={props.clearUsbEscape ? -0.9 : -0.4}
      pcbY={props.clearUsbEscape ? -5.4 : -7}
      pcbRotation={90}
      schX={7.2}
      schY={-7.2}
      {...props.placements?.R_USB_DM}
    />
    <resistor
      name="R_USB_DP"
      resistance="27"
      footprint="res_p0.95mm_pw0.55mm_ph0.55mm"
      supplierPartNumbers={{ jlcpcb: ["C25100"] }}
      schSectionName="usb"
      pcbX={props.clearUsbEscape ? -0.1 : 0.7}
      pcbY={props.clearUsbEscape ? -5.4 : -7}
      pcbRotation={90}
      schX={7.2}
      schY={-8.2}
      {...props.placements?.R_USB_DP}
    />

    {/* Pad dimensions below reproduce the reference's 0402 land patterns. */}
    <capacitor
      name="C_VREG_IN"
      capacitance="4.7uF"
      footprint="res_p1.03mm_pw0.47mm_ph0.55mm"
      supplierPartNumbers={{ jlcpcb: ["C23733"] }}
      schSectionName="power"
      schOrientation="vertical"
      pcbX={props.clearUsbEscape ? -4 : -0.95}
      pcbY={props.clearUsbEscape ? -5.6 : -5.1}
      pcbRotation={270}
      schX={-4.8}
      schY={-3.4}
      {...props.placements?.C_VREG_IN}
    />
    <capacitor
      name="C_CORE"
      capacitance="4.7uF"
      footprint="res_p1.03mm_pw0.47mm_ph0.55mm"
      supplierPartNumbers={{ jlcpcb: ["C23733"] }}
      schSectionName="power"
      schOrientation="vertical"
      pcbX={-1}
      pcbY={-8.2}
      pcbRotation={props.compactCoreIsland ? 0 : 180}
      schX={3.5}
      schY={-4.5}
      {...props.placements?.C_CORE}
    />
    <capacitor
      name="C_VREG_AVDD"
      capacitance="4.7uF"
      maxDecouplingTraceLength={5.5}
      footprint="res_p0.95mm_pw0.55mm_ph0.55mm"
      supplierPartNumbers={{ jlcpcb: ["C23733"] }}
      schSectionName="power"
      schOrientation="vertical"
      pcbX={-5}
      pcbY={-4}
      pcbRotation={180}
      schX={-6.45}
      schY={-2.4}
      {...props.placements?.C_VREG_AVDD}
    />
    <capacitor
      name="C_IO"
      capacitance="100nF"
      footprint="res_p0.95mm_pw0.55mm_ph0.55mm"
      supplierPartNumbers={{ jlcpcb: ["C1525"] }}
      schSectionName="power"
      schOrientation="vertical"
      pcbX={props.spreadPassives ? 8 : 6.485}
      pcbY={-3.4}
      pcbRotation={0}
      schX={-6.4}
      schY={2.8}
      {...props.placements?.C_IO}
    />
    <capacitor
      name="C_QSPI_USB"
      capacitance="100nF"
      footprint="res_p0.95mm_pw0.55mm_ph0.55mm"
      supplierPartNumbers={{ jlcpcb: ["C1525"] }}
      schSectionName="power"
      schOrientation="vertical"
      pcbX={props.clearUsbEscape ? 1.3 : 0.6}
      pcbY={props.clearUsbEscape ? -5.3 : -5.2}
      pcbRotation={270}
      schX={6.01}
      schY={2.8}
      {...props.placements?.C_QSPI_USB}
    />
    <capacitor
      name="C_ADC"
      capacitance="100nF"
      footprint="res_p0.95mm_pw0.55mm_ph0.55mm"
      supplierPartNumbers={{ jlcpcb: ["C1525"] }}
      schSectionName="power"
      schOrientation="vertical"
      pcbX={-6.485}
      pcbY={-3}
      pcbRotation={180}
      schX={5.36}
      schY={3.8}
      {...props.placements?.C_ADC}
    />
    <capacitor
      name="C_IOVDD2"
      capacitance="100nF"
      footprint="res_p0.95mm_pw0.55mm_ph0.55mm"
      supplierPartNumbers={{ jlcpcb: ["C1525"] }}
      schSectionName="power"
      pcbX={props.spreadPassives ? -8.2 : -7.085}
      pcbY={0.4}
      pcbRotation={180}
      schX={-6.4}
      schY={1.8}
      {...props.placements?.C_IOVDD2}
    />
    <capacitor
      name="C_IOVDD3"
      capacitance="100nF"
      footprint="res_p0.95mm_pw0.55mm_ph0.55mm"
      supplierPartNumbers={{ jlcpcb: ["C1525"] }}
      schSectionName="power"
      pcbX={props.spreadPassives ? -7.2 : -5.685}
      pcbY={props.spreadPassives ? 4.25 : 4}
      pcbRotation={180}
      schX={-6.4}
      schY={0.8}
      {...props.placements?.C_IOVDD3}
    />
    <capacitor
      name="C_IOVDD4"
      capacitance="100nF"
      footprint="res_p0.95mm_pw0.55mm_ph0.55mm"
      supplierPartNumbers={{ jlcpcb: ["C1525"] }}
      schSectionName="power"
      pcbX={props.spreadPassives ? 3.6 : 1.4}
      pcbY={props.spreadPassives ? 5.35 : 5}
      pcbRotation={90}
      schX={-6.4}
      schY={-0.2}
      {...props.placements?.C_IOVDD4}
    />
    <capacitor
      name="C_IOVDD5"
      capacitance="100nF"
      footprint="res_p0.95mm_pw0.55mm_ph0.55mm"
      supplierPartNumbers={{ jlcpcb: ["C1525"] }}
      schSectionName="power"
      pcbX={props.spreadPassives ? 8 : 6.485}
      pcbY={1.4}
      pcbRotation={0}
      schX={-6.4}
      schY={-1.2}
      {...props.placements?.C_IOVDD5}
    />
    <capacitor
      name="C_DVDD1"
      capacitance="100nF"
      footprint="res_p0.95mm_pw0.55mm_ph0.55mm"
      supplierPartNumbers={{ jlcpcb: ["C1525"] }}
      schSectionName="power"
      pcbX={props.spreadPassives ? -8.2 : -7.08}
      pcbY={-0.6}
      pcbRotation={180}
      schX={3.5}
      schY={-5.5}
      {...props.placements?.C_DVDD1}
    />
    <capacitor
      name="C_DVDD2"
      capacitance="100nF"
      footprint="res_p0.95mm_pw0.55mm_ph0.55mm"
      supplierPartNumbers={{ jlcpcb: ["C1525"] }}
      schSectionName="power"
      pcbX={props.spreadPassives ? -1.6 : -0.6}
      pcbY={props.spreadPassives ? 5.35 : 5}
      pcbRotation={90}
      schX={3.5}
      schY={-6.5}
      {...props.placements?.C_DVDD2}
    />
    <capacitor
      name="C_DVDD3"
      capacitance="100nF"
      footprint="res_p0.95mm_pw0.55mm_ph0.55mm"
      supplierPartNumbers={{ jlcpcb: ["C1525"] }}
      schSectionName="power"
      pcbX={props.spreadPassives ? 8 : 6.48}
      pcbY={-1}
      pcbRotation={0}
      schX={3.5}
      schY={-7.5}
      {...props.placements?.C_DVDD3}
    />
    <capacitor
      name="C_FLASH"
      capacitance="100nF"
      footprint="0402"
      supplierPartNumbers={{ jlcpcb: ["C1525"] }}
      schSectionName="flash"
      schOrientation="vertical"
      pcbX={7}
      pcbY={-12.3}
      pcbRotation={0}
      schX={9.4}
      schY={1.1}
      {...props.placements?.C_FLASH}
    />
    <capacitor
      name="C_XIN"
      capacitance="15pF"
      footprint="res_p0.95mm_pw0.55mm_ph0.55mm"
      supplierPartNumbers={{ jlcpcb: ["C76950"] }}
      schSectionName="clock"
      schOrientation="vertical"
      pcbX={2.3}
      pcbY={6.8}
      pcbRotation={0}
      schX={-7.3}
      schY={7.4}
      {...props.placements?.C_XIN}
    />
    <capacitor
      name="C_XOUT"
      capacitance="15pF"
      footprint="res_p0.95mm_pw0.55mm_ph0.55mm"
      supplierPartNumbers={{ jlcpcb: ["C76950"] }}
      schSectionName="clock"
      schOrientation="vertical"
      pcbX={-2.3}
      pcbY={9}
      pcbRotation={180}
      schX={-5.7}
      schY={7.4}
      {...props.placements?.C_XOUT}
    />
    <capacitor
      name="C_VBUS"
      capacitance="10uF"
      footprint="0603"
      schSectionName="usb"
      schOrientation="vertical"
      pcbX={-6.8}
      pcbY={-16}
      schX={15}
      schY={-5.2}
      {...props.placements?.C_VBUS}
    />

    <testpoint
      name="TP_SWDIO"
      footprintVariant="pad"
      padShape="circle"
      padDiameter="1.1mm"
      schSectionName="debug"
      pcbX={-5.4}
      pcbY={7.6}
      pcbRotation={180}
      schX={-8.4}
      schY={-7.2}
      {...props.placements?.TP_SWDIO}
    />
    <testpoint
      name="TP_SWCLK"
      footprintVariant="pad"
      padShape="circle"
      padDiameter="1.1mm"
      schSectionName="debug"
      pcbX={-3.4}
      pcbY={7.6}
      pcbRotation={180}
      schX={-6.4}
      schY={-7.2}
      {...props.placements?.TP_SWCLK}
    />
    <testpoint
      name="TP_GND"
      footprintVariant="pad"
      padShape="circle"
      padDiameter="1.1mm"
      schSectionName="debug"
      pcbX={-6.6}
      pcbY={8.7}
      pcbRotation={180}
      schX={-4.4}
      schY={-7.2}
      {...props.placements?.TP_GND}
    />
    <testpoint
      name="TP_3V3"
      footprintVariant="pad"
      padShape="circle"
      padDiameter="1.1mm"
      schSectionName="debug"
      pcbX={-8.4}
      pcbY={8.7}
      pcbRotation={180}
      schX={-2.4}
      schY={-7.2}
      {...props.placements?.TP_3V3}
    />

    {/* Core regulator and digital supply */}
    <trace
      name="VREG_VIN"
      from=".U1 > .VREG_VIN"
      to="net.V3V3"
      {...v3v3Label}
    />
    <trace
      name="VREG_PGND"
      from=".U1 > .VREG_PGND"
      to="net.GND"
      {...gndLabel}
    />
    {/* The marked inductor terminal (pin2) is LX in the reference layout. */}
    <trace
      name="VREG_LX"
      routingPhaseIndex={
        props.regulatorRoutingPhase ?? props.decouplingRoutingPhase
      }
      from=".U1 > .VREG_LX"
      to=".U_CORE_INDUCTOR > .pin2"
    />
    <trace
      name="CORE_OUT"
      from=".U_CORE_INDUCTOR > .pin1"
      to="net.V1V1"
      {...v1v1Label}
    />
    <trace name="VREG_FB" from=".U1 > .VREG_FB" to="net.V1V1" {...v1v1Label} />
    {dvddPins.map((pin) => (
      <Fragment key={pin}>
        <trace
          name={`${pin}_V1V1`}
          from={`.U1 > .${pin}`}
          to="net.V1V1"
          {...v1v1Label}
        />
      </Fragment>
    ))}
    <trace
      name="C_VREG_IN_P"
      routingPhaseIndex={
        props.regulatorRoutingPhase ?? props.decouplingRoutingPhase
      }
      from=".C_VREG_IN > .pin1"
      to=".U1 > .VREG_VIN"
      maxLength="5.5mm"
      {...v3v3Label}
    />
    <trace
      name="C_VREG_IN_G"
      routingPhaseIndex={
        props.regulatorRoutingPhase ?? props.decouplingRoutingPhase
      }
      from=".C_VREG_IN > .pin2"
      to=".U1 > .VREG_PGND"
      maxLength="5.5mm"
      {...gndLabel}
    />
    <trace
      name="C_CORE_P"
      routingPhaseIndex={props.decouplingRoutingPhase}
      from=".C_CORE > .pin1"
      to=".U_CORE_INDUCTOR > .pin1"
      maxLength="5.5mm"
      {...v1v1Label}
    />
    <trace
      name="C_CORE_G"
      routingPhaseIndex={props.decouplingRoutingPhase}
      from=".C_CORE > .pin2"
      to=".U1 > .VREG_PGND"
      maxLength="5.5mm"
      {...gndLabel}
    />
    <trace
      name="VREG_AVDD_FILTER"
      from="net.V3V3"
      to=".R_VREG_AVDD > .pin1"
      {...v3v3Label}
    />
    <trace
      name="VREG_AVDD"
      routingPhaseIndex={props.decouplingRoutingPhase}
      from=".R_VREG_AVDD > .pin2"
      to=".U1 > .VREG_AVDD"
    />
    <trace
      name="C_VREG_AVDD_P"
      routingPhaseIndex={props.decouplingRoutingPhase}
      from=".C_VREG_AVDD > .pin1"
      to=".U1 > .VREG_AVDD"
    />
    <trace
      name="C_VREG_AVDD_G"
      routingPhaseIndex={props.decouplingRoutingPhase}
      from=".C_VREG_AVDD > .pin2"
      to=".U1 > .VREG_PGND"
      maxLength="5.5mm"
      {...gndLabel}
    />

    {/* I/O, QSPI, USB/OTP, and ADC supplies with local decoupling. */}
    {iovddPins.map((pin) => (
      <Fragment key={pin}>
        <trace
          name={`${pin}_V3V3`}
          from={`.U1 > .${pin}`}
          to="net.V3V3"
          {...v3v3Label}
        />
      </Fragment>
    ))}
    <trace
      name="QSPI_IOVDD"
      from=".U1 > .QSPI_IOVDD"
      to="net.V3V3"
      {...v3v3Label}
    />
    <trace
      name="USB_OTP_VDD"
      from=".U1 > .USB_OTP_VDD"
      to="net.V3V3"
      {...v3v3Label}
    />
    <trace
      name="ADC_AVDD"
      from=".U1 > .ADC_AVDD"
      to="net.V3V3"
      {...v3v3Label}
    />
    <trace
      name="C_IO_P"
      routingPhaseIndex={props.decouplingRoutingPhase}
      from=".C_IO > .pin1"
      to=".U1 > .IOVDD6"
      maxLength="5.5mm"
      {...v3v3Label}
    />
    <trace name="C_IO_G" from=".C_IO > .pin2" to="net.GND" {...gndLabel} />
    <trace
      name="C_QSPI_USB_P"
      routingPhaseIndex={props.decouplingRoutingPhase}
      from=".C_QSPI_USB > .pin1"
      to=".U1 > .QSPI_IOVDD"
      maxLength="5.5mm"
      {...v3v3Label}
    />
    <trace
      name="C_QSPI_USB_G"
      from=".C_QSPI_USB > .pin2"
      to="net.GND"
      {...gndLabel}
    />
    <trace
      name="C_ADC_P"
      routingPhaseIndex={props.decouplingRoutingPhase}
      from=".C_ADC > .pin1"
      to=".U1 > .ADC_AVDD"
      maxLength="5.5mm"
      {...v3v3Label}
    />
    <trace name="C_ADC_G" from=".C_ADC > .pin2" to="net.GND" {...gndLabel} />
    <trace name="GND_PAD" from=".U1 > .GND" to="net.GND" {...gndLabel} />
    {["IOVDD2", "IOVDD3", "IOVDD4", "IOVDD5", ...dvddPins].map((pin) => (
      <Fragment key={`decoupling_${pin}`}>
        <trace
          name={`C_${pin}_P`}
          routingPhaseIndex={props.decouplingRoutingPhase}
          from={`.C_${pin} > .pin1`}
          to={`.U1 > .${pin}`}
          maxLength="5.5mm"
        />
        <trace
          name={`C_${pin}_G`}
          from={`.C_${pin} > .pin2`}
          to="net.GND"
          {...gndLabel}
        />
      </Fragment>
    ))}

    {/* QSPI boot flash follows the signal mapping used by the local Pico. */}
    <trace
      name="QSPI_SS"
      routingPhaseIndex={props.highSpeedRoutingPhase}
      from=".U1 > .QSPI_SS"
      to=".U2 > .CS"
      {...denseTraceProps}
    />
    <trace
      name="QSPI_SD0"
      routingPhaseIndex={props.highSpeedRoutingPhase}
      from=".U1 > .QSPI_SD0"
      to=".U2 > .pin5"
      {...denseTraceProps}
    />
    <trace
      name="QSPI_SD1"
      routingPhaseIndex={props.highSpeedRoutingPhase}
      from=".U1 > .QSPI_SD1"
      to=".U2 > .pin2"
      {...denseTraceProps}
    />
    <trace
      name="QSPI_SD2"
      routingPhaseIndex={props.highSpeedRoutingPhase}
      from=".U1 > .QSPI_SD2"
      to=".U2 > .pin3"
      {...denseTraceProps}
    />
    <trace
      name="QSPI_SD3"
      routingPhaseIndex={props.highSpeedRoutingPhase}
      from=".U1 > .QSPI_SD3"
      to=".U2 > .pin7"
      {...denseTraceProps}
    />
    <trace
      name="QSPI_SCLK"
      routingPhaseIndex={props.highSpeedRoutingPhase}
      from=".U1 > .QSPI_SCLK"
      to=".U2 > .CLK"
      {...denseTraceProps}
    />
    <trace name="FLASH_VCC" from=".U2 > .VCC" to="net.V3V3" {...v3v3Label} />
    <trace name="FLASH_GND" from=".U2 > .GND" to="net.GND" {...gndLabel} />
    <trace name="FLASH_EP" from=".U2 > .EP" to="net.GND" {...gndLabel} />
    <trace
      name="C_FLASH_P"
      from=".C_FLASH > .pin1"
      to="net.V3V3"
      {...v3v3Label}
    />
    <trace
      name="C_FLASH_G"
      from=".C_FLASH > .pin2"
      to="net.GND"
      {...gndLabel}
    />
    <trace
      name="BOOT_PULLUP"
      routingPhaseIndex={props.highSpeedRoutingPhase}
      from=".R_BOOT > .pin1"
      to=".U1 > .QSPI_SS"
    />
    <trace
      name="BOOT_PULLUP_3V3"
      from=".R_BOOT > .pin2"
      to="net.V3V3"
      {...v3v3Label}
    />
    <trace
      name="BOOTSEL"
      routingPhaseIndex={props.highSpeedRoutingPhase}
      from=".U_BOOTSEL > .pin1"
      to=".R_BOOT_SERIES > .pin2"
    />
    <trace
      name="BOOTSEL_SERIES"
      routingPhaseIndex={props.highSpeedRoutingPhase}
      from=".R_BOOT_SERIES > .pin1"
      to=".U1 > .QSPI_SS"
    />
    <trace
      name="BOOTSEL_GND"
      from=".U_BOOTSEL > .pin3"
      to="net.GND"
      {...gndLabel}
    />

    {/* Crystal, reset, USB-C, and SWD are available to the eventual board. */}
    <trace
      name="XIN"
      from=".U_XTAL > .pin1"
      to=".U1 > .XIN"
      maxLength="10mm"
      routingPhaseIndex={props.clockRoutingPhase}
    />
    <trace
      name="XOUT"
      from=".U1 > .XOUT"
      to=".R_XOUT > .pin1"
      maxLength="5.5mm"
      routingPhaseIndex={props.clockRoutingPhase}
    />
    <trace
      name="XOUT_CRYSTAL"
      from=".R_XOUT > .pin2"
      to=".U_XTAL > .pin3"
      maxLength="10mm"
      routingPhaseIndex={props.clockRoutingPhase}
    />
    <trace name="XTAL_GND1" from=".U_XTAL > .pin2" to="net.GND" {...gndLabel} />
    <trace name="XTAL_GND2" from=".U_XTAL > .pin4" to="net.GND" {...gndLabel} />
    <trace
      name="T_C_XIN"
      from=".C_XIN > .pin1"
      to=".U1 > .XIN"
      routingPhaseIndex={props.clockRoutingPhase}
    />
    <trace name="C_XIN_GND" from=".C_XIN > .pin2" to="net.GND" {...gndLabel} />
    <trace
      name="T_C_XOUT"
      from=".C_XOUT > .pin1"
      to=".U_XTAL > .pin3"
      routingPhaseIndex={props.clockRoutingPhase}
    />
    <trace
      name="C_XOUT_GND"
      from=".C_XOUT > .pin2"
      to="net.GND"
      {...gndLabel}
    />
    <trace name="RUN_PULLUP" from=".R_RUN > .pin1" to=".U1 > .RUN" />
    <trace
      name="RUN_PULLUP_3V3"
      from=".R_RUN > .pin2"
      to="net.V3V3"
      {...v3v3Label}
    />
    <trace name="RUN_SWITCH" from=".U_RUN > .pin1" to=".U1 > .RUN" />
    <trace
      name="RUN_SWITCH_GND"
      from=".U_RUN > .pin3"
      to="net.GND"
      {...gndLabel}
    />
    <trace name="VBUS_A" from=".J_USB > .A4B9" to="net.VBUS" {...vbusLabel} />
    <trace name="VBUS_B" from=".J_USB > .B4A9" to="net.VBUS" {...vbusLabel} />
    <trace
      name="C_VBUS_P"
      from=".C_VBUS > .pin1"
      to="net.VBUS"
      {...vbusLabel}
    />
    <trace name="C_VBUS_G" from=".C_VBUS > .pin2" to="net.GND" {...gndLabel} />
    <trace
      name="USB_DM_A"
      routingPhaseIndex={props.highSpeedRoutingPhase}
      from=".J_USB > .A7"
      to=".R_USB_DM > .pin1"
    />
    <trace
      name="USB_DM_B"
      routingPhaseIndex={props.highSpeedRoutingPhase}
      from=".J_USB > .B7"
      to=".R_USB_DM > .pin1"
    />
    <trace
      name="USB_DM"
      routingPhaseIndex={props.highSpeedRoutingPhase}
      from=".R_USB_DM > .pin2"
      to=".U1 > .USB_DM"
      {...denseTraceProps}
    />
    <trace
      name="USB_DP_A"
      routingPhaseIndex={props.highSpeedRoutingPhase}
      from=".J_USB > .A6"
      to=".R_USB_DP > .pin1"
    />
    <trace
      name="USB_DP_B"
      routingPhaseIndex={props.highSpeedRoutingPhase}
      from=".J_USB > .B6"
      to=".R_USB_DP > .pin1"
    />
    <trace
      name="USB_DP"
      routingPhaseIndex={props.highSpeedRoutingPhase}
      from=".R_USB_DP > .pin2"
      to=".U1 > .USB_DP"
      {...denseTraceProps}
    />
    <trace name="CC1" from=".J_USB > .A5" to=".R_CC1 > .pin1" />
    <trace name="CC2" from=".J_USB > .B5" to=".R_CC2 > .pin1" />
    <trace name="CC1_GND" from=".R_CC1 > .pin2" to="net.GND" {...gndLabel} />
    <trace name="CC2_GND" from=".R_CC2 > .pin2" to="net.GND" {...gndLabel} />
    <trace name="USB_GND_A" from=".J_USB > .A1B12" to="net.GND" {...gndLabel} />
    <trace name="USB_GND_B" from=".J_USB > .B1A12" to="net.GND" {...gndLabel} />
    <trace
      name="USB_SHIELD_1"
      from=".J_USB > .EH1"
      to="net.GND"
      {...gndLabel}
    />
    <trace
      name="USB_SHIELD_1_ALT"
      from=".J_USB > .pin13_alt1"
      to="net.GND"
      {...gndLabel}
    />
    <trace
      name="USB_SHIELD_2"
      from=".J_USB > .EH2"
      to="net.GND"
      {...gndLabel}
    />
    <trace
      name="USB_SHIELD_2_ALT"
      from=".J_USB > .pin14_alt1"
      to="net.GND"
      {...gndLabel}
    />
    <trace name="SWDIO" from=".U1 > .SWDIO" to=".TP_SWDIO > .pin1" />
    <trace name="SWCLK" from=".U1 > .SWCLK" to=".TP_SWCLK > .pin1" />
    <trace name="T_TP_GND" from=".TP_GND > .pin1" to="net.GND" {...gndLabel} />
    <trace
      name="T_TP_3V3"
      from=".TP_3V3 > .pin1"
      to="net.V3V3"
      {...v3v3Label}
    />
  </group>
)
