import React from "react"
import { NRF52832_QFAA_R } from "./imports/NRF52832_QFAA_R"
import { BMA400 } from "./imports/BMA400"
import { A_2450AT18A100E } from "./imports/A_2450AT18A100E"
import { MCP73831T_2ACI_OT } from "./imports/MCP73831T_2ACI_OT"
import { TLV70030DDCR } from "./imports/TLV70030DDCR"
import { X201632MKB4SI } from "./imports/X201632MKB4SI"

// Flat pattern for a ring-size prototype. The wide island carries the QFN and
// crystal; the narrow sections can curve around the finger. Battery and charger
// contacts connect to an external protected single-cell LiPo, not bare lithium.
export default function BluetoothSmartRingFlex() {
  return (
    <board
      name="BluetoothSmartRingFlex"
      title="BLE motion smart ring flex prototype"
      material="flex"
      layers={2}
      thickness="0.13mm"
      solderMaskColor="black"
      outline={[
        { x: -30, y: -3.5 },
        { x: -24, y: -3.5 },
        { x: -22, y: -5.5 },
        { x: -5, y: -5.5 },
        { x: -3, y: -3.5 },
        { x: 29, y: -3.5 },
        { x: 30, y: -2.5 },
        { x: 30, y: 2.5 },
        { x: 29, y: 3.5 },
        { x: -3, y: 3.5 },
        { x: -5, y: 5.5 },
        { x: -22, y: 5.5 },
        { x: -24, y: 3.5 },
        { x: -30, y: 3.5 },
      ]}
      pcbStyle={{
        silkscreenTextVisibility: "hidden",
        viaHoleDiameter: 0.2,
        viaPadDiameter: 0.45,
      }}
    >
      {/* Copper pour omitted to isolate routing from the separate DRC exception. */}
      <pcbstiffener
        name="MCU_STIFFENER"
        shape="rect"
        layer="bottom"
        material="polyimide"
        thickness="0.15mm"
        width="16mm"
        height="10mm"
        pcbX={-13.5}
        pcbY={0}
      />
      <A_2450AT18A100E name="ANT1" pcbX={-27} pcbY={0} />
      <inductor
        name="L1"
        inductance="3.9nH"
        footprint="0402"
        pcbX={-22}
        pcbY={0}
        supplierPartNumbers={{ jlcpcb: ["C77109"] }}
      />
      <capacitor
        name="C_RF"
        capacitance="0.8pF"
        footprint="0402"
        pcbX={-20}
        pcbY={2.4}
      />
      <NRF52832_QFAA_R name="U1" pcbX={-14} pcbY={0} />
      <X201632MKB4SI name="X1" loadCapacitance="8pF" pcbX={-7.3} pcbY={1.8} />
      <capacitor
        name="C_X1"
        capacitance="12pF"
        footprint="0402"
        pcbX={-7.8}
        pcbY={-2.0}
      />
      <capacitor
        name="C_X2"
        capacitance="12pF"
        footprint="0402"
        pcbX={-5.3}
        pcbY={-2.0}
      />

      {/* Nordic QFAA reference decoupling, using its internal LDO mode. */}
      <capacitor
        name="C_DEC1"
        capacitance="100nF"
        footprint="0402"
        pcbX={-19.7}
        pcbY={-3.4}
      />
      <capacitor
        name="C_DEC2"
        capacitance="100nF"
        footprint="0402"
        pcbX={-10.0}
        pcbY={-4.6}
      />
      <capacitor
        name="C_DEC3"
        capacitance="100pF"
        footprint="0402"
        pcbX={-7.6}
        pcbY={-3.4}
      />
      <capacitor
        name="C_DEC4"
        capacitance="1uF"
        footprint="0603"
        pcbX={-18.0}
        pcbY={4.4}
      />
      <capacitor
        name="C_VDD1"
        capacitance="100nF"
        footprint="0402"
        pcbX={-17.0}
        pcbY={-4.4}
      />
      <capacitor
        name="C_VDD2"
        capacitance="100nF"
        footprint="0402"
        pcbX={-9.3}
        pcbY={4.3}
      />
      <capacitor
        name="C_VDD3"
        capacitance="4.7uF"
        footprint="0603"
        pcbX={-6.7}
        pcbY={4.2}
      />

      {/* 3-axis motion sensor on the curved section, I2C address 0x14. */}
      <BMA400 name="U2" pcbX={1.2} pcbY={0} />
      <capacitor
        name="C_IMU"
        capacitance="100nF"
        footprint="0402"
        pcbX={4.0}
        pcbY={1.8}
      />
      <resistor
        name="R_SDA"
        resistance="4.7k"
        footprint="0402"
        pcbX={4.1}
        pcbY={-1.7}
      />
      <resistor
        name="R_SCL"
        resistance="4.7k"
        footprint="0402"
        pcbX={6.7}
        pcbY={-1.7}
      />

      {/* Pogo charging pads supply 5 V to the charger. 47k sets ~21 mA. */}
      <MCP73831T_2ACI_OT name="U3" pcbX={12.7} pcbY={0} />
      <resistor
        name="R_PROG"
        resistance="47k"
        footprint="0402"
        pcbX={10.1}
        pcbY={-2.0}
      />
      <capacitor
        name="C_CHGIN"
        capacitance="1uF"
        footprint="0603"
        pcbX={9.0}
        pcbY={2.2}
      />
      <capacitor
        name="C_BAT"
        capacitance="1uF"
        footprint="0603"
        pcbX={16.8}
        pcbY={2.5}
      />
      <TLV70030DDCR name="U4" pcbX={20} pcbY={0} />
      <capacitor
        name="C_LDOIN"
        capacitance="1uF"
        footprint="0603"
        pcbX={16.5}
        pcbY={-2.3}
      />
      <capacitor
        name="C_LDOOUT"
        capacitance="1uF"
        footprint="0603"
        pcbX={23.6}
        pcbY={-2.3}
      />

      <testpoint
        name="TP_CHG_P"
        footprintVariant="pad"
        padShape="circle"
        padDiameter="1.5mm"
        pcbX={26.4}
        pcbY={2.1}
      />
      <testpoint
        name="TP_CHG_N"
        footprintVariant="pad"
        padShape="circle"
        padDiameter="1.5mm"
        pcbX={28.4}
        pcbY={2.1}
      />
      <testpoint
        name="TP_BAT_P"
        footprintVariant="pad"
        padShape="circle"
        padDiameter="1.4mm"
        pcbX={26.4}
        pcbY={-2.1}
      />
      <testpoint
        name="TP_BAT_N"
        footprintVariant="pad"
        padShape="circle"
        padDiameter="1.4mm"
        pcbX={28.4}
        pcbY={-2.1}
      />
      <testpoint
        name="TP_SWDIO"
        footprintVariant="pad"
        padShape="circle"
        padDiameter="0.9mm"
        pcbX={-4.7}
        pcbY={2.2}
      />
      <testpoint
        name="TP_SWDCLK"
        footprintVariant="pad"
        padShape="circle"
        padDiameter="0.9mm"
        pcbX={-3.0}
        pcbY={2.2}
      />

      {/* RF: terminal 2 on this Johanson antenna is NC. Match in the enclosure. */}
      <trace from=".U1 > .pin30" to=".L1 > .pin1" />
      <trace from=".L1 > .pin2" to=".ANT1 > .pin1" />
      <trace from=".L1 > .pin2" to=".C_RF > .pin1" />
      <trace from=".C_RF > .pin2" to="net.GND" />

      {/* 32 MHz high frequency crystal; 32 kHz clock uses the internal RC. */}
      <trace from=".U1 > .pin34" to=".X1 > .pin1" />
      <trace from=".U1 > .pin35" to=".X1 > .pin3" />
      <trace from=".X1 > .pin1" to=".C_X1 > .pin1" />
      <trace from=".X1 > .pin3" to=".C_X2 > .pin1" />
      <trace from=".X1 > .pin2" to="net.GND" />
      <trace from=".X1 > .pin4" to="net.GND" />
      <trace from=".C_X1 > .pin2" to="net.GND" />
      <trace from=".C_X2 > .pin2" to="net.GND" />

      <trace from=".U1 > .pin1" to=".C_DEC1 > .pin1" />
      <trace from=".U1 > .pin32" to=".C_DEC2 > .pin1" />
      <trace from=".U1 > .pin33" to=".C_DEC3 > .pin1" />
      <trace from=".U1 > .pin46" to=".C_DEC4 > .pin1" />
      <trace from=".C_DEC1 > .pin2" to="net.GND" />
      <trace from=".C_DEC2 > .pin2" to="net.GND" />
      <trace from=".C_DEC3 > .pin2" to="net.GND" />
      <trace from=".C_DEC4 > .pin2" to="net.GND" />
      <trace from=".U1 > .pin13" to="net.V3" />
      <trace from=".U1 > .pin36" to="net.V3" />
      <trace from=".U1 > .pin48" to="net.V3" />
      <trace from=".U1 > .pin31" to="net.GND" />
      <trace from=".U1 > .pin45" to="net.GND" />
      <trace from=".U1 > .pin49" to="net.GND" />
      <trace from=".C_VDD1 > .pin1" to="net.V3" />
      <trace from=".C_VDD2 > .pin1" to="net.V3" />
      <trace from=".C_VDD3 > .pin1" to="net.V3" />
      <trace from=".C_VDD1 > .pin2" to="net.GND" />
      <trace from=".C_VDD2 > .pin2" to="net.GND" />
      <trace from=".C_VDD3 > .pin2" to="net.GND" />

      <trace from=".U1 > .pin14" to=".U2 > .SDX" />
      <trace from=".U1 > .pin15" to=".U2 > .SCX" />
      <trace from=".U1 > .pin16" to=".U2 > .INT1" />
      <trace from=".U2 > .SDX" to=".R_SDA > .pin1" />
      <trace from=".U2 > .SCX" to=".R_SCL > .pin1" />
      <trace from=".R_SDA > .pin2" to="net.V3" />
      <trace from=".R_SCL > .pin2" to="net.V3" />
      <trace from=".U2 > .VDDIO" to="net.V3" />
      <trace from=".U2 > .VDD" to="net.V3" />
      <trace from=".U2 > .CSB" to="net.V3" />
      <trace from=".U2 > .SDO" to="net.GND" />
      <trace from=".U2 > .GNDIO" to="net.GND" />
      <trace from=".U2 > .GND" to="net.GND" />
      <trace from=".C_IMU > .pin1" to="net.V3" />
      <trace from=".C_IMU > .pin2" to="net.GND" />

      <trace from=".TP_CHG_P > .pin1" to="net.VCHG" />
      <trace from=".TP_CHG_N > .pin1" to="net.GND" />
      <trace from=".TP_BAT_P > .pin1" to="net.VBAT" />
      <trace from=".TP_BAT_N > .pin1" to="net.GND" />
      <trace from=".U3 > .pin4" to="net.VCHG" />
      <trace from=".U3 > .pin2" to="net.GND" />
      <trace from=".U3 > .pin3" to="net.VBAT" />
      <trace from=".U3 > .pin5" to=".R_PROG > .pin1" />
      <trace from=".R_PROG > .pin2" to="net.GND" />
      <trace from=".C_CHGIN > .pin1" to="net.VCHG" />
      <trace from=".C_CHGIN > .pin2" to="net.GND" />
      <trace from=".C_BAT > .pin1" to="net.VBAT" />
      <trace from=".C_BAT > .pin2" to="net.GND" />
      <trace from=".U4 > .pin1" to="net.VBAT" />
      <trace from=".U4 > .pin3" to="net.VBAT" />
      <trace from=".U4 > .pin2" to="net.GND" />
      <trace from=".U4 > .pin5" to="net.V3" />
      <trace from=".C_LDOIN > .pin1" to="net.VBAT" />
      <trace from=".C_LDOIN > .pin2" to="net.GND" />
      <trace from=".C_LDOOUT > .pin1" to="net.V3" />
      <trace from=".C_LDOOUT > .pin2" to="net.GND" />
      <trace from=".U1 > .pin26" to=".TP_SWDIO > .pin1" />
      <trace from=".U1 > .pin25" to=".TP_SWDCLK > .pin1" />
    </board>
  )
}
