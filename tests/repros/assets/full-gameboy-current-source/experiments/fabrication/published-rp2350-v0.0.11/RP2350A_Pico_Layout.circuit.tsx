// Variant-owned copy: edits here must not alter the main-board essentials.
import { RP2350A } from "./imports/RP2350A"
import { ABM8_272_T3 } from "./imports/ABM8_272_T3"
import { Fragment, type ReactNode } from "react"

const unusedRp2350Pins = [
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
  "RUN",
  "SWCLK",
  "SWDIO",
  "QSPI_SD0",
  "QSPI_SD1",
  "QSPI_SD2",
  "QSPI_SD3",
  "QSPI_SCLK",
  "QSPI_SS",
] as const

const rp2350InlineSchematicPinArrangement = {
  leftSide: [
    "VREG_VIN",
    "IOVDD6",
    "IOVDD5",
    "IOVDD4",
    "IOVDD3",
    "IOVDD2",
    "IOVDD1",
    "ADC_AVDD",
    "VREG_AVDD",
    "USB_OTP_VDD",
    "QSPI_IOVDD",
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
    "XIN",
    "XOUT",
    "SWCLK",
    "SWDIO",
    "RUN",
  ],
  rightSide: [
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
    "USB_DM",
    "USB_DP",
    "QSPI_SD3",
    "QSPI_SCLK",
    "QSPI_SD0",
    "QSPI_SD2",
    "QSPI_SD1",
    "QSPI_SS",
    "VREG_LX",
    "VREG_FB",
  ],
  bottomSide: ["DVDD3", "DVDD2", "DVDD1", "VREG_PGND", "GND"],
}

export interface RP2350AEssentialKiCadReferenceProps {
  name?: string
  pcbX?: number
  pcbY?: number
  pcbRotation?: number
  schSheetName?: string
  noConnectUnusedPins?: boolean
  inlineSignalLabels?: boolean
  usbResistorEscape?: boolean
  mcuPassiveEscape?: boolean
  clockPassiveEscape?: boolean
  clockRoutingPhase?: number
  westDecouplerEscape?: boolean
  eastSupplyCapEscape?: boolean
  clockResistorEscape?: boolean
  children?: ReactNode
}

/**
 * RP2350A essentials rebuilt as native tscircuit JSX.
 * Placement starts from the official Raspberry Pi KiCad reference, with local
 * spacing adjusted for the complete board. This is an ordinary placement group,
 * not a separately routed subcircuit. No manual copper paths or vias are used.
 */
export const RP2350AEssentialKiCadReference = ({
  name = "RP2350A_ESSENTIAL_REFERENCE",
  schSheetName,
  noConnectUnusedPins = true,
  inlineSignalLabels = false,
  usbResistorEscape = false,
  mcuPassiveEscape = false,
  clockPassiveEscape = false,
  clockRoutingPhase,
  westDecouplerEscape = false,
  eastSupplyCapEscape = false,
  clockResistorEscape = false,
  children,
  ...props
}: RP2350AEssentialKiCadReferenceProps = {}) => (
  <group name={name} schSheetName={schSheetName} {...props}>
    <net name="V1V1" isPowerNet />
    {/* RP2350 datasheet 6.3.8.1: clear copper immediately below LX and the
		    inductor on layer 2; retain the other layers for return connectivity. */}
    <keepout
      shape="rect"
      pcbX={3.3}
      pcbY={4}
      width="3.5mm"
      height="3.5mm"
      layers={["inner1"]}
    />
    {/* Keep placement grouping, but route the MCU with the complete board.
		    There is no separate breakout route to freeze before local signals. */}
    <group name="U1_FANOUT" pcbX={0} pcbY={0}>
      <RP2350A
        name="U1"
        schSectionName="rp2350"
        schX={0}
        schY={0}
        schWidth={inlineSignalLabels ? 8 : undefined}
        schHeight={inlineSignalLabels ? 9 : undefined}
        pcbX={0}
        pcbY={-1.1}
        pcbRotation={0}
        schPinArrangement={
          inlineSignalLabels ? rp2350InlineSchematicPinArrangement : undefined
        }
        noConnect={noConnectUnusedPins ? [...unusedRp2350Pins] : undefined}
      />
      {inlineSignalLabels &&
        unusedRp2350Pins.map((signal) => (
          <Fragment key={`u1-inline-${signal}`}>
            <netlabel net={signal} connection={`.U1 > .${signal}`} inline />
          </Fragment>
        ))}
      <inductor
        name="L1"
        schSectionName="regulator"
        schX={-10}
        schY={3.8}
        inductance="3.3uH"
        maxCurrentRating="2.1A"
        footprint="res_p1.999996mm_pw0.999998mm_ph1.5999968mm"
        supplierPartNumbers={{ jlcpcb: ["C42411119"] }}
        manufacturerPartNumber="AOTA-B201610S3R3-101-T"
        pcbX={3.3}
        pcbY={4}
        pcbRotation={180}
      />
      <ABM8_272_T3
        name="X1"
        schSectionName="clock"
        schX={-10}
        schY={-5}
        pcbX={0}
        pcbY={-8.5}
        pcbRotation={270}
      />

      <resistor
        name="R2"
        schSectionName="clock"
        schX={-6}
        schY={-5}
        resistance="1kohm"
        footprint="res_p0.8656mm_pw0.5657mm_ph0.54mm"
        supplierPartNumbers={{ jlcpcb: ["C106235"] }}
        tolerance="1%"
        pcbX={clockResistorEscape ? 1.6 : 0}
        pcbY={clockResistorEscape ? -5.95 : -5.8}
        pcbRotation={clockPassiveEscape ? 0 : 180}
      />
      <resistor
        name="R3"
        schSectionName="regulator"
        schX={-12}
        schY={1.5}
        resistance="33ohm"
        footprint="res_p0.8656mm_pw0.5657mm_ph0.54mm"
        supplierPartNumbers={{ jlcpcb: ["C138002"] }}
        tolerance="1%"
        pcbX={5.8}
        pcbY={3}
        pcbRotation={180}
      />
      <resistor
        name="R7"
        schSectionName="usb_termination"
        schX={7}
        schY={-5}
        resistance="27ohm"
        footprint="res_p0.8656mm_pw0.5657mm_ph0.54mm"
        supplierPartNumbers={{ jlcpcb: ["C138021"] }}
        tolerance="1%"
        pcbX={usbResistorEscape ? 0.4 : 1.5}
        pcbY={7}
        pcbRotation={90}
      />
      <resistor
        name="R8"
        schSectionName="usb_termination"
        schX={11}
        schY={-5}
        resistance="27ohm"
        footprint="res_p0.8656mm_pw0.5657mm_ph0.54mm"
        supplierPartNumbers={{ jlcpcb: ["C138021"] }}
        tolerance="1%"
        pcbX={usbResistorEscape ? 1.5 : 0.4}
        pcbY={7}
        pcbRotation={90}
      />

      <capacitor
        name="C3"
        schSectionName="clock"
        schX={-12}
        schY={-7}
        schOrientation="vertical"
        capacitance="15pF"
        footprint="res_p0.8402mm_pw0.5mm_ph0.54mm"
        supplierPartNumbers={{ jlcpcb: ["C76950"] }}
        maxVoltageRating="50V"
        pcbX={eastSupplyCapEscape ? -3 : -2.3}
        pcbY={eastSupplyCapEscape ? -7.3 : -6.2}
        pcbRotation={180}
      />
      <capacitor
        name="C4"
        schSectionName="clock"
        schX={-8}
        schY={-7}
        schOrientation="vertical"
        capacitance="15pF"
        footprint="res_p0.8402mm_pw0.5mm_ph0.54mm"
        supplierPartNumbers={{ jlcpcb: ["C76950"] }}
        maxVoltageRating="50V"
        pcbX={clockPassiveEscape ? 2.45 : 2.3}
        pcbY={clockPassiveEscape ? -9.4 : -6.2}
      />
      <capacitor
        name="C6"
        schSectionName="regulator"
        schX={-13}
        schY={4}
        schOrientation="vertical"
        capacitance="4.7uF"
        // Murata GRM15 reflow lands: a=0.5, b=0.4, c=0.54 mm (spec p27).
        footprint="res_p0.9mm_pw0.4mm_ph0.54mm"
        supplierPartNumbers={{ jlcpcb: ["C82453"] }}
        maxVoltageRating="6.3V"
        maxDecouplingTraceLength={5.5}
        pcbX={1.2}
        pcbY={4.2}
        pcbRotation={90}
      />
      <capacitor
        name="C7"
        schSectionName="regulator"
        schX={-7}
        schY={4}
        schOrientation="vertical"
        capacitance="4.7uF"
        footprint="res_p0.9mm_pw0.4mm_ph0.54mm"
        supplierPartNumbers={{ jlcpcb: ["C82453"] }}
        maxVoltageRating="6.3V"
        maxDecouplingTraceLength={5.5}
        pcbX={5.5}
        pcbY={5.5}
        pcbRotation={90}
      />
      <capacitor
        name="C8"
        schSectionName="decoupling"
        schX={6}
        schY={5}
        schOrientation="vertical"
        capacitance="100nF"
        footprint="res_p0.8402mm_pw0.5mm_ph0.54mm"
        supplierPartNumbers={{ jlcpcb: ["C77014"] }}
        maxVoltageRating="25V"
        maxDecouplingTraceLength={5.5}
        pcbX={-5}
        pcbY={-0.3}
        pcbRotation={180}
      />
      <capacitor
        name="C9"
        schSectionName="regulator"
        schX={-7}
        schY={1.5}
        schOrientation="vertical"
        capacitance="4.7uF"
        footprint="res_p0.8402mm_pw0.5mm_ph0.54mm"
        supplierPartNumbers={{ jlcpcb: ["C82453"] }}
        maxVoltageRating="6.3V"
        maxDecouplingTraceLength={5.5}
        pcbX={6.8}
        pcbY={4.5}
        pcbRotation={90}
      />
      <capacitor
        name="C10"
        schSectionName="decoupling"
        schX={8}
        schY={5}
        schOrientation="vertical"
        capacitance="100nF"
        footprint="res_p0.8402mm_pw0.5mm_ph0.54mm"
        supplierPartNumbers={{ jlcpcb: ["C77014"] }}
        maxVoltageRating="25V"
        maxDecouplingTraceLength={5.5}
        pcbX={eastSupplyCapEscape ? -1.8 : 2.8}
        pcbY={eastSupplyCapEscape ? -5.8 : -7.7}
        pcbRotation={eastSupplyCapEscape ? 180 : 270}
      />
      <capacitor
        name="C11"
        schSectionName="decoupling"
        schX={10}
        schY={5}
        schOrientation="vertical"
        capacitance="100nF"
        footprint="res_p0.8402mm_pw0.5mm_ph0.54mm"
        supplierPartNumbers={{ jlcpcb: ["C77014"] }}
        maxVoltageRating="25V"
        maxDecouplingTraceLength={5.5}
        pcbX={westDecouplerEscape ? 6.4 : 5.1}
        pcbY={-0.7}
      />
      <capacitor
        name="C12"
        schSectionName="decoupling"
        schX={12}
        schY={5}
        schOrientation="vertical"
        capacitance="100nF"
        footprint="res_p0.8402mm_pw0.5mm_ph0.54mm"
        supplierPartNumbers={{ jlcpcb: ["C77014"] }}
        maxVoltageRating="25V"
        maxDecouplingTraceLength={5.5}
        pcbX={-0.5}
        pcbY={4.2}
        pcbRotation={180}
      />
      <capacitor
        name="C13"
        schSectionName="decoupling"
        schX={14}
        schY={5}
        schOrientation="vertical"
        capacitance="100nF"
        footprint="res_p0.8402mm_pw0.5mm_ph0.54mm"
        supplierPartNumbers={{ jlcpcb: ["C77014"] }}
        maxVoltageRating="25V"
        maxDecouplingTraceLength={5.5}
        pcbX={-5.3}
        pcbY={1.7}
        pcbRotation={-180}
      />
      <capacitor
        name="C14"
        schSectionName="decoupling"
        schX={6}
        schY={2.5}
        schOrientation="vertical"
        capacitance="100nF"
        footprint="res_p0.8402mm_pw0.5mm_ph0.54mm"
        supplierPartNumbers={{ jlcpcb: ["C77014"] }}
        maxVoltageRating="25V"
        maxDecouplingTraceLength={5.5}
        pcbX={westDecouplerEscape ? 6.4 : 5.1}
        pcbY={-1.5}
      />
      <capacitor
        name="C15"
        schSectionName="decoupling"
        schX={8}
        schY={2.5}
        schOrientation="vertical"
        capacitance="100nF"
        footprint="res_p0.8402mm_pw0.5mm_ph0.54mm"
        supplierPartNumbers={{ jlcpcb: ["C77014"] }}
        maxVoltageRating="25V"
        maxDecouplingTraceLength={5.5}
        pcbX={-5}
        pcbY={-2.3}
        pcbRotation={180}
      />
      <capacitor
        name="C16"
        schSectionName="decoupling"
        schX={10}
        schY={2.5}
        schOrientation="vertical"
        capacitance="100nF"
        footprint="res_p0.8402mm_pw0.5mm_ph0.54mm"
        supplierPartNumbers={{ jlcpcb: ["C77014"] }}
        maxVoltageRating="25V"
        maxDecouplingTraceLength={5.5}
        pcbX={4.2}
        pcbY={-6.2}
      />
      <capacitor
        name="C17"
        schSectionName="decoupling"
        schX={12}
        schY={2.5}
        schOrientation="vertical"
        capacitance="100nF"
        footprint="res_p0.8402mm_pw0.5mm_ph0.54mm"
        supplierPartNumbers={{ jlcpcb: ["C77014"] }}
        maxVoltageRating="25V"
        maxDecouplingTraceLength={5.5}
        pcbX={mcuPassiveEscape ? 6.4 : 5.3}
        pcbY={0.9}
      />
      <capacitor
        name="C18"
        schSectionName="decoupling"
        schX={14}
        schY={2.5}
        schOrientation="vertical"
        capacitance="100nF"
        footprint="res_p0.8402mm_pw0.5mm_ph0.54mm"
        supplierPartNumbers={{ jlcpcb: ["C77014"] }}
        maxVoltageRating="25V"
        maxDecouplingTraceLength={5.5}
        pcbX={-3.8}
        pcbY={-5.8}
        pcbRotation={180}
      />

      <capacitor
        name="C_IOVDD1"
        schSectionName="decoupling"
        schX={14}
        schY={0}
        schOrientation="vertical"
        capacitance="100nF"
        footprint="res_p0.8402mm_pw0.5mm_ph0.54mm"
        supplierPartNumbers={{ jlcpcb: ["C77014"] }}
        maxVoltageRating="25V"
        maxDecouplingTraceLength={5.5}
        pcbX={mcuPassiveEscape ? 6.4 : 5.3}
        pcbY={2.1}
      />
      {/* Route the dense MCU rails with the pad escapes so pipeline9 can
			    solve their shared channels instead of freezing the escapes first. */}
      <trace
        name="C_IOVDD1_V3V3"
        from=".C_IOVDD1 > .pin1"
        to=".U1 > .IOVDD1"
        thickness="0.1mm"
      />
      <trace
        name="C_IOVDD1_GND"
        from=".C_IOVDD1 > .pin2"
        to="net.GND"
        thickness="0.1mm"
      />
      <trace name="U1_GND" from=".U1 > .GND" to="net.GND" thickness="0.1mm" />
      <trace
        name="U1_VREG_PGND"
        from=".U1 > .VREG_PGND"
        to=".C6 > .pin2"
        thickness="0.1mm"
      />

      <trace name="U1_IOVDD1" from=".U1 > .IOVDD1" to="net.V3V3" />
      <trace name="U1_IOVDD2" from=".U1 > .IOVDD2" to="net.V3V3" />
      <trace name="U1_IOVDD3" from=".U1 > .IOVDD3" to="net.V3V3" />
      <trace name="U1_IOVDD4" from=".U1 > .IOVDD4" to="net.V3V3" />
      <trace name="U1_IOVDD5" from=".U1 > .IOVDD5" to="net.V3V3" />
      <trace name="U1_IOVDD6" from=".U1 > .IOVDD6" to="net.V3V3" />
      <trace name="U1_ADC_AVDD" from=".U1 > .ADC_AVDD" to="net.V3V3" />
      <trace name="U1_VREG_VIN" from=".U1 > .VREG_VIN" to="net.V3V3" />
      <trace name="U1_USB_OTP_VDD" from=".U1 > .USB_OTP_VDD" to="net.V3V3" />
      <trace name="U1_QSPI_IOVDD" from=".U1 > .QSPI_IOVDD" to="net.V3V3" />

      {/* Complete core-voltage distribution after local decoupling routes. */}
      <trace name="U1_DVDD1" from=".C11 > .pin1" to="net.V1V1" />
      <trace name="U1_DVDD2" from=".C10 > .pin1" to="net.V1V1" />
      <trace name="U1_DVDD3" from=".C8 > .pin1" to="net.V1V1" />
      <trace
        name="U1_VREG_FB"
        from=".U1 > .VREG_FB"
        to=".C7 > .pin1"
        thickness="0.1mm"
      />

      <trace name="VREG_CORE" from=".L1 > .pin1" to="net.V1V1" />
      <trace name="VREG_AVDD_R_IN" from=".R3 > .pin1" to="net.V3V3" />
      <trace
        name="VREG_AVDD_C_GND"
        from=".C9 > .pin2"
        to="net.GND"
        thickness="0.1mm"
      />

      <trace
        name="C6_V3V3"
        from=".C6 > .pin1"
        to=".U1 > .VREG_VIN"
        maxViaCount={0}
        thickness="0.1mm"
      />
      <trace name="C6_GND" from=".C6 > .pin2" to="net.GND" thickness="0.1mm" />
      <trace
        name="C7_V1V1"
        from=".C7 > .pin1"
        to=".L1 > .pin1"
        maxViaCount={0}
        thickness="0.1mm"
      />
      <trace
        name="C7_GND"
        from=".C7 > .pin2"
        to=".C6 > .pin2"
        thickness="0.1mm"
      />
      <trace
        name="C8_V1V1"
        from=".C8 > .pin1"
        to=".U1 > .DVDD3"
        thickness="0.1mm"
      />
      <trace name="C8_GND" from=".C8 > .pin2" to="net.GND" thickness="0.1mm" />
      <trace
        name="C10_V1V1"
        from=".C10 > .pin1"
        to=".U1 > .DVDD2"
        thickness="0.1mm"
      />
      <trace
        name="C10_GND"
        from=".C10 > .pin2"
        to="net.GND"
        thickness="0.1mm"
      />
      <trace
        name="C11_V1V1"
        from=".C11 > .pin1"
        to=".U1 > .DVDD1"
        thickness="0.1mm"
      />
      <trace
        name="C11_GND"
        from=".C11 > .pin2"
        to="net.GND"
        thickness="0.1mm"
      />
      <trace
        name="C12_V3V3"
        from=".C12 > .pin1"
        to=".U1 > .USB_OTP_VDD"
        thickness="0.1mm"
      />
      <trace
        name="C12_GND"
        from=".C12 > .pin2"
        to="net.GND"
        thickness="0.1mm"
      />
      <trace
        name="C13_V3V3"
        from=".C13 > .pin1"
        to=".U1 > .IOVDD6"
        thickness="0.1mm"
      />
      <trace
        name="C13_GND"
        from=".C13 > .pin2"
        to="net.GND"
        thickness="0.1mm"
      />
      <trace
        name="C14_V3V3"
        from=".C14 > .pin1"
        to=".U1 > .IOVDD2"
        thickness="0.1mm"
      />
      <trace
        name="C14_GND"
        from=".C14 > .pin2"
        to="net.GND"
        thickness="0.1mm"
      />
      <trace
        name="C15_V3V3"
        from=".C15 > .pin1"
        to=".U1 > .IOVDD5"
        thickness="0.1mm"
      />
      <trace
        name="C15_GND"
        from=".C15 > .pin2"
        to="net.GND"
        thickness="0.1mm"
      />
      <trace
        name="C16_V3V3"
        from=".C16 > .pin1"
        to=".U1 > .IOVDD3"
        thickness="0.1mm"
      />
      <trace
        name="C16_GND"
        from=".C16 > .pin2"
        to="net.GND"
        thickness="0.1mm"
      />
      <trace
        name="C17_V3V3"
        from=".C17 > .pin1"
        to=".U1 > .ADC_AVDD"
        thickness="0.1mm"
      />
      <trace
        name="C17_GND"
        from=".C17 > .pin2"
        to="net.GND"
        thickness="0.1mm"
      />
      <trace
        name="C18_V3V3"
        from=".C18 > .pin1"
        to=".U1 > .IOVDD4"
        thickness="0.1mm"
      />
      <trace
        name="C18_GND"
        from=".C18 > .pin2"
        to="net.GND"
        thickness="0.1mm"
      />
    </group>

    <trace
      name="VREG_LX"
      from=".U1 > .VREG_LX"
      to=".L1 > .pin2"
      maxViaCount={0}
      thickness="0.1mm"
    />
    <trace
      name="VREG_AVDD_R_OUT"
      from=".R3 > .pin2"
      to=".U1 > .VREG_AVDD"
      maxViaCount={0}
      thickness="0.1mm"
    />
    <trace
      name="VREG_AVDD_C"
      from=".C9 > .pin1"
      to=".U1 > .VREG_AVDD"
      maxViaCount={0}
      thickness="0.1mm"
    />

    <trace
      name="XIN"
      routingPhaseIndex={clockRoutingPhase}
      from=".U1 > .XIN"
      to=".X1 > .pin1"
      thickness="0.1mm"
    />
    <trace
      name="XOUT_MCU"
      routingPhaseIndex={clockRoutingPhase}
      from=".U1 > .XOUT"
      to=".R2 > .pin1"
      thickness="0.1mm"
    />
    <trace
      name="XOUT_CRYSTAL"
      routingPhaseIndex={clockRoutingPhase}
      from=".R2 > .pin2"
      to=".X1 > .pin3"
      thickness="0.1mm"
    />
    <trace
      name="C3_XIN"
      routingPhaseIndex={clockRoutingPhase}
      from=".C3 > .pin1"
      to=".U1 > .XIN"
      thickness="0.1mm"
    />
    <trace
      name="C3_GND"
      from=".C3 > .pin2"
      to=".X1 > .pin4"
      thickness="0.1mm"
    />
    <trace
      name="C4_XOUT"
      routingPhaseIndex={clockRoutingPhase}
      from=".C4 > .pin1"
      to=".X1 > .pin3"
      thickness="0.1mm"
    />
    <trace name="C4_GND" from=".C4 > .pin2" to="net.GND" thickness="0.1mm" />
    <trace name="X1_GND1" from=".X1 > .pin2" to="net.GND" thickness="0.1mm" />
    <trace name="X1_GND2" from=".X1 > .pin4" to="net.GND" thickness="0.1mm" />

    <trace name="USB_DP_MCU" from=".U1 > .USB_DP" to=".R7 > .pin1" />
    <trace name="USB_DP_OUTPUT" from=".R7 > .pin2" to="net.USB_DP_OUT" />
    <trace name="USB_DM_MCU" from=".U1 > .USB_DM" to=".R8 > .pin1" />
    <trace name="USB_DM_OUTPUT" from=".R8 > .pin2" to="net.USB_DM_OUT" />

    {children}
  </group>
)

export default () => (
  <board
    title="RP2350A Essential Native TSX Reference"
    width="22mm"
    height="28mm"
    layers={4}
    minTraceWidth="0.1mm"
    defaultTraceWidth="0.15mm"
    autorouterVersion="beta_pipeline9"
  >
    <net name="GND" isGroundNet />
    <net name="V3V3" isPowerNet />
    <net name="USB_DP_OUT" />
    <net name="USB_DM_OUT" />
    <RP2350AEssentialKiCadReference pcbY={3} />
  </board>
)
